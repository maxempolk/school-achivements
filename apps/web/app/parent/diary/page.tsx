'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import {
  DiaryView,
  type Grade,
  type AttendanceRecord,
  type ScheduleSlot,
} from '@/components/diary/diary-view';
import {
  selectParentChild,
  useParentChildren,
} from '@/components/parent/use-parent-children';
import { innerApi } from '@/lib/api';

const emptyGrades: Grade[] = [];
const emptyAttendance: AttendanceRecord[] = [];
const emptySchedule: ScheduleSlot[] = [];

async function getChildGrades(childId: number) {
  const response = await innerApi.get<Grade[]>(
    `/api/backend/parents/me/children/${childId}/grades`,
  );

  return response.data;
}

async function getChildAttendance(childId: number) {
  const response = await innerApi.get<AttendanceRecord[]>(
    `/api/backend/parents/me/children/${childId}/attendance`,
  );

  return response.data;
}

async function getChildSchedule(childId: number) {
  const response = await innerApi.get<ScheduleSlot[]>(
    `/api/backend/parents/me/children/${childId}/schedule`,
  );

  return response.data;
}

export default function ParentDiaryPage() {
  const searchParams = useSearchParams();
  const childrenQuery = useParentChildren();
  const selectedChild = selectParentChild(
    childrenQuery.data ?? [],
    searchParams.get('childId'),
  );

  const gradesQuery = useQuery({
    queryKey: ['parent', 'diary', 'grades', selectedChild?.id],
    queryFn: () => getChildGrades(selectedChild!.id),
    enabled: Boolean(selectedChild),
  });
  const attendanceQuery = useQuery({
    queryKey: ['parent', 'diary', 'attendance', selectedChild?.id],
    queryFn: () => getChildAttendance(selectedChild!.id),
    enabled: Boolean(selectedChild),
  });
  const scheduleQuery = useQuery({
    queryKey: ['parent', 'diary', 'schedule', selectedChild?.id],
    queryFn: () => getChildSchedule(selectedChild!.id),
    enabled: Boolean(selectedChild),
  });

  const grades = gradesQuery.data ?? emptyGrades;
  const attendance = attendanceQuery.data ?? emptyAttendance;
  const schedule = scheduleQuery.data ?? emptySchedule;
  const isLoading =
    childrenQuery.isLoading ||
    gradesQuery.isLoading ||
    attendanceQuery.isLoading ||
    scheduleQuery.isLoading;
  const isError =
    childrenQuery.isError ||
    gradesQuery.isError ||
    attendanceQuery.isError ||
    scheduleQuery.isError;

  return (
    <DiaryView
      grades={grades}
      attendance={attendance}
      schedule={schedule}
      isLoading={isLoading}
      isError={isError}
      title="Child diary"
      description="Grades, homework, schedule, and attendance for the selected child."
      emptyMessage={selectedChild ? undefined : 'Select a linked child first.'}
    />
  );
}
