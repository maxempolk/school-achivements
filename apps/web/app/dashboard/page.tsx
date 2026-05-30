'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

  if (isLoading) {
    return (
      <section className="flex flex-col gap-4">
        <Card>
          <CardContent className="px-4 py-8 text-sm text-muted-foreground">
            Loading dashboard...
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        <Card>
          <CardContent className="px-4 py-8 text-sm text-destructive">
            Failed to load dashboard.
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Your current account context.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          Hello, {user.email}, role: {user.role}
        </CardContent>
      </Card>
    </section>
  );
}
