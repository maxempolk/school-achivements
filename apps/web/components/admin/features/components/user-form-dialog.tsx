'use client';

import { useEffect, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createUserSchema,
  roleSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '@school/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { UserProfileFields } from '@/components/admin/features/components/user-profile-fields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

type AdminUser = {
  id: number;
  email: string;
  role: CreateUserInput['role'];
  isSuperAdmin: boolean;
  teacher: {
    firstName: string;
    lastName: string;
  } | null;
  student: {
    firstName: string;
    lastName: string;
    classId: number;
  } | null;
};

type UserFormValues = CreateUserInput | UpdateUserInput;

type UserFormDialogProps = {
  mode: 'create' | 'edit';
  queryKey: readonly unknown[];
  user?: AdminUser;
  viewerIsSuperAdmin?: boolean;
};

const roleOptions = roleSchema.options;
type UserRole = CreateUserInput['role'];

function getEmptyProfileForRole(role: UserRole) {
  if (role !== 'TEACHER' && role !== 'STUDENT') {
    return undefined;
  }

  return {
    firstName: '',
    lastName: '',
    classId: undefined,
  };
}

function getDefaultValues(
  isEdit: boolean,
  viewerIsSuperAdmin: boolean,
  user?: AdminUser,
): UserFormValues {
  if (isEdit) {
    const role = user?.role ?? 'TEACHER';
    const profile =
      role === 'TEACHER'
        ? {
            firstName: user?.teacher?.firstName ?? '',
            lastName: user?.teacher?.lastName ?? '',
            classId: undefined,
          }
        : role === 'STUDENT'
          ? {
              firstName: user?.student?.firstName ?? '',
              lastName: user?.student?.lastName ?? '',
              classId: user?.student?.classId,
            }
          : undefined;

    return {
      email: user?.email ?? '',
      password: undefined,
      role,
      profile,
    };
  }

  return {
    email: '',
    password: '',
    role: viewerIsSuperAdmin ? 'ADMIN' : 'TEACHER',
    profile: undefined,
  };
}

export function UserFormDialog({
  mode,
  queryKey,
  user,
  viewerIsSuperAdmin = false,
}: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSuperAdminFlag, setIsSuperAdminFlag] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';
  const availableRoleOptions = viewerIsSuperAdmin
    ? roleOptions
    : roleOptions.filter((role) => role !== 'ADMIN');

  const form = useForm<UserFormValues>({
    resolver: standardSchemaResolver<UserFormValues, unknown, UserFormValues>(
      isEdit ? updateUserSchema : createUserSchema,
    ),
    defaultValues: getDefaultValues(isEdit, viewerIsSuperAdmin, user),
  });

  const selectedRole = useWatch({
    control: form.control,
    name: 'role',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getDefaultValues(isEdit, viewerIsSuperAdmin, user));
  }, [form, isEdit, open, user, viewerIsSuperAdmin]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setIsSuperAdminFlag(user?.isSuperAdmin ?? false);
    }

    setOpen(nextOpen);
  }

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (isEdit && user) {
        await innerApi.patch(`/api/backend/users/${user.id}`, values);
        return;
      }

      await innerApi.post('/api/backend/users', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(isEdit ? 'User updated' : 'User created');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error) ??
          (isEdit ? 'Failed to update user' : 'Failed to create user'),
      );
    },
  });

  function onSubmit(values: UserFormValues) {
    const payload = { ...values };

    if (payload.role === 'ADMIN' || payload.role === 'PARENT') {
      payload.profile = undefined;
    }

    if (isEdit && viewerIsSuperAdmin) {
      mutation.mutate({
        ...payload,
        isSuperAdmin: payload.role === 'ADMIN' ? isSuperAdminFlag : false,
      });
      return;
    }

    mutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          data-testid={isEdit ? 'edit-user-button' : 'create-user-button'}
          size="sm"
          variant={isEdit ? 'ghost' : 'default'}
        >
          {isEdit ? 'Edit' : 'Create'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'Create user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update account details and role.'
              : 'Create a new school account.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`user-email-${user?.id ?? 'new'}`}>Email</Label>
            <Input
              id={`user-email-${user?.id ?? 'new'}`}
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              data-testid="user-email-input"
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`user-password-${user?.id ?? 'new'}`}>
              Password
            </Label>
            <Input
              id={`user-password-${user?.id ?? 'new'}`}
              type="password"
              autoComplete={isEdit ? 'new-password' : 'current-password'}
              aria-invalid={Boolean(form.formState.errors.password)}
              data-testid="user-password-input"
              placeholder={isEdit ? 'Leave empty to keep current password' : ''}
              {...form.register('password', {
                setValueAs: (value) =>
                  typeof value === 'string' && value.trim() === ''
                    ? undefined
                    : value,
              })}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: UserRole) => {
                    field.onChange(value);
                    form.setValue('profile', getEmptyProfileForRole(value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(form.formState.errors.role)}
                    data-testid="user-role-select"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableRoleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.role ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            ) : null}
          </div>

          {isEdit && viewerIsSuperAdmin && selectedRole === 'ADMIN' ? (
            <div className="flex items-center gap-2">
              <input
                id={`user-super-admin-${user?.id ?? 'new'}`}
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={isSuperAdminFlag}
                onChange={(event) => setIsSuperAdminFlag(event.target.checked)}
              />
              <Label htmlFor={`user-super-admin-${user?.id ?? 'new'}`}>
                Super admin — can create, edit and delete administrators
              </Label>
            </div>
          ) : null}

          <UserProfileFields form={form} disabled={mutation.isPending} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="save-user-button"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
