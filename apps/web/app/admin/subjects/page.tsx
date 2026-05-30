'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import { AdminDeleteButton } from '@/components/admin/features/components/admin-delete-button';
import { SubjectFormDialog } from '@/components/admin/features/components/subject-form-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

const subjectsQueryKey = ['admin', 'subjects'] as const;

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

async function getSubjects() {
  const response = await innerApi.get<Subject[]>('/api/backend/subjects');

  return response.data;
}

export default function AdminSubjectsPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: subjectsQueryKey,
    queryFn: getSubjects,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Subjects</h2>
          <p className="text-sm text-muted-foreground">
            Review subjects used across school lessons.
          </p>
        </div>
        <SubjectFormDialog mode="create" queryKey={subjectsQueryKey} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All subjects</CardTitle>
          <CardDescription>
            {pagination.totalItems} subject
            {pagination.totalItems === 1 ? '' : 's'} available.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Short name</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeletonRows
                    columns={4}
                    cellClassNames={[
                      'h-5 w-12',
                      'h-5 w-48',
                      'h-5 w-16',
                      'ml-auto h-8 w-24',
                    ]}
                  />
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={4}>
                      Failed to load subjects.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                      No subjects found.
                    </td>
                  </tr>
                ) : null}
                {pagination.paginatedItems.map((subject) => (
                  <tr key={subject.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      #{subject.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{subject.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {subject.shortName ?? 'Not set'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <SubjectFormDialog
                          mode="edit"
                          queryKey={subjectsQueryKey}
                          subject={subject}
                        />
                        <AdminDeleteButton
                          endpoint={`/api/backend/subjects/${subject.id}`}
                          entityName="Subject"
                          queryKey={subjectsQueryKey}
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
