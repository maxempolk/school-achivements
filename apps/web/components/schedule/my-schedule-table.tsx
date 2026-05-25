'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-error';
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
type WeekType = 'EVERY' | 'ODD' | 'EVEN';

type ScheduleSlot = {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  weekType: WeekType;
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
    shortName: string | null;
  };
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
  lessons: Array<{
    id: number;
    date: string;
  }>;
};

type MyScheduleTableProps = {
  audience: 'student' | 'teacher';
};

type StartedLesson = {
  id: number;
};

async function getMySchedule() {
  const response = await innerApi.get<ScheduleSlot[]>(
    '/api/backend/schedule-slots/me',
  );

  return response.data;
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

function dayOrder(day: DayOfWeek) {
  return dayOfWeekOptions.indexOf(day);
}

function getNextOccurrenceDate(day: DayOfWeek, startTime: string) {
  const now = new Date();
  const date = new Date(now);
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const targetDayIndex = dayOrder(day);
  const dayDelta = (targetDayIndex - currentDayIndex + 7) % 7;
  const slotStartTime = new Date(startTime);

  date.setDate(now.getDate() + dayDelta);

  if (!Number.isNaN(slotStartTime.getTime())) {
    date.setHours(slotStartTime.getHours(), slotStartTime.getMinutes(), 0, 0);
  }

  return date.toISOString();
}

function findLessonForDate(slot: ScheduleSlot, lessonDate: string) {
  const lessonTimestamp = new Date(lessonDate).getTime();

  return slot.lessons.find(
    (lesson) => new Date(lesson.date).getTime() === lessonTimestamp,
  );
}

function formatClassroom(classroom: ScheduleSlot['classroom']) {
  return classroom.building
    ? `${classroom.number}, ${classroom.building}`
    : classroom.number;
}

export function MyScheduleTable({ audience }: MyScheduleTableProps) {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: [audience, 'schedule'],
    queryFn: getMySchedule,
  });

  const sortedData = [...data].sort((first, second) => {
    const dayDelta = dayOrder(first.dayOfWeek) - dayOrder(second.dayOfWeek);

    if (dayDelta !== 0) {
      return dayDelta;
    }

    return formatSlotTime(first.startTime).localeCompare(
      formatSlotTime(second.startTime),
    );
  });
  const columnCount = 7;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly schedule</CardTitle>
        <CardDescription>
          {sortedData.length} schedule slot
          {sortedData.length === 1 ? '' : 's'} assigned.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Day</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="min-w-48 px-4 py-3 font-medium">Subject</th>
                {audience === 'student' ? (
                  <th className="min-w-48 px-4 py-3 font-medium">Teacher</th>
                ) : null}
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Week</th>
                {audience === 'teacher' ? (
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={columnCount}
                  >
                    Loading schedule...
                  </td>
                </tr>
              ) : null}
              {isError ? (
                <tr>
                  <td
                    className="px-4 py-8 text-destructive"
                    colSpan={columnCount}
                  >
                    Failed to load schedule.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !isError && sortedData.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={columnCount}
                  >
                    No schedule slots found.
                  </td>
                </tr>
              ) : null}
              {sortedData.map((slot) => (
                <tr key={slot.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{slot.dayOfWeek}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatSlotTime(slot.startTime)}-
                    {formatSlotTime(slot.endTime)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {slot.class.name}
                  </td>
                  <td className="px-4 py-3">
                    {slot.subject.shortName ?? slot.subject.name}
                  </td>
                  {audience === 'student' ? (
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.teacher.firstName} {slot.teacher.lastName}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatClassroom(slot.classroom)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {slot.weekType}
                  </td>
                  {audience === 'teacher' ? (
                    <td className="px-4 py-3 text-right">
                      <StartLessonButton slot={slot} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StartLessonButton({ slot }: { slot: ScheduleSlot }) {
  const router = useRouter();
  const lessonDate = getNextOccurrenceDate(slot.dayOfWeek, slot.startTime);
  const existingLesson = findLessonForDate(slot, lessonDate);
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await innerApi.post<StartedLesson>(
        '/api/backend/lessons/from-schedule-slot',
        {
          scheduleSlotId: slot.id,
          date: lessonDate,
        },
      );

      return response.data;
    },
    onSuccess: (lesson) => {
      router.push(`/teacher/lessons/${lesson.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) ?? 'Failed to start lesson');
    },
  });

  function handleClick() {
    if (existingLesson) {
      router.push(`/teacher/lessons/${existingLesson.id}`);
      return;
    }

    mutation.mutate();
  }

  return (
    <Button
      disabled={mutation.isPending}
      size="sm"
      variant="outline"
      onClick={handleClick}
    >
      <Play data-icon="inline-start" />
      {mutation.isPending
        ? 'Starting...'
        : existingLesson
          ? 'Open lesson'
          : 'Start lesson'}
    </Button>
  );
}
