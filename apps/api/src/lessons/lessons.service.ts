import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, NotificationType } from '@prisma/client';

import { AdminCreateLessonDto } from './dto/admin-create-lesson.dto';
import { CreateLessonFromScheduleSlotDto } from './dto/create-lesson-from-schedule-slot.dto';
import { GetLessonsQueryDtoType } from './dto/get-lessons-query.dto';
import { GetJournalQueryDtoType } from './dto/get-journal-query.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { NotificationsService } from '../notifications/notifications.service';

// TODO: вроде как где то уже есть такой тип.
type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: AdminCreateLessonDto) {
    const result = await this.prisma.lesson.create({
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

    if (dto.homework) {
      await this.sendHomeworkNotification(result);
    }

    return result;
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

  async findAll(user: AuthenticatedUser, filters: GetLessonsQueryDtoType) {
    const where: Prisma.LessonWhereInput = {};

    if (user.role === Role.TEACHER) {
      where.teacher = {
        userId: user.id,
      };
    } else if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters.classId) {
      where.classId = filters.classId;
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

  async findJournal(userId: number, filters: GetJournalQueryDtoType) {
    const { classId, subjectId } = filters;
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        classes: {
          where: {
            classId,
          },
          select: {
            classId: true,
          },
        },
        subjects: {
          where: {
            subjectId,
          },
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

    if (teacher.subjects.length === 0) {
      throw new ForbiddenException('You can view only your own subjects');
    }

    return this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        classId,
        subjectId,
      },
      include: this.lessonDetailsInclude,
      orderBy: {
        date: 'asc',
      },
    });
  }

  async update(userId: number, id: number, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        homework: true,
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

    const result = await this.prisma.lesson.update({
      where: { id },
      data: {
        topic: dto.topic,
        homework: dto.homework ?? undefined,
      },
      include: this.lessonDetailsInclude,
    });

    if (dto.homework !== undefined && dto.homework !== lesson.homework) {
      await this.sendHomeworkNotification(result);
    }

    return result;
  }

  private async sendHomeworkNotification(lesson: {
    id: number;
    classId: number;
    date: Date;
    homework: string | null;
    subject: {
      name: string;
    };
  }) {
    if (!lesson.homework) return;
    try {
      const subjectName = lesson.subject.name;
      const formattedDate = new Date(lesson.date).toLocaleDateString('uk-UA');
      const title = 'Домашнє завдання оновлено';
      const message = `Оновлено домашнє завдання з предмету "${subjectName}" на ${formattedDate}: ${lesson.homework}`;

      await this.notificationsService.notifyClassAndParents(
        lesson.classId,
        NotificationType.HOMEWORK_UPDATED,
        title,
        message,
        { lessonId: lesson.id },
      );
    } catch (err) {
      console.error('Failed to send homework notification:', err);
    }
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
