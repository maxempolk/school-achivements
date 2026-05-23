'use client';

import { useQuery } from '@tanstack/react-query';
import type { CreateUserInput, UpdateUserInput } from '@school/shared-types';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';

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

type SchoolClass = {
  id: number;
  name: string;
};

type UserProfileFieldsProps = {
  form: UseFormReturn<CreateUserInput | UpdateUserInput>;
  disabled?: boolean;
};

async function getClasses() {
  const response = await innerApi.get<SchoolClass[]>('/api/backend/classes');

  return response.data;
}

export function UserProfileFields({ form, disabled }: UserProfileFieldsProps) {
  const role = useWatch({
    control: form.control,
    name: 'role',
  });

  const classesQuery = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: getClasses,
    enabled: role === 'STUDENT',
  });

  if (role !== 'TEACHER' && role !== 'STUDENT') {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <h3 className="text-sm font-medium">Profile settings</h3>
        <p className="text-sm text-muted-foreground">
          These fields create the linked {role.toLowerCase()} profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-first-name">First name</Label>
          <Input
            id="profile-first-name"
            data-testid="profile-first-name-input"
            disabled={disabled}
            {...form.register('profile.firstName')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-last-name">Last name</Label>
          <Input
            id="profile-last-name"
            data-testid="profile-last-name-input"
            disabled={disabled}
            {...form.register('profile.lastName')}
          />
        </div>
      </div>

      {role === 'STUDENT' ? (
        <div className="flex flex-col gap-2">
          <Label>Class</Label>
          <Controller
            control={form.control}
            name={'profile.classId'}
            render={({ field }) => (
              <Select
                disabled={disabled || classesQuery.isLoading}
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger
                  className="w-full"
                  data-testid="profile-class-select"
                >
                  <SelectValue
                    placeholder={
                      classesQuery.isLoading
                        ? 'Loading classes...'
                        : 'Select class'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(classesQuery.data ?? []).map((schoolClass) => (
                      <SelectItem
                        key={schoolClass.id}
                        value={String(schoolClass.id)}
                      >
                        {schoolClass.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          {classesQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load classes.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
