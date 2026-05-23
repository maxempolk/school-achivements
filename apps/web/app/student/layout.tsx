import type { ReactNode } from 'react';

import { StudentHeader } from '@/components/student/student-header';
import { StudentSidebar } from '@/components/student/student-sidebar';

// TODO: мб стоит что то сделать с этим layout т.к он везде однаковый практически, мб вынести в виде общего компонента layout

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r bg-background md:flex">
        <StudentSidebar />
      </aside>

      <div className="min-h-screen md:pl-[260px]">
        <StudentHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
