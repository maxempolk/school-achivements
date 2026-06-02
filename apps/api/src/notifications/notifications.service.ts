import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        grade: {
          select: {
            value: true,
            lesson: {
              select: {
                subject: {
                  select: { name: true },
                },
              },
            },
          },
        },
        lesson: {
          select: {
            topic: true,
            homework: true,
            subject: {
              select: { name: true },
            },
          },
        },
        scheduleSlot: {
          select: {
            dayOfWeek: true,
            startTime: true,
            subject: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  async markAsRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Helper: Send a notification to a specific user
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    relations?: {
      gradeId?: number;
      lessonId?: number;
      scheduleSlotId?: number;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        gradeId: relations?.gradeId,
        lessonId: relations?.lessonId,
        scheduleSlotId: relations?.scheduleSlotId,
      },
    });
  }

  /**
   * Helper: Send a notification to a student and their parents
   */
  async notifyStudentAndParents(
    studentId: number,
    type: NotificationType,
    title: string,
    message: string,
    relations?: {
      gradeId?: number;
      lessonId?: number;
      scheduleSlotId?: number;
    },
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) return;

    const userIds = new Set<number>();
    userIds.add(student.userId);

    for (const p of student.parents) {
      userIds.add(p.parent.userId);
    }

    const notificationsData = Array.from(userIds).map((userId) => ({
      userId,
      type,
      title,
      message,
      gradeId: relations?.gradeId ?? null,
      lessonId: relations?.lessonId ?? null,
      scheduleSlotId: relations?.scheduleSlotId ?? null,
    }));

    await this.prisma.notification.createMany({
      data: notificationsData,
    });
  }

  /**
   * Helper: Send a notification to all students in a class and their parents
   */
  async notifyClassAndParents(
    classId: number,
    type: NotificationType,
    title: string,
    message: string,
    relations?: {
      gradeId?: number;
      lessonId?: number;
      scheduleSlotId?: number;
    },
  ) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    const userIds = new Set<number>();
    for (const student of students) {
      userIds.add(student.userId);
      for (const p of student.parents) {
        userIds.add(p.parent.userId);
      }
    }

    if (userIds.size === 0) return;

    const notificationsData = Array.from(userIds).map((userId) => ({
      userId,
      type,
      title,
      message,
      gradeId: relations?.gradeId ?? null,
      lessonId: relations?.lessonId ?? null,
      scheduleSlotId: relations?.scheduleSlotId ?? null,
    }));

    await this.prisma.notification.createMany({
      data: notificationsData,
    });
  }
}
