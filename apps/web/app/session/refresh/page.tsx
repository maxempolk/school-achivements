'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function getSafeRedirectPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }

  if (redirect.startsWith('/session/refresh')) {
    return '/';
  }

  return redirect;
}

function SessionRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get('redirect'));

  useEffect(() => {
    async function refreshSession() {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        router.replace(redirect);
        router.refresh();
        return;
      }

      const loginUrl = new URL('/login', window.location.origin);

      loginUrl.searchParams.set('redirect', redirect);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
    }

    refreshSession().catch(() => {
      const loginUrl = new URL('/login', window.location.origin);

      loginUrl.searchParams.set('redirect', redirect);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
    });
  }, [redirect, router]);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6">
      <section className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 px-4 py-8">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function SessionRefreshPage() {
  return (
    <Suspense fallback={null}>
      <SessionRefresh />
    </Suspense>
  );
}
