import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GradeAuditAction, Prisma, Role } from '@prisma/client';

import { CreateGradeDto } from './dto/create-grade.dto';

type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

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

    const nextComment = dto.comment ?? null;

    return this.prisma.$transaction(async (tx) => {
      const existingGrade = await tx.grade.findUnique({
        where: {
          lessonId_studentId: {
            lessonId: dto.lessonId,
            studentId: dto.studentId,
          },
        },
        select: {
          id: true,
          value: true,
          comment: true,
        },
      });

      if (existingGrade) {
        if (
          existingGrade.value === dto.value &&
          existingGrade.comment === nextComment
        ) {
          return tx.grade.findUniqueOrThrow({
            where: {
              id: existingGrade.id,
            },
            include: this.gradeInclude,
          });
        }

        const updatedGrade = await tx.grade.update({
          where: {
            id: existingGrade.id,
          },
          data: {
            value: dto.value,
            comment: nextComment,
          },
          include: this.gradeInclude,
        });

        await tx.gradeAuditLog.create({
          data: {
            gradeId: updatedGrade.id,
            lessonId: dto.lessonId,
            studentId: dto.studentId,
            teacherId: teacher.id,
            action: GradeAuditAction.UPDATED,
            oldValue: existingGrade.value,
            newValue: dto.value,
            oldComment: existingGrade.comment,
            newComment: nextComment,
          },
        });

        return updatedGrade;
      }

      const createdGrade = await tx.grade.create({
        data: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
          value: dto.value,
          comment: nextComment,
        },
        include: this.gradeInclude,
      });

      await tx.gradeAuditLog.create({
        data: {
          gradeId: createdGrade.id,
          lessonId: dto.lessonId,
          studentId: dto.studentId,
          teacherId: teacher.id,
          action: GradeAuditAction.CREATED,
          oldValue: null,
          newValue: dto.value,
          oldComment: null,
          newComment: nextComment,
        },
      });

      return createdGrade;
    });
  }

  async findAuditLog(user: AuthenticatedUser, gradeId: number) {
    const grade = await this.prisma.grade.findUnique({
      where: {
        id: gradeId,
      },
      select: {
        id: true,
        lesson: {
          select: {
            teacher: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    if (user.role === Role.TEACHER && grade.lesson.teacher.userId !== user.id) {
      throw new ForbiddenException('You can view only your own grade history');
    }

    return this.prisma.gradeAuditLog.findMany({
      where: {
        gradeId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
