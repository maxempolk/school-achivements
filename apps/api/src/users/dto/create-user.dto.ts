import { createZodDto } from 'nestjs-zod';
import { createUserSchema, type CreateUserInput } from '@school/shared-types';

export type CreateUserDtoType = CreateUserInput;
export class CreateUserDto extends createZodDto(createUserSchema) {}
