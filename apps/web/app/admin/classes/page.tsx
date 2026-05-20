'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import { AdminDeleteButton } from '@/components/admin/features/components/admin-delete-button';
import { ClassFormDialog } from '@/components/admin/features/components/class-form-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { innerApi } from '@/lib/api';

const classesQueryKey = ['admin', 'classes'] as const;

type SchoolClass = {
  id: number;
  name: string;
};

async function getClasses() {
  const response = await innerApi.get<SchoolClass[]>('/api/backend/classes');

  return response.data;
}

export default function AdminClassesPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: classesQueryKey,
    queryFn: getClasses,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Classes</h2>
          <p className="text-sm text-muted-foreground">
            Browse class groups used by students and lessons.
          </p>
        </div>
        <ClassFormDialog mode="create" queryKey={classesQueryKey} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All classes</CardTitle>
          <CardDescription>
            {pagination.totalItems} class
            {pagination.totalItems === 1 ? '' : 'es'} available.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      Loading classes...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={3}>
                      Failed to load classes.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      No classes found.
                    </td>
                  </tr>
                ) : null}
                {pagination.paginatedItems.map((schoolClass) => (
                  <tr key={schoolClass.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      #{schoolClass.id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {schoolClass.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ClassFormDialog
                          mode="edit"
                          queryKey={classesQueryKey}
                          schoolClass={schoolClass}
                        />
                        <AdminDeleteButton
                          endpoint={`/api/backend/classes/${schoolClass.id}`}
                          entityName="Class"
                          queryKey={classesQueryKey}
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
