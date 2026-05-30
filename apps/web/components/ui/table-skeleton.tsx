import { Skeleton } from '@/components/ui/skeleton';

type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
  cellClassNames?: string[];
};

function TableSkeletonRows({
  cellClassNames = [],
  columns,
  rows = 5,
}: TableSkeletonRowsProps) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} className="border-b last:border-b-0">
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={columnIndex} className="px-4 py-3">
          <Skeleton
            className={
              cellClassNames[columnIndex] ??
              (columnIndex === columns - 1 ? 'ml-auto h-5 w-16' : 'h-5 w-24')
            }
          />
        </td>
      ))}
    </tr>
  ));
}

export { TableSkeletonRows };
