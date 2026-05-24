import { createZodDto } from 'nestjs-zod';
import {
  updateScheduleSlotSchema,
  type UpdateScheduleSlotInput,
} from '@school/shared-types';

export type UpdateScheduleSlotDtoType = UpdateScheduleSlotInput;
export class UpdateScheduleSlotDto extends createZodDto(
  updateScheduleSlotSchema,
) {}
