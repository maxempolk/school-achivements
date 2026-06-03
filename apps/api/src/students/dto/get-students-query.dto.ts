import { createZodDto } from 'nestjs-zod';
import {
  getStudentsQuerySchema,
  type GetStudentsQueryInput,
} from '@school/shared-types';

export type GetStudentsQueryDtoType = GetStudentsQueryInput;
export class GetStudentsQueryDto extends createZodDto(getStudentsQuerySchema) {}
