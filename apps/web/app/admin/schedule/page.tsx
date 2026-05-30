'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import { AdminDeleteButton } from '@/components/admin/features/components/admin-delete-button';
import {
  dayOfWeekOptions,
  formatSlotTime,
  ScheduleSlotFormDialog,
  type ScheduleSlotOptions,
} from '@/components/admin/features/components/schedule-slot-form-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

const scheduleSlotsQueryKey = ['admin', 'schedule-slots'] as const;
const scheduleSlotOptionsQueryKey = [
  'admin',
  'schedule-slots',
  'options',
] as const;

type DayOfWeek = (typeof dayOfWeekOptions)[number];
type WeekType = 'EVERY' | 'ODD' | 'EVEN';

type ScheduleSlot = {
  id: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  classroomId: number;
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

async function getScheduleSlots() {
  const response = await innerApi.get<ScheduleSlot[]>(
    '/api/backend/schedule-slots',
  );

  return response.data;
}

async function getScheduleSlotOptions() {
  const response = await innerApi.get<ScheduleSlotOptions>(
    '/api/backend/schedule-slots/options',
  );

  return response.data;
}

function dayOrder(day: DayOfWeek) {
  return dayOfWeekOptions.indexOf(day);
}

export default function AdminSchedulePage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: scheduleSlotsQueryKey,
    queryFn: getScheduleSlots,
  });

  const optionsQuery = useQuery({
    queryKey: scheduleSlotOptionsQueryKey,
    queryFn: getScheduleSlotOptions,
  });
  const options = optionsQuery.data ?? emptyOptions;

  const sortedData = [...data].sort((first, second) => {
    const dayDelta = dayOrder(first.dayOfWeek) - dayOrder(second.dayOfWeek);

    if (dayDelta !== 0) {
      return dayDelta;
    }

    return formatSlotTime(first.startTime).localeCompare(
      formatSlotTime(second.startTime),
    );
  });

  const pagination = useAdminPagination({
    items: sortedData,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Manage timetable cells with a simple form-based workflow.
          </p>
        </div>
        <ScheduleSlotFormDialog
          isLoadingOptions={optionsQuery.isLoading}
          mode="create"
          options={options}
          queryKey={scheduleSlotsQueryKey}
        />
      </div>
      {optionsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading schedule form options...
        </p>
      ) : null}
      {optionsQuery.isError ? (
        <p className="text-sm text-destructive">
          Failed to load schedule form options.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>All schedule slots</CardTitle>
          <CardDescription>
            {pagination.totalItems} slot
            {pagination.totalItems === 1 ? '' : 's'} configured.
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
                  <th className="min-w-48 px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Week</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows
                    columns={8}
                    cellClassNames={[
                      'h-5 w-20',
                      'h-5 w-24',
                      'h-5 w-20',
                      'h-5 w-32',
                      'h-5 w-36',
                      'h-5 w-20',
                      'h-5 w-16',
                      'ml-auto h-8 w-24',
                    ]}
                  />
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={8}>
                      Failed to load schedule slots.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={8}>
                      No schedule slots found.
                    </td>
                  </tr>
                ) : null}
                {pagination.paginatedItems.map((slot) => (
                  <tr key={slot.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{slot.dayOfWeek}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatSlotTime(slot.startTime)}-
                      {formatSlotTime(slot.endTime)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.class.name}
                    </td>
                    <td className="px-4 py-3">
                      {slot.subject.shortName ?? slot.subject.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.teacher.firstName} {slot.teacher.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.classroom.building
                        ? `${slot.classroom.number}, ${slot.classroom.building}`
                        : slot.classroom.number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.weekType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ScheduleSlotFormDialog
                          isLoadingOptions={optionsQuery.isLoading}
                          mode="edit"
                          options={options}
                          queryKey={scheduleSlotsQueryKey}
                          scheduleSlot={slot}
                        />
                        <AdminDeleteButton
                          endpoint={`/api/backend/schedule-slots/${slot.id}`}
                          entityName="Schedule slot"
                          queryKey={scheduleSlotsQueryKey}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </CardContent>
      </Card>
    </section>
  );
}

const emptyOptions: ScheduleSlotOptions = {
  classes: [],
  subjects: [],
  teachers: [],
  classrooms: [],
};
