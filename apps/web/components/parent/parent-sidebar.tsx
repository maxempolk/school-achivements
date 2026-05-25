'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  CalendarCheck,
  CalendarDays,
  GraduationCap,
  TableProperties,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Grades',
    href: '/parent/grades',
    icon: TableProperties,
  },
  {
    title: 'Schedule',
    href: '/parent/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Attendance',
    href: '/parent/attendance',
    icon: CalendarCheck,
  },
];

export function ParentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const childId = searchParams.get('childId');

  return (
    <div className="flex min-h-0 w-full flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users />
          </div>
          <div>
            <p className="text-sm font-semibold">Parent</p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const href = childId ? `${item.href}?childId=${childId}` : item.href;

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
              <Link href={href} onClick={onNavigate}>
                <Icon data-icon="inline-start" />
                <span>{item.title}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <GraduationCap className="mb-2 size-4" />
        Student views adapted for parents.
      </div>
    </div>
  );
}
