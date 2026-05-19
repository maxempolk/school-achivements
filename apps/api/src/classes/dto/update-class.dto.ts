import { createZodDto } from 'nestjs-zod';
import { updateClassSchema, type UpdateClassInput } from '@school/shared-types';

export type UpdateClassDtoType = UpdateClassInput;
export class UpdateClassDto extends createZodDto(updateClassSchema) {}
