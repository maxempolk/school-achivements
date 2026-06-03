'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AttendanceView,
  type AttendanceRecord,
} from '@/components/attendance/attendance-view';
import { innerApi } from '@/lib/api';

async function getMyAttendance() {
  const response = await innerApi.get<AttendanceRecord[]>(
    '/api/backend/students/me/attendance',
  );

  return response.data;
}

export default function StudentAttendancePage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['student', 'attendance'],
    queryFn: getMyAttendance,
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendance</h2>
        <p className="text-sm text-muted-foreground">
          Review your presence records and attendance rate.
        </p>
      </div>

      <AttendanceView data={data} isError={isError} isLoading={isLoading} />
    </section>
  );
}
