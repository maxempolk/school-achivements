import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { ParentChildSelector } from '@/components/parent/parent-child-selector';
import { ParentHeader } from '@/components/parent/parent-header';
import { ParentSidebar } from '@/components/parent/parent-sidebar';

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
              <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                Loading children...
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
