'use client';

import { useState } from 'react';
import { Bell, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const adminName = 'Admin';

export function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">Admin Panel</h1>
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              School management dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="gap-2 px-1.5"
                variant="ghost"
                aria-label="Open admin menu"
              >
                <Avatar size="sm">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">
                  {adminName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{adminName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserRound data-icon="inline-start" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings data-icon="inline-start" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
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
            <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
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
