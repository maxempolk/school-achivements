export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
};
