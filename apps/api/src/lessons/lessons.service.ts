import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

type LessonFilters = {
  teacherId?: string;
  classId?: string;
  date?: string;
};

// TODO: вроде как где то уже есть такой тип.
type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateLessonDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher profile is required');
    }

    return this.prisma.lesson.create({
      data: {
        teacherId: teacher.id,
        classId: dto.classId,
        subjectId: dto.subjectId,
        date: new Date(dto.date),
        topic: dto.topic,
        homework: dto.homework ?? null,
      },
      include: this.lessonInclude,
    });
  }

  async findAll(user: AuthenticatedUser, filters: LessonFilters) {
    const where: Prisma.LessonWhereInput = {};

    if (user.role === Role.TEACHER) {
      where.teacher = {
        userId: user.id,
      };
    } else if (filters.teacherId) {
      where.teacherId = this.parsePositiveInt(filters.teacherId, 'teacherId');
    }

    if (filters.classId) {
      where.classId = this.parsePositiveInt(filters.classId, 'classId');
    }

    if (filters.date) {
      const date = new Date(filters.date);

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date filter');
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    return this.prisma.lesson.findMany({
      where,
      include: this.lessonInclude,
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(user: AuthenticatedUser, id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.lessonDetailsInclude,
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (user.role === Role.TEACHER && lesson.teacher.userId !== user.id) {
      throw new ForbiddenException('You can view only your own lessons');
    }

    return lesson;
  }

  async update(userId: number, id: number, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        teacher: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.teacher.userId !== userId) {
      throw new ForbiddenException('You can update only your own lessons');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        topic: dto.topic,
        homework: dto.homework ?? undefined,
      },
      include: this.lessonDetailsInclude,
    });
  }

  private parsePositiveInt(value: string, field: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} must be a positive integer`);
    }

    return parsed;
  }

  private readonly lessonInclude = {
    teacher: {
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    },
    class: {
      select: {
        id: true,
        name: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
        shortName: true,
      },
    },
  } satisfies Prisma.LessonInclude;

  private readonly lessonDetailsInclude = {
    ...this.lessonInclude,
    grades: {
      select: {
        id: true,
        studentId: true,
        value: true,
        comment: true,
      },
    },
  } satisfies Prisma.LessonInclude;
}
