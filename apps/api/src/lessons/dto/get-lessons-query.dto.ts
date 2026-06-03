import { createZodDto } from 'nestjs-zod';
import {
  getLessonsQuerySchema,
  type GetLessonsQueryInput,
} from '@school/shared-types';

export type GetLessonsQueryDtoType = GetLessonsQueryInput;
export class GetLessonsQueryDto extends createZodDto(getLessonsQuerySchema) {}
