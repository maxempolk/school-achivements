import { GetPerformanceQueryDtoType } from './dto/get-performance-query.dto';
import { AuthenticatedUser } from '@/auth/types';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

type SubjectTotals = {
  subject: {
    id: number;
    name: string;
    shortName: string | null;
  };
  gradeSum: number;
  gradeCount: number;
};

type StudentTotals = {
  student: {
    id: number;
    firstName: string;
    lastName: string;
  };
  gradeSum: number;
  gradeCount: number;
  absenceCount: number;
  attendanceCount: number;
  presentCount: number;
  subjects: Map<number, SubjectTotals>;
};

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getPerformance(
    user: AuthenticatedUser,
    filters: GetPerformanceQueryDtoType,
  ) {
    const { classId, subjectId } = filters;

    await this.ensureAccess(user, classId, subjectId);

    const lessonWhere = {
      classId,
      ...(subjectId ? { subjectId } : {}),
    };

    const [classEntity, subject, students, grades, attendances] =
      await Promise.all([
        this.prisma.class.findUnique({
          where: { id: classId },
          select: {
            id: true,
            name: true,
          },
        }),
        subjectId
          ? this.prisma.subject.findUnique({
              where: { id: subjectId },
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            })
          : Promise.resolve(null),
        this.prisma.student.findMany({
          where: {
            classId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        }),
        this.prisma.grade.findMany({
          where: {
            lesson: lessonWhere,
          },
          select: {
            studentId: true,
            value: true,
            lesson: {
              select: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.attendance.findMany({
          where: {
            lesson: lessonWhere,
          },
          select: {
            studentId: true,
            isPresent: true,
          },
        }),
      ]);

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    if (subjectId && !subject) {
      throw new NotFoundException('Subject not found');
    }

    const studentTotals = new Map<number, StudentTotals>();
    const subjectTotals = new Map<number, SubjectTotals>();
    let classGradeSum = 0;
    let classGradeCount = 0;
    let classAbsenceCount = 0;
    let classAttendanceCount = 0;
    let classPresentCount = 0;

    for (const student of students) {
      studentTotals.set(student.id, {
        student,
        gradeSum: 0,
        gradeCount: 0,
        absenceCount: 0,
        attendanceCount: 0,
        presentCount: 0,
        subjects: new Map(),
      });
    }

    for (const grade of grades) {
      const studentTotal = studentTotals.get(grade.studentId);
      const subjectValue = grade.lesson.subject;
      const existingSubjectTotal = subjectTotals.get(subjectValue.id) ?? {
        subject: subjectValue,
        gradeSum: 0,
        gradeCount: 0,
      };

      existingSubjectTotal.gradeSum += grade.value;
      existingSubjectTotal.gradeCount += 1;
      subjectTotals.set(subjectValue.id, existingSubjectTotal);

      classGradeSum += grade.value;
      classGradeCount += 1;

      if (!studentTotal) {
        continue;
      }

      const existingStudentSubjectTotal = studentTotal.subjects.get(
        subjectValue.id,
      ) ?? {
        subject: subjectValue,
        gradeSum: 0,
        gradeCount: 0,
      };

      existingStudentSubjectTotal.gradeSum += grade.value;
      existingStudentSubjectTotal.gradeCount += 1;
      studentTotal.subjects.set(subjectValue.id, existingStudentSubjectTotal);

      studentTotal.gradeSum += grade.value;
      studentTotal.gradeCount += 1;
    }

    for (const attendance of attendances) {
      const studentTotal = studentTotals.get(attendance.studentId);

      classAttendanceCount += 1;

      if (attendance.isPresent) {
        classPresentCount += 1;
      } else {
        classAbsenceCount += 1;
      }

      if (!studentTotal) {
        continue;
      }

      studentTotal.attendanceCount += 1;

      if (attendance.isPresent) {
        studentTotal.presentCount += 1;
      } else {
        studentTotal.absenceCount += 1;
      }
    }

    return {
      filters: {
        class: classEntity,
        subject,
      },
      classStats: {
        studentCount: students.length,
        averageGrade: this.toAverage(classGradeSum, classGradeCount),
        gradeCount: classGradeCount,
        absenceCount: classAbsenceCount,
        attendanceCount: classAttendanceCount,
        attendanceRate: this.toPercent(classPresentCount, classAttendanceCount),
      },
      subjectStats: [...subjectTotals.values()]
        .map((total) => ({
          subject: total.subject,
          averageGrade: this.toAverage(total.gradeSum, total.gradeCount),
          gradeCount: total.gradeCount,
        }))
        .sort((a, b) => a.subject.name.localeCompare(b.subject.name)),
      students: [...studentTotals.values()].map((total) => ({
        student: total.student,
        averageGrade: this.toAverage(total.gradeSum, total.gradeCount),
        gradeCount: total.gradeCount,
        absenceCount: total.absenceCount,
        attendanceCount: total.attendanceCount,
        attendanceRate: this.toPercent(
          total.presentCount,
          total.attendanceCount,
        ),
        subjectStats: [...total.subjects.values()]
          .map((subjectTotal) => ({
            subject: subjectTotal.subject,
            averageGrade: this.toAverage(
              subjectTotal.gradeSum,
              subjectTotal.gradeCount,
            ),
            gradeCount: subjectTotal.gradeCount,
          }))
          .sort((a, b) => a.subject.name.localeCompare(b.subject.name)),
      })),
    };
  }

  private async ensureAccess(
    user: AuthenticatedUser,
    classId: number,
    subjectId?: number,
  ) {
    if (user.role === Role.ADMIN) {
      return;
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        classes: {
          where: {
            classId,
          },
          select: {
            classId: true,
          },
        },
        subjects: subjectId
          ? {
              where: {
                subjectId,
              },
              select: {
                subjectId: true,
              },
            }
          : {
              select: {
                subjectId: true,
              },
            },
      },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher profile is required');
    }

    if (teacher.classes.length === 0) {
      throw new ForbiddenException('You can view only your own classes');
    }

    if (subjectId && teacher.subjects.length === 0) {
      throw new ForbiddenException('You can view only your own subjects');
    }
  }

  private toAverage(sum: number, count: number) {
    if (count === 0) {
      return null;
    }

    return Math.round((sum / count) * 100) / 100;
  }

  private toPercent(value: number, total: number) {
    if (total === 0) {
      return null;
    }

    return Math.round((value / total) * 100);
  }
}
