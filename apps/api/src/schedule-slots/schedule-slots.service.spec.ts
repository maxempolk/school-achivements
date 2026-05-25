import { BadRequestException } from '@nestjs/common';
import { WeekType } from '@prisma/client';

import { ScheduleSlotsService } from './schedule-slots.service';

const validDto = {
  classId: 1,
  subjectId: 2,
  teacherId: 3,
  classroomId: 4,
  dayOfWeek: 'MONDAY',
  startTime: '08:00',
  endTime: '08:45',
  weekType: 'EVERY',
} as const;

function createPrismaMock() {
  return {
    scheduleSlot: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 1 }),
    },
    class: {
      findMany: jest.fn(),
    },
    subject: {
      findMany: jest.fn(),
    },
    teacher: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    classroom: {
      findMany: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
  };
}

describe('ScheduleSlotsService', () => {
  it('rejects an overlapping teacher slot', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findFirst
      .mockResolvedValueOnce({ id: 10 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const service = new ScheduleSlotsService(prisma as never);

    await expect(service.create(validDto as never)).rejects.toThrow(
      new BadRequestException('Teacher is already busy at this time'),
    );
    expect(prisma.scheduleSlot.create).not.toHaveBeenCalled();
  });

  it('rejects an overlapping class slot', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 11 })
      .mockResolvedValueOnce(null);
    const service = new ScheduleSlotsService(prisma as never);

    await expect(service.create(validDto as never)).rejects.toThrow(
      new BadRequestException('Class is already busy at this time'),
    );
  });

  it('rejects an overlapping classroom slot', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 12 });
    const service = new ScheduleSlotsService(prisma as never);

    await expect(service.create(validDto as never)).rejects.toThrow(
      new BadRequestException('Classroom is already busy at this time'),
    );
  });

  it('allows odd and even weeks to use the same time slot', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findFirst.mockResolvedValue(null);
    const service = new ScheduleSlotsService(prisma as never);

    await service.create({
      ...validDto,
      weekType: 'ODD',
    } as never);

    expect(prisma.scheduleSlot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          weekType: {
            in: [WeekType.EVERY, 'ODD'],
          },
        }),
      }),
    );
    expect(prisma.scheduleSlot.create).toHaveBeenCalled();
  });

  it('checks every-week slots against every week type', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findFirst.mockResolvedValue(null);
    const service = new ScheduleSlotsService(prisma as never);

    await service.create(validDto as never);

    expect(prisma.scheduleSlot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          weekType: undefined,
        }),
      }),
    );
  });

  it('rejects a slot where start time is not before end time', async () => {
    const prisma = createPrismaMock();
    const service = new ScheduleSlotsService(prisma as never);

    await expect(
      service.create({
        ...validDto,
        startTime: '09:00',
        endTime: '09:00',
      } as never),
    ).rejects.toThrow(
      new BadRequestException('Start time must be before end time'),
    );
    expect(prisma.scheduleSlot.findFirst).not.toHaveBeenCalled();
  });

  it('excludes the edited slot from update conflict checks', async () => {
    const prisma = createPrismaMock();
    prisma.scheduleSlot.findUnique.mockResolvedValue({
      id: 5,
      ...validDto,
      startTime: new Date(1970, 0, 1, 8, 0),
      endTime: new Date(1970, 0, 1, 8, 45),
    });
    prisma.scheduleSlot.findFirst.mockResolvedValue(null);
    const service = new ScheduleSlotsService(prisma as never);

    await service.update(5, {
      startTime: '08:15',
      endTime: '09:00',
    } as never);

    expect(prisma.scheduleSlot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: {
            not: 5,
          },
        }),
      }),
    );
    expect(prisma.scheduleSlot.update).toHaveBeenCalled();
  });
});
