'use client';

import { useSearchParams } from 'next/navigation';

import { MyScheduleTable } from '@/components/schedule/my-schedule-table';
import {
  selectParentChild,
  useParentChildren,
} from '@/components/parent/use-parent-children';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentSchedulePage() {
  const searchParams = useSearchParams();
  const { data = [], isLoading } = useParentChildren();
  const selectedChild = selectParentChild(data, searchParams.get('childId'));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <p className="text-sm text-muted-foreground">
          Review the weekly schedule for the selected child.
        </p>
      </div>

      {selectedChild ? (
        <MyScheduleTable
          audience="student"
          endpoint={`/api/backend/parents/me/children/${selectedChild.id}/schedule`}
          queryKey={['parent', 'schedule', selectedChild.id]}
        />
      ) : (
        <div className="rounded-md border bg-background px-4 py-8 text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            'Select a linked child first.'
          )}
        </div>
      )}
    </section>
  );
}
