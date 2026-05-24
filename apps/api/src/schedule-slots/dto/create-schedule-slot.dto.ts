import { createZodDto } from 'nestjs-zod';
import {
  createScheduleSlotSchema,
  type CreateScheduleSlotInput,
} from '@school/shared-types';

export type CreateScheduleSlotDtoType = CreateScheduleSlotInput;
export class CreateScheduleSlotDto extends createZodDto(
  createScheduleSlotSchema,
) {}
