import { createZodDto } from 'nestjs-zod';
import { createClassSchema, type CreateClassInput } from '@school/shared-types';

export type CreateClassDtoType = CreateClassInput;
export class CreateClassDto extends createZodDto(createClassSchema) {}
