import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};
