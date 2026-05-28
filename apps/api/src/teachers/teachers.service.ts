import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAssignments(teacherId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: this.teacherAssignmentsInclude,
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async updateAssignments(
    teacherId: number,
    classIds: number[],
    subjectIds: number[],
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const uniqueClassIds = [...new Set(classIds)];
    const uniqueSubjectIds = [...new Set(subjectIds)];

    const [classesCount, subjectsCount] = await Promise.all([
      this.prisma.class.count({
        where: {
          id: {
            in: uniqueClassIds,
          },
        },
      }),
      this.prisma.subject.count({
        where: {
          id: {
            in: uniqueSubjectIds,
          },
        },
      }),
    ]);

    if (classesCount !== uniqueClassIds.length) {
      throw new NotFoundException('One or more classes were not found');
    }

    if (subjectsCount !== uniqueSubjectIds.length) {
      throw new NotFoundException('One or more subjects were not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.teacherClass.deleteMany({ where: { teacherId } }),
        tx.teacherSubject.deleteMany({ where: { teacherId } }),
      ]);

      await Promise.all([
        uniqueClassIds.length > 0
          ? tx.teacherClass.createMany({
              data: uniqueClassIds.map((classId) => ({
                teacherId,
                classId,
              })),
            })
          : Promise.resolve(),
        uniqueSubjectIds.length > 0
          ? tx.teacherSubject.createMany({
              data: uniqueSubjectIds.map((subjectId) => ({
                teacherId,
                subjectId,
              })),
            })
          : Promise.resolve(),
      ]);

      return tx.teacher.findUnique({
        where: { id: teacherId },
        include: this.teacherAssignmentsInclude,
      });
    });
  }

  private readonly teacherAssignmentsInclude = {
    classes: {
      include: {
        class: true,
      },
      orderBy: {
        class: {
          name: 'asc',
        },
      },
    },
    subjects: {
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    },
  } as const satisfies Prisma.TeacherInclude;
}
