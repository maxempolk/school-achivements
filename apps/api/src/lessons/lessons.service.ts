import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { AdminCreateLessonDto } from './dto/admin-create-lesson.dto';
import { CreateLessonFromScheduleSlotDto } from './dto/create-lesson-from-schedule-slot.dto';
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

  create(dto: AdminCreateLessonDto) {
    return this.prisma.lesson.create({
      data: {
        teacherId: dto.teacherId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        classroomId: dto.classroomId ?? undefined,
        scheduleSlotId: dto.scheduleSlotId ?? undefined,
        date: new Date(dto.date),
        topic: dto.topic,
        homework: dto.homework ?? null,
      },
      include: this.lessonInclude,
    });
  }

  async createFromScheduleSlot(
    userId: number,
    dto: CreateLessonFromScheduleSlotDto,
  ) {
    const scheduleSlot = await this.prisma.scheduleSlot.findUnique({
      where: { id: dto.scheduleSlotId },
      select: {
        id: true,
        classId: true,
        subjectId: true,
        teacherId: true,
        classroomId: true,
        startTime: true,
        teacher: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!scheduleSlot) {
      throw new NotFoundException('Schedule slot not found');
    }

    if (scheduleSlot.teacher.userId !== userId) {
      throw new ForbiddenException(
        'You can start lessons only from your own schedule',
      );
    }

    const lessonDate = this.resolveLessonDate(dto.date, scheduleSlot.startTime);
    const existingLesson = await this.prisma.lesson.findUnique({
      where: {
        scheduleSlotId_date: {
          scheduleSlotId: scheduleSlot.id,
          date: lessonDate,
        },
      },
      include: this.lessonInclude,
    });

    if (existingLesson) {
      return existingLesson;
    }

    return this.prisma.lesson.create({
      data: {
        teacherId: scheduleSlot.teacherId,
        classId: scheduleSlot.classId,
        subjectId: scheduleSlot.subjectId,
        classroomId: scheduleSlot.classroomId,
        scheduleSlotId: scheduleSlot.id,
        date: lessonDate,
        topic: 'New lesson',
        homework: null,
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

  private resolveLessonDate(date: string, slotStartTime: Date) {
    const lessonDate = new Date(date);

    if (Number.isNaN(lessonDate.getTime())) {
      throw new BadRequestException('Invalid lesson date');
    }

    lessonDate.setHours(
      slotStartTime.getHours(),
      slotStartTime.getMinutes(),
      0,
      0,
    );

    return lessonDate;
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
    attendances: {
      select: {
        id: true,
        studentId: true,
        isPresent: true,
      },
    },
  } satisfies Prisma.LessonInclude;
}
