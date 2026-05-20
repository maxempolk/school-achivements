'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { innerApi } from '@/lib/api';

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
    queryKey: ['admin', 'subjects'],
    queryFn: getSubjects,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Subjects</h2>
        <p className="text-sm text-muted-foreground">
          Review subjects used across school lessons.
        </p>
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
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      Loading subjects...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={3}>
                      Failed to load subjects.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
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
