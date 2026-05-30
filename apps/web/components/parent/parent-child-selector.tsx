'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { selectParentChild, useParentChildren } from './use-parent-children';

export function ParentChildSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data = [], isError, isLoading } = useParentChildren();
  const selectedChild = selectParentChild(data, searchParams.get('childId'));

  function handleValueChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set('childId', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-full sm:w-72" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-sm text-destructive">
        Failed to load children.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
        No children linked to this account.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Child</p>
        <p className="text-xs text-muted-foreground">
          Choose whose school data you want to view.
        </p>
      </div>
      <Select
        value={String(selectedChild?.id ?? data[0].id)}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {data.map((child) => (
              <SelectItem key={child.id} value={String(child.id)}>
                {child.lastName} {child.firstName} ({child.class.name})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
