import { createZodDto } from 'nestjs-zod';
import {
  updateSubjectSchema,
  type UpdateSubjectInput,
} from '@school/shared-types';

export type UpdateSubjectDtoType = UpdateSubjectInput;
export class UpdateSubjectDto extends createZodDto(updateSubjectSchema) {}
