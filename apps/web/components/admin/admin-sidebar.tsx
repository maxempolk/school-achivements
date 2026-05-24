'use client';

import {
  BookOpen,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings,
  UserRound,
  UsersRound,
} from 'lucide-react';

import { AdminNavItem } from '@/components/admin/admin-nav-item';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: UsersRound,
  },
  {
    title: 'Teachers',
    href: '/admin/teachers',
    icon: GraduationCap,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: UserRound,
  },
  {
    title: 'Classes',
    href: '/admin/classes',
    icon: School,
  },
  {
    title: 'Subjects',
    href: '/admin/subjects',
    icon: BookOpen,
  },
  {
    title: 'Classrooms',
    href: '/admin/classrooms',
    icon: DoorOpen,
  },
  {
    title: 'Schedule',
    href: '/admin/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  return (
    <div
      className={cn('flex min-h-0 w-full flex-col bg-background', className)}
    >
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">School Admin</p>
            <p className="truncate text-xs text-muted-foreground">Management</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navigationItems.map((item) => (
          <AdminNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}
