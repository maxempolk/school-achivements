import { z } from 'zod/v4';

export const getStudentsQuerySchema = z.object({
  classId: z.coerce.number().int().positive().optional(),
});

export const getLessonsQuerySchema = z.object({
  teacherId: z.coerce.number().int().positive().optional(),
  classId: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
});

export const getJournalQuerySchema = z.object({
  classId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
});

export const getPerformanceQuerySchema = z.object({
  classId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive().optional(),
});

export type GetStudentsQueryInput = z.infer<typeof getStudentsQuerySchema>;
export type GetLessonsQueryInput = z.infer<typeof getLessonsQuerySchema>;
export type GetJournalQueryInput = z.infer<typeof getJournalQuerySchema>;
export type GetPerformanceQueryInput = z.infer<
  typeof getPerformanceQuerySchema
>;
