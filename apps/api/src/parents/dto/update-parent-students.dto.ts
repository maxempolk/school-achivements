import { createZodDto } from 'nestjs-zod';
import {
  updateParentStudentsSchema,
  type UpdateParentStudentsInput,
} from '@school/shared-types';

export type UpdateParentStudentsDtoType = UpdateParentStudentsInput;
export class UpdateParentStudentsDto extends createZodDto(
  updateParentStudentsSchema,
) {}
