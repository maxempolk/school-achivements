import { createZodDto } from 'nestjs-zod';
import {
  createClassroomSchema,
  type CreateClassroomInput,
} from '@school/shared-types';

export type CreateClassroomDtoType = CreateClassroomInput;
export class CreateClassroomDto extends createZodDto(createClassroomSchema) {}
