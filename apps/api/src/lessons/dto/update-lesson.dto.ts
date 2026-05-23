import { createZodDto } from 'nestjs-zod';
import {
  updateLessonSchema,
  type UpdateLessonInput,
} from '@school/shared-types';

export type UpdateLessonDtoType = UpdateLessonInput;
export class UpdateLessonDto extends createZodDto(updateLessonSchema) {}
