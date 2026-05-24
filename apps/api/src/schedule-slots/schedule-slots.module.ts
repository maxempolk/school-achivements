import { Module } from '@nestjs/common';

import { ScheduleSlotsController } from './schedule-slots.controller';
import { ScheduleSlotsService } from './schedule-slots.service';

@Module({
  controllers: [ScheduleSlotsController],
  providers: [ScheduleSlotsService],
})
export class ScheduleSlotsModule {}
