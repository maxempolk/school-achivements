'use client';

import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
};

type MyScheduleTableProps = {
  audience: 'student' | 'teacher';
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={audience === 'student' ? 7 : 6}
                  >
                    Loading schedule...
                  </td>
                </tr>
              ) : null}
              {isError ? (
                <tr>
                  <td
                    className="px-4 py-8 text-destructive"
                    colSpan={audience === 'student' ? 7 : 6}
                  >
                    Failed to load schedule.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !isError && sortedData.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={audience === 'student' ? 7 : 6}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
