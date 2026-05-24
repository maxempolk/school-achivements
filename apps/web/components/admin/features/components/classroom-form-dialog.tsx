'use client';

import { useEffect, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createClassroomSchema,
  updateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from '@school/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { innerApi } from '@/lib/api';

type Classroom = {
  id: number;
  number: string;
  building: string | null;
  capacity: number | null;
};

type ClassroomFormValues = CreateClassroomInput | UpdateClassroomInput;

type ClassroomFormDialogProps = {
  mode: 'create' | 'edit';
  queryKey: readonly unknown[];
  classroom?: Classroom;
};

export function ClassroomFormDialog({
  mode,
  queryKey,
  classroom,
}: ClassroomFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const form = useForm<ClassroomFormValues>({
    resolver: standardSchemaResolver(
      isEdit ? updateClassroomSchema : createClassroomSchema,
    ),
    defaultValues: {
      number: classroom?.number ?? '',
      building: classroom?.building ?? '',
      capacity: classroom?.capacity ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        number: classroom?.number ?? '',
        building: classroom?.building ?? '',
        capacity: classroom?.capacity ?? null,
      });
    }
  }, [classroom, form, open]);

  const mutation = useMutation({
    mutationFn: async (values: ClassroomFormValues) => {
      if (isEdit && classroom) {
        await innerApi.patch(`/api/backend/classrooms/${classroom.id}`, values);
        return;
      }

      await innerApi.post('/api/backend/classrooms', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(isEdit ? 'Classroom updated' : 'Classroom created');
      setOpen(false);
    },
    onError: () => {
      toast.error(
        isEdit ? 'Failed to update classroom' : 'Failed to create classroom',
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid={
            isEdit ? 'edit-classroom-button' : 'create-classroom-button'
          }
          size="sm"
          variant={isEdit ? 'ghost' : 'default'}
        >
          {isEdit ? 'Edit' : 'Add'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit classroom' : 'Add classroom'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update classroom details.' : 'Create a new classroom.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`classroom-number-${classroom?.id ?? 'new'}`}>
              Number
            </Label>
            <Input
              id={`classroom-number-${classroom?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.number)}
              data-testid="classroom-number-input"
              {...form.register('number')}
            />
            {form.formState.errors.number ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.number.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`classroom-building-${classroom?.id ?? 'new'}`}>
              Building
            </Label>
            <Input
              id={`classroom-building-${classroom?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.building)}
              data-testid="classroom-building-input"
              {...form.register('building', {
                setValueAs: (value) =>
                  typeof value === 'string' && value.trim() === ''
                    ? null
                    : value,
              })}
            />
            {form.formState.errors.building ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.building.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`classroom-capacity-${classroom?.id ?? 'new'}`}>
              Capacity
            </Label>
            <Input
              id={`classroom-capacity-${classroom?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.capacity)}
              data-testid="classroom-capacity-input"
              min={1}
              type="number"
              {...form.register('capacity', {
                setValueAs: (value) => {
                  if (typeof value === 'string' && value.trim() === '') {
                    return null;
                  }

                  return Number(value);
                },
              })}
            />
            {form.formState.errors.capacity ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.capacity.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="save-classroom-button"
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
