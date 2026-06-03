import type { ReactNode } from 'react';

import { TeacherHeader } from '@/components/teacher/teacher-header';
import { TeacherSidebar } from '@/components/teacher/teacher-sidebar';
import { DashboardLayoutTemplate } from '@/components/ui/dashboard-layout-template';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutTemplate
      header={<TeacherHeader />}
      sidebar={<TeacherSidebar />}
    >
      {children}
    </DashboardLayoutTemplate>
  );
}
