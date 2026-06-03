'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import {
  AttendanceView,
  type AttendanceRecord,
} from '@/components/attendance/attendance-view';
import {
  selectParentChild,
  useParentChildren,
} from '@/components/parent/use-parent-children';
import { innerApi } from '@/lib/api';

async function getChildAttendance(childId: number) {
  const response = await innerApi.get<AttendanceRecord[]>(
    `/api/backend/parents/me/children/${childId}/attendance`,
  );

  return response.data;
}

export default function ParentAttendancePage() {
  const searchParams = useSearchParams();
  const childrenQuery = useParentChildren();
  const selectedChild = selectParentChild(
    childrenQuery.data ?? [],
    searchParams.get('childId'),
  );
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['parent', 'attendance', selectedChild?.id],
    queryFn: () => getChildAttendance(selectedChild!.id),
    enabled: Boolean(selectedChild),
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendance</h2>
        <p className="text-sm text-muted-foreground">
          Review presence records for the selected child.
        </p>
      </div>

      <AttendanceView
        data={data}
        isError={childrenQuery.isError || isError}
        isLoading={childrenQuery.isLoading || isLoading}
        emptyMessage={
          selectedChild
            ? 'No attendance records found.'
            : 'Select a linked child first.'
        }
      />
    </section>
  );
}
