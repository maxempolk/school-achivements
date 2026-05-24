import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';

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

  create(dto: CreateScheduleSlotDto) {
    return this.prisma.scheduleSlot.create({
      data: this.toCreateData(dto),
      include: this.scheduleSlotInclude,
    });
  }

  async update(id: number, dto: UpdateScheduleSlotDto) {
    await this.findOne(id);

    return this.prisma.scheduleSlot.update({
      where: { id },
      data: this.toUpdateData(dto),
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

  private toCreateData(
    dto: CreateScheduleSlotDto,
  ): Prisma.ScheduleSlotUncheckedCreateInput {
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
