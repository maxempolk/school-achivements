'use client';

import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  History,
  ListChecks,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

const dayOfWeekOptions = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

type DayOfWeek = (typeof dayOfWeekOptions)[number];
type DiaryEntryType = 'all' | 'grades' | 'homework' | 'attendance';

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

type LessonInfo = {
  id: number;
  date: string;
  topic: string;
  homework: string | null;
  subject: Subject;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

type Grade = {
  id: number;
  value: number;
  comment: string | null;
  lesson: LessonInfo;
};

type AttendanceRecord = {
  id: number;
  isPresent: boolean;
  lesson: LessonInfo;
};

type ScheduleSlot = {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  weekType: 'EVERY' | 'ODD' | 'EVEN';
  subject: Subject;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  classroom: {
    id: number;
    number: string;
    building: string | null;
  };
};

type DiaryEntry = {
  id: string;
  lesson: LessonInfo;
  grade?: Grade;
  attendance?: AttendanceRecord;
};

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

function dayOrder(day: DayOfWeek) {
  return dayOfWeekOptions.indexOf(day);
}

function getStartOfDayTime(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function getEndOfDayTime(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
}

function formatSubject(subject: Subject) {
  return subject.shortName ?? subject.name;
}

function formatSlotTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 5);
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatClassroom(classroom: ScheduleSlot['classroom']) {
  return classroom.building
    ? `${classroom.number}, ${classroom.building}`
    : classroom.number;
}

function getNextOccurrence(slot: ScheduleSlot) {
  const now = new Date();
  const date = new Date(now);
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const targetDayIndex = dayOrder(slot.dayOfWeek);
  const dayDelta = (targetDayIndex - currentDayIndex + 7) % 7;
  const slotStartTime = new Date(slot.startTime);

  date.setDate(now.getDate() + dayDelta);

  if (!Number.isNaN(slotStartTime.getTime())) {
    date.setHours(slotStartTime.getHours(), slotStartTime.getMinutes(), 0, 0);
  }

  if (date.getTime() < now.getTime()) {
    date.setDate(date.getDate() + 7);
  }

  return date;
}

function getAverage(grades: Grade[]) {
  if (grades.length === 0) {
    return null;
  }

  const total = grades.reduce((sum, grade) => sum + grade.value, 0);

  return total / grades.length;
}

function formatAverage(value: number | null) {
  return value === null ? '-' : value.toFixed(1);
}

function buildDiaryEntries(grades: Grade[], attendance: AttendanceRecord[]) {
  const entries = new Map<number, DiaryEntry>();

  for (const grade of grades) {
    entries.set(grade.lesson.id, {
      id: String(grade.lesson.id),
      lesson: grade.lesson,
      grade,
    });
  }

  for (const record of attendance) {
    const existing = entries.get(record.lesson.id);

    entries.set(record.lesson.id, {
      id: String(record.lesson.id),
      lesson: existing?.lesson ?? record.lesson,
      grade: existing?.grade,
      attendance: record,
    });
  }

  return [...entries.values()].sort(
    (a, b) =>
      new Date(b.lesson.date).getTime() - new Date(a.lesson.date).getTime(),
  );
}

export default function StudentDiaryPage() {
  const [subjectId, setSubjectId] = useState('all');
  const [entryType, setEntryType] = useState<DiaryEntryType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const subjects = useMemo(() => {
    const subjectsById = new Map<number, Subject>();

    for (const grade of grades) {
      subjectsById.set(grade.lesson.subject.id, grade.lesson.subject);
    }

    for (const record of attendance) {
      subjectsById.set(record.lesson.subject.id, record.lesson.subject);
    }

    for (const slot of schedule) {
      subjectsById.set(slot.subject.id, slot.subject);
    }

    return [...subjectsById.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [attendance, grades, schedule]);

  const diaryEntries = useMemo(
    () => buildDiaryEntries(grades, attendance),
    [attendance, grades],
  );

  const filteredEntries = useMemo(() => {
    const fromTime = dateFrom ? getStartOfDayTime(dateFrom) : undefined;
    const toTime = dateTo ? getEndOfDayTime(dateTo) : undefined;

    return diaryEntries.filter((entry) => {
      const lessonTime = new Date(entry.lesson.date).getTime();

      if (
        subjectId !== 'all' &&
        entry.lesson.subject.id !== Number(subjectId)
      ) {
        return false;
      }

      if (fromTime !== undefined && lessonTime < fromTime) {
        return false;
      }

      if (toTime !== undefined && lessonTime > toTime) {
        return false;
      }

      if (entryType === 'grades') {
        return Boolean(entry.grade);
      }

      if (entryType === 'homework') {
        return Boolean(entry.lesson.homework);
      }

      if (entryType === 'attendance') {
        return Boolean(entry.attendance);
      }

      return true;
    });
  }, [dateFrom, dateTo, diaryEntries, entryType, subjectId]);

  const upcomingLessons = useMemo(() => {
    return schedule
      .filter(
        (slot) => subjectId === 'all' || slot.subject.id === Number(subjectId),
      )
      .map((slot) => ({
        slot,
        nextDate: getNextOccurrence(slot),
      }))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
      .slice(0, 5);
  }, [schedule, subjectId]);

  const filteredGrades = filteredEntries
    .map((entry) => entry.grade)
    .filter((grade): grade is Grade => Boolean(grade));
  const latestGrades = filteredGrades.slice(0, 5);
  const homeworkEntries = filteredEntries
    .filter((entry) => entry.lesson.homework)
    .slice(0, 5);
  const presentCount = filteredEntries.filter(
    (entry) => entry.attendance?.isPresent,
  ).length;
  const attendanceCount = filteredEntries.filter((entry) =>
    Boolean(entry.attendance),
  ).length;
  const attendanceRate =
    attendanceCount === 0
      ? 0
      : Math.round((presentCount / attendanceCount) * 100);
  const averageGrade = getAverage(filteredGrades);
  const hasActiveFilters =
    subjectId !== 'all' || entryType !== 'all' || dateFrom || dateTo;

  function resetFilters() {
    setSubjectId('all');
    setEntryType('all');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My diary</h2>
        <p className="text-sm text-muted-foreground">
          Lessons, homework, grades, and attendance in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Grades"
          value={String(filteredGrades.length)}
        />
        <StatCard
          icon={BookOpen}
          label="Average"
          value={formatAverage(averageGrade)}
        />
        <StatCard
          icon={ClipboardList}
          label="Homework"
          value={String(homeworkEntries.length)}
        />
        <StatCard
          icon={CalendarCheck}
          label="Attendance"
          value={`${attendanceRate}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow the diary by subject, period, or record type.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,12rem)_minmax(9rem,12rem)_minmax(9rem,12rem)_auto] sm:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="diary-subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="diary-subject" className="w-full">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="diary-type">Type</Label>
            <Select
              value={entryType}
              onValueChange={(value) => setEntryType(value as DiaryEntryType)}
            >
              <SelectTrigger id="diary-type" className="w-full">
                <SelectValue placeholder="All records" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All records</SelectItem>
                <SelectItem value="grades">Grades</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="diary-from">From</Label>
            <Input
              id="diary-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="diary-to">To</Label>
            <Input
              id="diary-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <Button
            disabled={!hasActiveFilters}
            type="button"
            variant="outline"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming lessons</CardTitle>
            <CardDescription>Next lessons from your schedule.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {scheduleQuery.isLoading ? (
              <CompactSkeletonRows />
            ) : upcomingLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons found.</p>
            ) : (
              upcomingLessons.map(({ nextDate, slot }) => (
                <CompactItem
                  key={slot.id}
                  icon={CalendarDays}
                  title={formatSubject(slot.subject)}
                  meta={`${nextDate.toLocaleDateString()} · ${formatSlotTime(slot.startTime)}-${formatSlotTime(slot.endTime)}`}
                  detail={`${slot.teacher.lastName} ${slot.teacher.firstName} · ${formatClassroom(slot.classroom)}`}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Homework</CardTitle>
            <CardDescription>
              Recent homework from lesson records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <CompactSkeletonRows />
            ) : homeworkEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No homework found.
              </p>
            ) : (
              homeworkEntries.map((entry) => (
                <CompactItem
                  key={entry.id}
                  icon={ClipboardList}
                  title={entry.lesson.homework ?? ''}
                  meta={`${new Date(entry.lesson.date).toLocaleDateString()} · ${formatSubject(entry.lesson.subject)}`}
                  detail={entry.lesson.topic}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest grades</CardTitle>
            <CardDescription>Your newest assessment records.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {gradesQuery.isLoading ? (
              <CompactSkeletonRows />
            ) : latestGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades found.</p>
            ) : (
              latestGrades.map((grade) => (
                <CompactItem
                  key={grade.id}
                  icon={History}
                  title={`${grade.value} · ${formatSubject(grade.lesson.subject)}`}
                  meta={new Date(grade.lesson.date).toLocaleDateString()}
                  detail={grade.lesson.topic}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievement history</CardTitle>
          <CardDescription>
            {filteredEntries.length} lesson record
            {filteredEntries.length === 1 ? '' : 's'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="min-w-56 px-4 py-3 font-medium">Topic</th>
                  <th className="min-w-56 px-4 py-3 font-medium">Homework</th>
                  <th className="px-4 py-3 text-right font-medium">Grade</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows
                    columns={6}
                    cellClassNames={[
                      'h-5 w-20',
                      'h-5 w-28',
                      'h-5 w-40',
                      'h-5 w-44',
                      'ml-auto h-5 w-10',
                      'ml-auto h-5 w-16',
                    ]}
                  />
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={6}>
                      Failed to load diary.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && filteredEntries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={6}>
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : null}
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(entry.lesson.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {formatSubject(entry.lesson.subject)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.lesson.topic}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.lesson.homework ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold">
                      {entry.grade?.value ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.attendance ? (
                        <span
                          className={
                            entry.attendance.isPresent
                              ? 'font-medium text-emerald-700 dark:text-emerald-400'
                              : 'font-medium text-destructive'
                          }
                        >
                          {entry.attendance.isPresent ? 'Present' : 'Absent'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

type StatCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function CompactItem({
  detail,
  icon: Icon,
  meta,
  title,
}: {
  detail: string;
  icon: ComponentType<{ className?: string }>;
  meta: string;
  title: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function CompactSkeletonRows() {
  return (
    <>
      <div className="h-14 rounded-lg bg-muted" />
      <div className="h-14 rounded-lg bg-muted" />
      <div className="h-14 rounded-lg bg-muted" />
    </>
  );
}
