'use client';

import { useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ParentSidebar } from '@/components/parent/parent-sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { innerApi } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ParentHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await innerApi.get<{ count: number }>(
        '/api/backend/notifications/unread-count',
      );
      return res.data;
    },
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.count ?? 0;

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
            <h1 className="truncate text-lg font-semibold">Parent Panel</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Child progress overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/parent/notifications"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'relative',
            )}
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 px-1.5" variant="ghost">
                <Avatar size="sm">
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  Parent
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Parent</DropdownMenuLabel>
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
            <ParentSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
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
