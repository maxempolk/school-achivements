import { createZodDto } from 'nestjs-zod';
import {
  adminCreateLessonSchema,
  type AdminCreateLessonInput,
} from '@school/shared-types';

export type AdminCreateLessonDtoType = AdminCreateLessonInput;
export class AdminCreateLessonDto extends createZodDto(
  adminCreateLessonSchema,
) {}
