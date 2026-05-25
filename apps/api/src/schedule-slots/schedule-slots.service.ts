import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, WeekType } from '@prisma/client';

import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';

// TODO: как будто бы где то было)))
type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

type ScheduleSlotConflictCandidate = {
  classId: number;
  subjectId: number;
  teacherId: number;
  classroomId: number;
  dayOfWeek: CreateScheduleSlotDto['dayOfWeek'];
  startTime: Date;
  endTime: Date;
  weekType: CreateScheduleSlotDto['weekType'];
};

@Injectable()
export class ScheduleSlotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.scheduleSlot.findMany({
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

  async findOne(id: number) {
    const scheduleSlot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
      include: this.scheduleSlotInclude,
    });

    if (!scheduleSlot) {
      throw new NotFoundException('Schedule slot not found');
    }

    return scheduleSlot;
  }

  async findMine(user: AuthenticatedUser) {
    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      return this.findByWhere({ teacherId: teacher.id });
    }

    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { classId: true },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      return this.findByWhere({ classId: student.classId });
    }

    throw new ForbiddenException('Schedule is available only for profiles');
  }

  async create(dto: CreateScheduleSlotDto) {
    const data = this.toCreateData(dto);

    await this.validateNoConflicts(data);

    return this.prisma.scheduleSlot.create({
      data,
      include: this.scheduleSlotInclude,
    });
  }

  async update(id: number, dto: UpdateScheduleSlotDto) {
    const scheduleSlot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
    });

    if (!scheduleSlot) {
      throw new NotFoundException('Schedule slot not found');
    }

    const data = this.toUpdateData(dto);
    const candidate = {
      classId: dto.classId ?? scheduleSlot.classId,
      subjectId: dto.subjectId ?? scheduleSlot.subjectId,
      teacherId: dto.teacherId ?? scheduleSlot.teacherId,
      classroomId: dto.classroomId ?? scheduleSlot.classroomId,
      dayOfWeek: dto.dayOfWeek ?? scheduleSlot.dayOfWeek,
      startTime: dto.startTime
        ? this.parseTime(dto.startTime, 'startTime')
        : scheduleSlot.startTime,
      endTime: dto.endTime
        ? this.parseTime(dto.endTime, 'endTime')
        : scheduleSlot.endTime,
      weekType: dto.weekType ?? scheduleSlot.weekType,
    };

    await this.validateNoConflicts(candidate, id);

    return this.prisma.scheduleSlot.update({
      where: { id },
      data,
      include: this.scheduleSlotInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.scheduleSlot.delete({
      where: { id },
      include: this.scheduleSlotInclude,
    });
  }

  getOptions() {
    return Promise.all([
      this.prisma.class.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.subject.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.teacher.findMany({
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.classroom.findMany({ orderBy: { id: 'asc' } }),
    ]).then(([classes, subjects, teachers, classrooms]) => ({
      classes,
      subjects,
      teachers,
      classrooms,
    }));
  }

  private findByWhere(where: Prisma.ScheduleSlotWhereInput) {
    return this.prisma.scheduleSlot.findMany({
      where,
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

  private toCreateData(
    dto: CreateScheduleSlotDto,
  ): ScheduleSlotConflictCandidate {
    return {
      classId: dto.classId,
      subjectId: dto.subjectId,
      teacherId: dto.teacherId,
      classroomId: dto.classroomId,
      dayOfWeek: dto.dayOfWeek,
      startTime: this.parseTime(dto.startTime, 'startTime'),
      endTime: this.parseTime(dto.endTime, 'endTime'),
      weekType: dto.weekType,
    };
  }

  private toUpdateData(
    dto: UpdateScheduleSlotDto,
  ): Prisma.ScheduleSlotUncheckedUpdateInput {
    return {
      classId: dto.classId,
      subjectId: dto.subjectId,
      teacherId: dto.teacherId,
      classroomId: dto.classroomId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime
        ? this.parseTime(dto.startTime, 'startTime')
        : undefined,
      endTime: dto.endTime ? this.parseTime(dto.endTime, 'endTime') : undefined,
      weekType: dto.weekType,
    };
  }

  private parseTime(value: string, field: string) {
    const match = /^(\d{2}):(\d{2})$/.exec(value);

    if (!match) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }

      throw new BadRequestException(`${field} must be a time or date`);
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) {
      throw new BadRequestException(`${field} must be a valid time`);
    }

    return new Date(1970, 0, 1, hours, minutes);
  }

  private async validateNoConflicts(
    candidate: ScheduleSlotConflictCandidate,
    excludeId?: number,
  ) {
    if (candidate.startTime >= candidate.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const [teacherConflict, classConflict, classroomConflict] =
      await Promise.all([
        this.findConflict(
          {
            teacherId: candidate.teacherId,
          },
          candidate,
          excludeId,
        ),
        this.findConflict(
          {
            classId: candidate.classId,
          },
          candidate,
          excludeId,
        ),
        this.findConflict(
          {
            classroomId: candidate.classroomId,
          },
          candidate,
          excludeId,
        ),
      ]);

    if (teacherConflict) {
      throw new BadRequestException('Teacher is already busy at this time');
    }

    if (classConflict) {
      throw new BadRequestException('Class is already busy at this time');
    }

    if (classroomConflict) {
      throw new BadRequestException('Classroom is already busy at this time');
    }
  }

  private findConflict(
    resourceWhere: Pick<
      Prisma.ScheduleSlotWhereInput,
      'teacherId' | 'classId' | 'classroomId'
    >,
    candidate: ScheduleSlotConflictCandidate,
    excludeId?: number,
  ) {
    return this.prisma.scheduleSlot.findFirst({
      where: {
        ...resourceWhere,
        id: excludeId ? { not: excludeId } : undefined,
        dayOfWeek: candidate.dayOfWeek,
        startTime: {
          lt: candidate.endTime,
        },
        endTime: {
          gt: candidate.startTime,
        },
        weekType: this.weekTypeConflictFilter(candidate.weekType),
      },
      select: {
        id: true,
      },
    });
  }

  private weekTypeConflictFilter(weekType: CreateScheduleSlotDto['weekType']) {
    if (weekType === 'EVERY') {
      return undefined;
    }

    return {
      in: [WeekType.EVERY, weekType],
    };
  }

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
  } satisfies Prisma.ScheduleSlotInclude;
}
