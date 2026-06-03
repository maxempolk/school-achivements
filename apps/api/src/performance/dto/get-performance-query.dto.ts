import { createZodDto } from 'nestjs-zod';
import {
  getPerformanceQuerySchema,
  type GetPerformanceQueryInput,
} from '@school/shared-types';

export type GetPerformanceQueryDtoType = GetPerformanceQueryInput;
export class GetPerformanceQueryDto extends createZodDto(
  getPerformanceQuerySchema,
) {}
