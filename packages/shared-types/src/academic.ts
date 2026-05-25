import { z } from 'zod/v4';

export const createLessonSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  date: z.string().datetime(),
  topic: z.string().trim().min(1),
  homework: z.string().trim().min(1).nullable().optional(),
});

export const updateLessonSchema = createLessonSchema
  .pick({
    topic: true,
    homework: true,
  })
  .partial();

export const createGradeSchema = z.object({
  lessonId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  value: z.number().int().min(1).max(12),
  comment: z.string().trim().min(1).nullable().optional(),
});

export const upsertAttendanceSchema = z.object({
  lessonId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  isPresent: z.boolean(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;
