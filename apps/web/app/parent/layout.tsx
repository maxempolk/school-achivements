import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { ParentChildSelector } from '@/components/parent/parent-child-selector';
import { ParentHeader } from '@/components/parent/parent-header';
import { ParentSidebar } from '@/components/parent/parent-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayoutTemplate } from '@/components/ui/dashboard-layout-template';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutTemplate
      beforeContent={
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
        </Suspense>
      }
      header={<ParentHeader />}
      sidebar={
        <Suspense fallback={null}>
          <ParentSidebar />
        </Suspense>
      }
    >
      <Suspense fallback={null}>{children}</Suspense>
    </DashboardLayoutTemplate>
  );
}
