'use client';

import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CalendarX, Percent, Sigma } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import {
  selectParentChild,
  useParentChildren,
} from '@/components/parent/use-parent-children';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

type AttendanceRecord = {
  id: number;
  isPresent: boolean;
  lesson: {
    id: number;
    date: string;
    topic: string;
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
  };
};

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

  const stats = useMemo(() => {
    const total = data.length;
    const present = data.filter((record) => record.isPresent).length;
    const absent = total - present;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      absent,
      percentage,
      present,
      total,
    };
  }, [data]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Attendance</h2>
        <p className="text-sm text-muted-foreground">
          Review presence records for the selected child.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Sigma}
          label="Tracked lessons"
          value={String(stats.total)}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present"
          value={String(stats.present)}
        />
        <StatCard
          icon={CalendarX}
          label="Absent"
          value={String(stats.absent)}
        />
        <StatCard
          icon={Percent}
          label="Attendance rate"
          value={`${stats.percentage}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance records</CardTitle>
          <CardDescription>
            {stats.total} marked lesson{stats.total === 1 ? '' : 's'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Topic</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {childrenQuery.isLoading || isLoading ? (
                  <TableSkeletonRows
                    columns={5}
                    cellClassNames={[
                      'h-5 w-20',
                      'h-5 w-28',
                      'h-5 w-48',
                      'h-5 w-32',
                      'ml-auto h-5 w-16',
                    ]}
                  />
                ) : null}
                {childrenQuery.isError || isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={5}>
                      Failed to load attendance.
                    </td>
                  </tr>
                ) : null}
                {!childrenQuery.isLoading &&
                !isLoading &&
                !childrenQuery.isError &&
                !isError &&
                data.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      {selectedChild
                        ? 'No attendance records found.'
                        : 'Select a linked child first.'}
                    </td>
                  </tr>
                ) : null}
                {data.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(record.lesson.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {record.lesson.subject.shortName ??
                        record.lesson.subject.name}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {record.lesson.topic}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {record.lesson.teacher.lastName}{' '}
                      {record.lesson.teacher.firstName}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          record.isPresent
                            ? 'font-medium text-emerald-700 dark:text-emerald-400'
                            : 'font-medium text-destructive'
                        }
                      >
                        {record.isPresent ? 'Present' : 'Absent'}
                      </span>
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
