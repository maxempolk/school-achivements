import type { ReactNode } from 'react';

import { TeacherHeader } from '@/components/teacher/teacher-header';
import { TeacherSidebar } from '@/components/teacher/teacher-sidebar';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r bg-background md:flex">
        <TeacherSidebar />
      </aside>

      <div className="min-h-screen md:pl-[260px]">
        <TeacherHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
