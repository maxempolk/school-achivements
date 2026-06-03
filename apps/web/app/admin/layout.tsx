import type { ReactNode } from 'react';

import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { DashboardLayoutTemplate } from '@/components/ui/dashboard-layout-template';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutTemplate
      header={<AdminHeader />}
      sidebar={<AdminSidebar />}
    >
      {children}
    </DashboardLayoutTemplate>
  );
}
