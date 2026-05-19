import { createZodDto } from 'nestjs-zod';
import { updateUserSchema, type UpdateUserInput } from '@school/shared-types';

export type UpdateUserDtoType = UpdateUserInput;
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
