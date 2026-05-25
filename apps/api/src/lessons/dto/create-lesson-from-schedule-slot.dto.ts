import { createZodDto } from 'nestjs-zod';
import {
  createLessonFromScheduleSlotSchema,
  type CreateLessonFromScheduleSlotInput,
} from '@school/shared-types';

export type CreateLessonFromScheduleSlotDtoType =
  CreateLessonFromScheduleSlotInput;
export class CreateLessonFromScheduleSlotDto extends createZodDto(
  createLessonFromScheduleSlotSchema,
) {}
