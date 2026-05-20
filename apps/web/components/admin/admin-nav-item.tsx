'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminNavItemProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
};

export function AdminNavItem({
  href,
  icon: Icon,
  title,
  onClick,
}: AdminNavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === '/admin'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Button
      asChild
      className={cn(
        'h-10 justify-start gap-3 px-3',
        isActive &&
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
      )}
      variant="ghost"
    >
      <Link href={href} onClick={onClick}>
        <Icon data-icon="inline-start" />
        <span className="truncate">{title}</span>
      </Link>
    </Button>
  );
}
