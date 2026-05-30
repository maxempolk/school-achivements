import { Skeleton } from '@/components/ui/skeleton';

type ListSkeletonProps = {
  rows?: number;
  showCheckbox?: boolean;
};

function ListSkeleton({ rows = 5, showCheckbox = false }: ListSkeletonProps) {
  return (
    <div className="flex flex-col gap-2 px-2 py-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          {showCheckbox ? <Skeleton className="size-4 rounded-sm" /> : null}
          <Skeleton className="h-5 flex-1" />
        </div>
      ))}
    </div>
  );
}

export { ListSkeleton };
