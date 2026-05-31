'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  CalendarDays,
  NotebookTabs,
  GraduationCap,
  TableProperties,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'My diary',
    href: '/student/diary',
    icon: NotebookTabs,
  },
  {
    title: 'Grades',
    href: '/student/grades',
    icon: TableProperties,
  },
  {
    title: 'My schedule',
    href: '/student/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Attendance',
    href: '/student/attendance',
    icon: CalendarCheck,
  },
];

// TODO: мб стоит переделать все sidebar(student, admin, teacher) используя общий компонент - sidebar

export function StudentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 w-full flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap />
          </div>
          <div>
            <p className="text-sm font-semibold">Student</p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Button
              key={item.href}
              asChild
              className={cn(
                'h-10 justify-start gap-3 px-3',
                isActive &&
                  'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
              )}
              variant="ghost"
            >
              <Link href={item.href} onClick={onNavigate}>
                <Icon data-icon="inline-start" />
                <span>{item.title}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
