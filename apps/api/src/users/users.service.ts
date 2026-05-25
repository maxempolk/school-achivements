import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UserProfileCreator = (
  tx: Prisma.TransactionClient,
  user: { id: number; email: string },
  dto: CreateUserDto,
) => Promise<void>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicUserSelect = {
    id: true,
    email: true,
    role: true,
    parent: {
      select: {
        id: true,
        children: {
          select: {
            studentId: true,
          },
        },
      },
    },
  };

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.publicUserSelect,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password,
          role: dto.role,
        },
        select: this.publicUserSelect,
      });

      await this.createProfileForRole(tx, user, dto);

      return user;
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    const password = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          password,
          role: dto.role,
        },
        select: this.publicUserSelect,
      });

      if (dto.role) {
        await this.ensureProfileForRole(tx, user, dto);
      }

      return user;
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      select: this.publicUserSelect,
    });
  }

  private async createProfileForRole(
    tx: Prisma.TransactionClient,
    user: { id: number; email: string; role: Role },
    dto: CreateUserDto,
  ) {
    const creator = this.profileCreators[user.role];

    if (!creator) {
      return;
    }

    await creator(tx, user, dto);
  }

  private async ensureProfileForRole(
    tx: Prisma.TransactionClient,
    user: { id: number; email: string; role: Role },
    dto: UpdateUserDto,
  ) {
    if (user.role === Role.TEACHER) {
      const existingTeacher = await tx.teacher.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (existingTeacher) {
        return;
      }

      const { firstName, lastName } = this.resolveProfileName(dto, user.email);

      await tx.teacher.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
        },
      });
      return;
    }

    if (user.role === Role.STUDENT) {
      const existingStudent = await tx.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (existingStudent) {
        return;
      }

      const { firstName, lastName } = this.resolveProfileName(dto, user.email);
      const classId =
        dto.profile?.classId ?? (await this.resolveDefaultClassId(tx));

      await tx.student.create({
        data: {
          userId: user.id,
          classId,
          firstName,
          lastName,
        },
      });
      return;
    }

    if (user.role === Role.PARENT) {
      const existingParent = await tx.parent.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (existingParent) {
        return;
      }

      await tx.parent.create({
        data: {
          userId: user.id,
        },
      });
    }
  }

  private readonly profileCreators: Partial<Record<Role, UserProfileCreator>> =
    {
      [Role.TEACHER]: async (tx, user, dto) => {
        const { firstName, lastName } = this.resolveProfileName(
          dto,
          user.email,
        );

        await tx.teacher.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
          },
        });
      },
      [Role.STUDENT]: async (tx, user, dto) => {
        const { firstName, lastName } = this.resolveProfileName(
          dto,
          user.email,
        );
        const classId =
          dto.profile?.classId ?? (await this.resolveDefaultClassId(tx));

        await tx.student.create({
          data: {
            userId: user.id,
            classId,
            firstName,
            lastName,
          },
        });
      },
      [Role.PARENT]: async (tx, user) => {
        await tx.parent.create({
          data: {
            userId: user.id,
          },
        });
      },
    };

  private resolveProfileName(
    dto: CreateUserDto | UpdateUserDto,
    email: string,
  ) {
    const fallbackName = email.split('@')[0] || 'User';

    return {
      firstName: dto.profile?.firstName ?? fallbackName,
      lastName: dto.profile?.lastName ?? 'Profile',
    };
  }

  private async resolveDefaultClassId(tx: Prisma.TransactionClient) {
    const existingClass = await tx.class.findFirst({
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
      },
    });

    if (existingClass) {
      return existingClass.id;
    }

    const fallbackClass = await tx.class.create({
      data: {
        name: 'Unassigned',
      },
      select: {
        id: true,
      },
    });

    return fallbackClass.id;
  }
}
