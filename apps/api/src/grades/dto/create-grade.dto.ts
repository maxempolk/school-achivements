import { createZodDto } from 'nestjs-zod';
import { createGradeSchema, type CreateGradeInput } from '@school/shared-types';

export type CreateGradeDtoType = CreateGradeInput;
export class CreateGradeDto extends createZodDto(createGradeSchema) {}
