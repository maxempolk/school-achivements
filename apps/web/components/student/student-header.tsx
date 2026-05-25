'use client';

import { useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { StudentSidebar } from '@/components/student/student-sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function StudentHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    let response: Response;

    try {
      response = await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      toast.error('Failed to sign out');
      return;
    }

    if (!response.ok) {
      toast.error('Failed to sign out');
      return;
    }

    toast.success('Signed out');
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="Open navigation"
            className="md:hidden"
            size="icon"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu />
          </Button>
          <div>
            <h1 className="truncate text-lg font-semibold">Student Panel</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Grades overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 px-1.5" variant="ghost">
                <Avatar size="sm">
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  Student
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Student</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut data-icon="inline-start" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] border-r bg-background shadow-lg">
            <StudentSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
          <Button
            aria-label="Close navigation"
            className="absolute right-4 top-4"
            size="icon"
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X />
          </Button>
        </div>
      ) : null}
    </>
  );
}
