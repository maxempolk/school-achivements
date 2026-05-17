'use client';

import { innerApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// TODO: перенести на сервер или может быть просто в другую папку.
async function getMe() {
  const res = await innerApi.get('/api/backend/users/me');

  return res.data;
}

export default function DashboardPage() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load user</div>;

  return (
    <div>
      Hello, {user.email}, role: {user.role}
    </div>
  );
}
