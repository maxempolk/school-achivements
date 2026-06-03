import type { ReactNode } from 'react';

import { StudentHeader } from '@/components/student/student-header';
import { StudentSidebar } from '@/components/student/student-sidebar';
import { DashboardLayoutTemplate } from '@/components/ui/dashboard-layout-template';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutTemplate
      header={<StudentHeader />}
      sidebar={<StudentSidebar />}
    >
      {children}
    </DashboardLayoutTemplate>
  );
}
