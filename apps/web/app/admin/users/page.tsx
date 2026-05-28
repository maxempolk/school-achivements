'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminPagination,
  useAdminPagination,
} from '@/components/admin/admin-pagination';
import { AdminDeleteButton } from '@/components/admin/features/components/admin-delete-button';
import { ParentChildrenDialog } from '@/components/admin/features/components/parent-children-dialog';
import { TeacherAssignmentsDialog } from '@/components/admin/features/components/teacher-assignments-dialog';
import { UserFormDialog } from '@/components/admin/features/components/user-form-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { innerApi } from '@/lib/api';

const usersQueryKey = ['admin', 'users'] as const;

type AdminUser = {
  id: number;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  teacher: {
    id: number;
    classes: Array<{
      classId: number;
    }>;
    subjects: Array<{
      subjectId: number;
    }>;
  } | null;
  parent: {
    id: number;
    children: Array<{
      studentId: number;
    }>;
  } | null;
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
    queryKey: usersQueryKey,
    queryFn: getUsers,
  });

  const pagination = useAdminPagination({
    items: data,
    pageSize: 10,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage school accounts and access roles.
          </p>
        </div>
        <UserFormDialog mode="create" queryKey={usersQueryKey} />
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
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                      Loading users...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={4}>
                      Failed to load users.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && pagination.totalItems === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {user.role === 'TEACHER' ? (
                          <TeacherAssignmentsDialog
                            queryKey={usersQueryKey}
                            teacherUser={user}
                          />
                        ) : null}
                        {user.role === 'PARENT' ? (
                          <ParentChildrenDialog
                            parent={user}
                            queryKey={usersQueryKey}
                          />
                        ) : null}
                        <UserFormDialog
                          mode="edit"
                          queryKey={usersQueryKey}
                          user={user}
                        />
                        <AdminDeleteButton
                          endpoint={`/api/backend/users/${user.id}`}
                          entityName="User"
                          queryKey={usersQueryKey}
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
