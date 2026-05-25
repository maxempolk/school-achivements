import { createZodDto } from 'nestjs-zod';
import {
  upsertAttendanceSchema,
  type UpsertAttendanceInput,
} from '@school/shared-types';

export type UpsertAttendanceDtoType = UpsertAttendanceInput;
export class UpsertAttendanceDto extends createZodDto(upsertAttendanceSchema) {}
