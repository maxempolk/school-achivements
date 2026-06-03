import { createZodDto } from 'nestjs-zod';
import {
  getJournalQuerySchema,
  type GetJournalQueryInput,
} from '@school/shared-types';

export type GetJournalQueryDtoType = GetJournalQueryInput;
export class GetJournalQueryDto extends createZodDto(getJournalQuerySchema) {}
