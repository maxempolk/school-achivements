'use client';

import { useEffect, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createClassSchema,
  updateClassSchema,
  type CreateClassInput,
  type UpdateClassInput,
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

type SchoolClass = {
  id: number;
  name: string;
};

type ClassFormValues = CreateClassInput | UpdateClassInput;

type ClassFormDialogProps = {
  mode: 'create' | 'edit';
  queryKey: readonly unknown[];
  schoolClass?: SchoolClass;
};

export function ClassFormDialog({
  mode,
  queryKey,
  schoolClass,
}: ClassFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const form = useForm<ClassFormValues>({
    resolver: standardSchemaResolver(
      isEdit ? updateClassSchema : createClassSchema,
    ),
    defaultValues: {
      name: schoolClass?.name ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: schoolClass?.name ?? '' });
    }
  }, [form, open, schoolClass]);

  const mutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      if (isEdit && schoolClass) {
        await innerApi.patch(`/api/backend/classes/${schoolClass.id}`, values);
        return;
      }

      await innerApi.post('/api/backend/classes', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(isEdit ? 'Class updated' : 'Class created');
      setOpen(false);
    },
    onError: () => {
      toast.error(isEdit ? 'Failed to update class' : 'Failed to create class');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid={isEdit ? 'edit-class-button' : 'create-class-button'}
          size="sm"
          variant={isEdit ? 'ghost' : 'default'}
        >
          {isEdit ? 'Edit' : 'Add'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit class' : 'Add class'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update class name.' : 'Create a new class group.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`class-name-${schoolClass?.id ?? 'new'}`}>
              Name
            </Label>
            <Input
              id={`class-name-${schoolClass?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.name)}
              data-testid="class-name-input"
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
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
              data-testid="save-class-button"
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
