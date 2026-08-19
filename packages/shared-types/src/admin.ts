import { z } from 'zod/v4';

export const roleSchema = z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']);

export const userProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  classId: z.number().int().positive().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: roleSchema,
  profile: userProfileSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  isSuperAdmin: z.boolean().optional(),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1),
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1),
  shortName: z.string().trim().min(1).nullable().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createClassroomSchema = z.object({
  number: z.string().trim().min(1),
  building: z.string().trim().min(1).nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
});

export const updateClassroomSchema = createClassroomSchema.partial();

export const dayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const weekTypeSchema = z.enum(['ODD', 'EVEN', 'EVERY']);

export const createScheduleSlotSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
  classroomId: z.number().int().positive(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  weekType: weekTypeSchema,
});

export const updateScheduleSlotSchema = createScheduleSlotSchema.partial();

export const updateParentStudentsSchema = z.object({
  studentIds: z.array(z.number().int().positive()),
});

export const updateTeacherAssignmentsSchema = z.object({
  classIds: z.array(z.number().int().positive()),
  subjectIds: z.array(z.number().int().positive()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type CreateScheduleSlotInput = z.infer<typeof createScheduleSlotSchema>;
export type UpdateScheduleSlotInput = z.infer<typeof updateScheduleSlotSchema>;
export type UpdateParentStudentsInput = z.infer<
  typeof updateParentStudentsSchema
>;
export type UpdateTeacherAssignmentsInput = z.infer<
  typeof updateTeacherAssignmentsSchema
>;
