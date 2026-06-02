import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
