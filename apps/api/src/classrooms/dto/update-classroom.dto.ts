import { createZodDto } from 'nestjs-zod';
import {
  updateClassroomSchema,
  type UpdateClassroomInput,
} from '@school/shared-types';

export type UpdateClassroomDtoType = UpdateClassroomInput;
export class UpdateClassroomDto extends createZodDto(updateClassroomSchema) {}
