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
import { Controller, useForm } from 'react-hook-form';
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

type AdminUser = {
  id: number;
  email: string;
  role: CreateUserInput['role'];
};

type UserFormValues = CreateUserInput | UpdateUserInput;

type UserFormDialogProps = {
  mode: 'create' | 'edit';
  queryKey: readonly unknown[];
  user?: AdminUser;
};

const roleOptions = roleSchema.options;

export function UserFormDialog({ mode, queryKey, user }: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const form = useForm<UserFormValues>({
    resolver: standardSchemaResolver(
      isEdit ? updateUserSchema : createUserSchema,
    ),
    defaultValues: {
      email: user?.email ?? '',
      password: undefined,
      role: user?.role ?? 'ADMIN',
      profile: {
        firstName: '',
        lastName: '',
        classId: undefined,
      },
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      email: user?.email ?? '',
      password: undefined,
      role: user?.role ?? 'ADMIN',
      profile: {
        firstName: '',
        lastName: '',
        classId: undefined,
      },
    });
  }, [form, open, user]);

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
    onError: () => {
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    },
  });

  function onSubmit(values: UserFormValues) {
    if (values.role === 'ADMIN') {
      values.profile = undefined;
    }

    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={isEdit ? 'ghost' : 'default'}>
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(form.formState.errors.role)}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {roleOptions.map((role) => (
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

          {!isEdit ? (
            <UserProfileFields form={form} disabled={mutation.isPending} />
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
