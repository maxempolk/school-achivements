'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type UseAdminPaginationOptions<TItem> = {
  items: TItem[];
  pageSize?: number;
};

export function useAdminPagination<TItem>({
  items,
  pageSize = 10,
}: UseAdminPaginationOptions<TItem>) {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageSize,
    paginatedItems,
    totalItems,
    totalPages,
    setPage,
  };
}

type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {firstItem}-{lastItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage <= 1}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          disabled={currentPage >= totalPages}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
