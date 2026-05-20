'use client';

import { useEffect, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createSubjectSchema,
  updateSubjectSchema,
  type CreateSubjectInput,
  type UpdateSubjectInput,
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

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

type SubjectFormValues = CreateSubjectInput | UpdateSubjectInput;

type SubjectFormDialogProps = {
  mode: 'create' | 'edit';
  queryKey: readonly unknown[];
  subject?: Subject;
};

export function SubjectFormDialog({
  mode,
  queryKey,
  subject,
}: SubjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const form = useForm<SubjectFormValues>({
    resolver: standardSchemaResolver(
      isEdit ? updateSubjectSchema : createSubjectSchema,
    ),
    defaultValues: {
      name: subject?.name ?? '',
      shortName: subject?.shortName ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: subject?.name ?? '',
        shortName: subject?.shortName ?? '',
      });
    }
  }, [form, open, subject]);

  const mutation = useMutation({
    mutationFn: async (values: SubjectFormValues) => {
      if (isEdit && subject) {
        await innerApi.patch(`/api/backend/subjects/${subject.id}`, values);
        return;
      }

      await innerApi.post('/api/backend/subjects', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(isEdit ? 'Subject updated' : 'Subject created');
      setOpen(false);
    },
    onError: () => {
      toast.error(
        isEdit ? 'Failed to update subject' : 'Failed to create subject',
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={isEdit ? 'ghost' : 'default'}>
          {isEdit ? 'Edit' : 'Add'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit subject' : 'Add subject'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update subject details.' : 'Create a new subject.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`subject-name-${subject?.id ?? 'new'}`}>Name</Label>
            <Input
              id={`subject-name-${subject?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`subject-short-name-${subject?.id ?? 'new'}`}>
              Short name
            </Label>
            <Input
              id={`subject-short-name-${subject?.id ?? 'new'}`}
              aria-invalid={Boolean(form.formState.errors.shortName)}
              {...form.register('shortName', {
                setValueAs: (value) =>
                  typeof value === 'string' && value.trim() === ''
                    ? null
                    : value,
              })}
            />
            {form.formState.errors.shortName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.shortName.message}
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
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
