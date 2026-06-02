import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';

import { ScheduleSlotsController } from './schedule-slots.controller';
import { ScheduleSlotsService } from './schedule-slots.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ScheduleSlotsController],
  providers: [ScheduleSlotsService],
})
export class ScheduleSlotsModule {}
