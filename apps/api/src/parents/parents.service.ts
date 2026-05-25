import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findChildrenByUserId(userId: number) {
    const parent = await this.findParentByUserId(userId);

    return parent.children.map(({ student }) => student);
  }

  async findChildGrades(userId: number, studentId: number) {
    await this.assertChildBelongsToParent(userId, studentId);

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

  async findChildAttendance(userId: number, studentId: number) {
    await this.assertChildBelongsToParent(userId, studentId);

    return this.prisma.attendance.findMany({
      where: {
        studentId,
      },
      include: this.attendanceInclude,
      orderBy: {
        lesson: {
          date: 'desc',
        },
      },
    });
  }

  async findChildSchedule(userId: number, studentId: number) {
    const student = await this.assertChildBelongsToParent(userId, studentId);

    return this.prisma.scheduleSlot.findMany({
      where: {
        classId: student.classId,
      },
      include: this.scheduleSlotInclude,
      orderBy: [
        {
          dayOfWeek: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
    });
  }

  async updateStudents(parentId: number, studentIds: number[]) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const uniqueStudentIds = [...new Set(studentIds)];
    const studentsCount = await this.prisma.student.count({
      where: {
        id: {
          in: uniqueStudentIds,
        },
      },
    });

    if (studentsCount !== uniqueStudentIds.length) {
      throw new NotFoundException('One or more students were not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.parentStudent.deleteMany({
        where: {
          parentId,
        },
      });

      if (uniqueStudentIds.length > 0) {
        await tx.parentStudent.createMany({
          data: uniqueStudentIds.map((studentId) => ({
            parentId,
            studentId,
          })),
        });
      }

      return tx.parent.findUnique({
        where: { id: parentId },
        include: this.parentChildrenInclude,
      });
    });
  }

  private async findParentByUserId(userId: number) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: this.parentChildrenInclude,
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  private async assertChildBelongsToParent(userId: number, studentId: number) {
    const parent = await this.findParentByUserId(userId);
    const child = parent.children.find(
      ({ student }) => student.id === studentId,
    );

    if (!child) {
      throw new ForbiddenException('You can view only your own children');
    }

    return child.student;
  }

  private readonly parentChildrenInclude = {
    children: {
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            classId: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    },
  } as const satisfies Prisma.ParentInclude;

  private readonly lessonSummarySelect = {
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
  } as const satisfies Prisma.LessonSelect;

  private readonly gradeInclude = {
    lesson: {
      select: this.lessonSummarySelect,
    },
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  } as const satisfies Prisma.GradeInclude;

  private readonly attendanceInclude = {
    lesson: {
      select: this.lessonSummarySelect,
    },
  } as const satisfies Prisma.AttendanceInclude;

  private readonly scheduleSlotInclude = {
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
    classroom: {
      select: {
        id: true,
        number: true,
        building: true,
      },
    },
    lessons: {
      select: {
        id: true,
        date: true,
      },
    },
  } as const satisfies Prisma.ScheduleSlotInclude;
}
