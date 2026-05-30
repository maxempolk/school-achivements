import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { ParentChildSelector } from '@/components/parent/parent-child-selector';
import { ParentHeader } from '@/components/parent/parent-header';
import { ParentSidebar } from '@/components/parent/parent-sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r bg-background md:flex">
        <Suspense fallback={null}>
          <ParentSidebar />
        </Suspense>
      </aside>

      <div className="min-h-screen md:pl-[260px]">
        <ParentHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
          <Suspense
            fallback={
              <div className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-full sm:w-72" />
              </div>
            }
          >
            <ParentChildSelector />
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
