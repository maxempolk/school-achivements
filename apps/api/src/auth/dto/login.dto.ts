import { createZodDto } from 'nestjs-zod';
import { loginSchema, type LoginInput } from '@school/shared-types';

export type LoginDtoType = LoginInput;
export class LoginDto extends createZodDto(loginSchema) {}
