import type { ReactNode } from 'react';

export type DashboardLayoutTemplateProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  beforeContent?: ReactNode;
};

export function DashboardLayoutTemplate({
  sidebar,
  header,
  children,
  beforeContent,
}: DashboardLayoutTemplateProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r bg-background md:flex">
        {sidebar}
      </aside>

      <div className="min-h-screen md:pl-[260px]">
        {header}
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
          {beforeContent}
          {children}
        </main>
      </div>
    </div>
  );
}
