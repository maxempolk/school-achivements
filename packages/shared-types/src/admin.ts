import { z } from 'zod/v4';

export const roleSchema = z.enum(['ADMIN', 'TEACHER', 'STUDENT']);

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

export const updateUserSchema = createUserSchema.partial();

export const createClassSchema = z.object({
  name: z.string().trim().min(1),
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1),
  shortName: z.string().trim().min(1).nullable().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
