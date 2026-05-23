import { createZodDto } from 'nestjs-zod';
import {
  createLessonSchema,
  type CreateLessonInput,
} from '@school/shared-types';

export type CreateLessonDtoType = CreateLessonInput;
export class CreateLessonDto extends createZodDto(createLessonSchema) {}
