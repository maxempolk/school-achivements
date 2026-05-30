'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import { AdminDeleteButton } from '@/components/admin/features/components/admin-delete-button';
import { ClassroomFormDialog } from '@/components/admin/features/components/classroom-form-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

const classroomsQueryKey = ['admin', 'classrooms'] as const;

type Classroom = {
  id: number;
  number: string;
  building: string | null;
  capacity: number | null;
};

async function getClassrooms() {
  const response = await innerApi.get<Classroom[]>('/api/backend/classrooms');

  return response.data;
}

export default function AdminClassroomsPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: classroomsQueryKey,
    queryFn: getClassrooms,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Classrooms</h2>
          <p className="text-sm text-muted-foreground">
            Manage rooms used by lessons and schedule slots.
          </p>
        </div>
        <ClassroomFormDialog mode="create" queryKey={classroomsQueryKey} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All classrooms</CardTitle>
          <CardDescription>
            {pagination.totalItems} classroom
            {pagination.totalItems === 1 ? '' : 's'} available.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="min-w-40 px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows
                    columns={5}
                    cellClassNames={[
                      'h-5 w-12',
                      'h-5 w-20',
                      'h-5 w-24',
                      'h-5 w-16',
                      'ml-auto h-8 w-24',
                    ]}
                  />
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={5}>
                      Failed to load classrooms.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      No classrooms found.
                    </td>
                  </tr>
                ) : null}
                {pagination.paginatedItems.map((classroom) => (
                  <tr key={classroom.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      #{classroom.id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {classroom.number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {classroom.building ?? 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {classroom.capacity ?? 'Not set'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ClassroomFormDialog
                          mode="edit"
                          queryKey={classroomsQueryKey}
                          classroom={classroom}
                        />
                        <AdminDeleteButton
                          endpoint={`/api/backend/classrooms/${classroom.id}`}
                          entityName="Classroom"
                          queryKey={classroomsQueryKey}
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
