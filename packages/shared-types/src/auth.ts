import { z } from 'zod/v4';

export const loginSchema = z.object({
  email: z.string().email().meta({
    example: 'admin@test.com',
    description: 'User email',
  }),

  password: z.string().min(6).meta({
    example: 'password_test',
    description: 'Password',
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
