import { AuthenticatedUser } from '@/auth/types';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    isSuperAdmin: true,
    teacher: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classes: {
          select: {
            classId: true,
          },
        },
        subjects: {
          select: {
            subjectId: true,
          },
        },
      },
    },
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classId: true,
      },
    },
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

  async create(requester: AuthenticatedUser, dto: CreateUserDto) {
    if (dto.role === Role.ADMIN && !requester.isSuperAdmin) {
      throw new ForbiddenException(
        'Only the super admin can create administrators',
      );
    }

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

  async update(requester: AuthenticatedUser, id: number, dto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });

      if (!target) {
        throw new NotFoundException('User not found');
      }

      const touchesAdminAccount =
        target.role === Role.ADMIN || dto.role === Role.ADMIN;

      if (touchesAdminAccount && !requester.isSuperAdmin) {
        throw new ForbiddenException(
          'Only the super admin can manage administrators',
        );
      }

      if (dto.isSuperAdmin !== undefined && !requester.isSuperAdmin) {
        throw new ForbiddenException(
          'Only the super admin can grant or revoke the super admin flag',
        );
      }

      const losesSuperAdminStatus =
        target.isSuperAdmin &&
        (dto.isSuperAdmin === false ||
          (dto.role !== undefined && dto.role !== Role.ADMIN));

      if (losesSuperAdminStatus) {
        await this.ensureNotLastSuperAdmin(tx);
      }

      const password = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined;

      const user = await tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          password,
          role: dto.role,
          isSuperAdmin: dto.isSuperAdmin,
        },
        select: this.publicUserSelect,
      });

      if (dto.role) {
        await this.ensureProfileForRole(tx, user, dto);
      }

      return user;
    });
  }

  async remove(requester: AuthenticatedUser, id: number) {
    if (requester.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const target = await this.findById(id);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === Role.ADMIN && !requester.isSuperAdmin) {
      throw new ForbiddenException(
        'Only the super admin can manage administrators',
      );
    }

    if (target.isSuperAdmin) {
      await this.ensureNotLastSuperAdmin(this.prisma);
    }

    return this.prisma.user.delete({
      where: { id },
      select: this.publicUserSelect,
    });
  }

  private async ensureNotLastSuperAdmin(
    client: PrismaService | Prisma.TransactionClient,
  ) {
    const superAdminCount = await client.user.count({
      where: { isSuperAdmin: true },
    });

    if (superAdminCount <= 1) {
      throw new ForbiddenException(
        'Cannot remove or demote the last super admin',
      );
    }
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
        if (dto.profile) {
          await tx.teacher.update({
            where: { id: existingTeacher.id },
            data: {
              firstName: dto.profile.firstName,
              lastName: dto.profile.lastName,
            },
          });
        }

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
        if (dto.profile) {
          await tx.student.update({
            where: { id: existingStudent.id },
            data: {
              firstName: dto.profile.firstName,
              lastName: dto.profile.lastName,
              classId: dto.profile.classId,
            },
          });
        }

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
