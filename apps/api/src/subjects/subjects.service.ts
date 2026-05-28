import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthenticatedUser) {
    if (user.role === Role.TEACHER) {
      return this.prisma.subject.findMany({
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

    return this.prisma.subject.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(user: AuthenticatedUser, id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (user.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherSubject.findFirst({
        where: {
          subjectId: id,
          teacher: {
            userId: user.id,
          },
        },
        select: {
          teacherId: true,
        },
      });

      if (!assignment) {
        throw new ForbiddenException('You can view only your own subjects');
      }
    }

    return subject;
  }

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: dto,
    });
  }

  async update(id: number, dto: UpdateSubjectDto) {
    await this.findOneForAdmin(id);

    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOneForAdmin(id);

    return this.prisma.subject.delete({
      where: { id },
    });
  }

  // TODO: findOneForAdmin дублируется
  private async findOneForAdmin(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }
}
