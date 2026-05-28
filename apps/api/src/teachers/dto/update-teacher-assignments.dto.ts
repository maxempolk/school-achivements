import {
  updateTeacherAssignmentsSchema,
  type UpdateTeacherAssignmentsInput,
} from '@school/shared-types';
import { createZodDto } from 'nestjs-zod';

export type UpdateTeacherAssignmentsDtoType = UpdateTeacherAssignmentsInput;
export class UpdateTeacherAssignmentsDto extends createZodDto(
  updateTeacherAssignmentsSchema,
) {}
