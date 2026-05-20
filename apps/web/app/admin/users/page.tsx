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

type AdminUser = {
  id: number;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

async function getUsers() {
  const response = await innerApi.get<AdminUser[]>('/api/backend/users');

  return response.data;
}

export default function AdminUsersPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getUsers,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage school accounts and access roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            {pagination.totalItems} account
            {pagination.totalItems === 1 ? '' : 's'} in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      Loading users...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={3}>
                      Failed to load users.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      No users found.
                    </td>
                  </tr>
                ) : null}
                {pagination.paginatedItems.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      #{user.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.role}
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
