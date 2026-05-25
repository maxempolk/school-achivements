import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: number, dto: UpsertAttendanceDto) {
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
      throw new ForbiddenException(
        'You can mark attendance only for your own lessons',
      );
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
      throw new ForbiddenException(
        'Student does not belong to the lesson class',
      );
    }

    return this.prisma.attendance.upsert({
      where: {
        lessonId_studentId: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
        },
      },
      create: {
        lessonId: dto.lessonId,
        studentId: dto.studentId,
        isPresent: dto.isPresent,
      },
      update: {
        isPresent: dto.isPresent,
      },
      include: this.attendanceInclude,
    });
  }

  findByStudentId(studentId: number) {
    return this.prisma.attendance.findMany({
      where: {
        studentId,
      },
      include: this.attendanceDetailsInclude,
      orderBy: {
        lesson: {
          date: 'desc',
        },
      },
    });
  }

  private readonly attendanceInclude = {
    lesson: {
      select: {
        id: true,
        date: true,
        topic: true,
      },
    },
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  } satisfies Prisma.AttendanceInclude;

  private readonly attendanceDetailsInclude = {
    lesson: {
      select: {
        id: true,
        date: true,
        topic: true,
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
  } satisfies Prisma.AttendanceInclude;
}
