'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DiaryView,
  type Grade,
  type AttendanceRecord,
  type ScheduleSlot,
} from '@/components/diary/diary-view';
import { innerApi } from '@/lib/api';

const emptyGrades: Grade[] = [];
const emptyAttendance: AttendanceRecord[] = [];
const emptySchedule: ScheduleSlot[] = [];

async function getMyGrades() {
  const response = await innerApi.get<Grade[]>(
    '/api/backend/students/me/grades',
  );

  return response.data;
}

async function getMyAttendance() {
  const response = await innerApi.get<AttendanceRecord[]>(
    '/api/backend/students/me/attendance',
  );

  return response.data;
}

async function getMySchedule() {
  const response = await innerApi.get<ScheduleSlot[]>(
    '/api/backend/schedule-slots/me',
  );

  return response.data;
}

export default function StudentDiaryPage() {
  const gradesQuery = useQuery({
    queryKey: ['student', 'grades'],
    queryFn: getMyGrades,
  });
  const attendanceQuery = useQuery({
    queryKey: ['student', 'attendance'],
    queryFn: getMyAttendance,
  });
  const scheduleQuery = useQuery({
    queryKey: ['student', 'schedule'],
    queryFn: getMySchedule,
  });

  const grades = gradesQuery.data ?? emptyGrades;
  const attendance = attendanceQuery.data ?? emptyAttendance;
  const schedule = scheduleQuery.data ?? emptySchedule;
  const isLoading =
    gradesQuery.isLoading ||
    attendanceQuery.isLoading ||
    scheduleQuery.isLoading;
  const isError =
    gradesQuery.isError || attendanceQuery.isError || scheduleQuery.isError;

  return (
    <DiaryView
      grades={grades}
      attendance={attendance}
      schedule={schedule}
      isLoading={isLoading}
      isError={isError}
      title="My diary"
      description="Lessons, homework, grades, and attendance in one place."
    />
  );
}
