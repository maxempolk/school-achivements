import { AuthenticatedUser } from '@/auth/types';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthenticatedUser) {
    if (user.role === Role.TEACHER) {
      return this.prisma.class.findMany({
        where: {
          teachers: {
            some: {
              teacher: {
                userId: user.id,
              },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });
    }

    return this.prisma.class.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(user: AuthenticatedUser, id: number) {
    const classEntity = await this.findOneForAdmin(id);

    if (user.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherClass.findFirst({
        where: {
          classId: id,
          teacher: {
            userId: user.id,
          },
        },
        select: {
          teacherId: true,
        },
      });

      if (!assignment) {
        throw new ForbiddenException('You can view only your own classes');
      }
    }

    return classEntity;
  }

  create(dto: CreateClassDto) {
    return this.prisma.class.create({
      data: dto,
    });
  }

  async update(id: number, dto: UpdateClassDto) {
    await this.findOneForAdmin(id);

    return this.prisma.class.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOneForAdmin(id);

    return this.prisma.class.delete({
      where: { id },
    });
  }

  private async findOneForAdmin(id: number) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }
}
