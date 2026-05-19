import { createZodDto } from 'nestjs-zod';
import {
  createSubjectSchema,
  type CreateSubjectInput,
} from '@school/shared-types';

export type CreateSubjectDtoType = CreateSubjectInput;
export class CreateSubjectDto extends createZodDto(createSubjectSchema) {}
