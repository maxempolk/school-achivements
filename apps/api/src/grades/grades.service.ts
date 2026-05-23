import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateGradeDto } from './dto/create-grade.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateGradeDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher profile is required');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      select: {
        id: true,
        classId: true,
        teacherId: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.teacherId !== teacher.id) {
      throw new ForbiddenException('You can grade only your own lessons');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: {
        id: true,
        classId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.classId !== lesson.classId) {
      throw new BadStudentClassException();
    }

    return this.prisma.grade.upsert({
      where: {
        lessonId_studentId: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
        },
      },
      create: {
        lessonId: dto.lessonId,
        studentId: dto.studentId,
        value: dto.value,
        comment: dto.comment ?? null,
      },
      update: {
        value: dto.value,
        comment: dto.comment ?? null,
      },
      include: this.gradeInclude,
    });
  }

  findByStudentId(studentId: number) {
    return this.prisma.grade.findMany({
      where: {
        studentId,
      },
      include: this.gradeInclude,
      orderBy: {
        lesson: {
          date: 'desc',
        },
      },
    });
  }

  private readonly gradeInclude = {
    lesson: {
      select: {
        id: true,
        date: true,
        topic: true,
        homework: true,
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  } satisfies Prisma.GradeInclude;
}

class BadStudentClassException extends ForbiddenException {
  constructor() {
    super('Student does not belong to the lesson class');
  }
}
