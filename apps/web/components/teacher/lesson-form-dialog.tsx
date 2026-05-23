'use client';

import { useEffect, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createLessonSchema,
  type CreateLessonInput,
} from '@school/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
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

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

const lessonsQueryKey = ['teacher', 'lessons'] as const;

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function getClasses() {
  const response = await innerApi.get<SchoolClass[]>('/api/backend/classes');
  return response.data;
}

async function getSubjects() {
  const response = await innerApi.get<Subject[]>('/api/backend/subjects');
  return response.data;
}

export function LessonFormDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const classesQuery = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: getClasses,
  });
  const subjectsQuery = useQuery({
    queryKey: ['teacher', 'subjects'],
    queryFn: getSubjects,
  });

  const form = useForm<CreateLessonInput>({
    resolver: standardSchemaResolver(createLessonSchema),
    defaultValues: {
      classId: 0,
      subjectId: 0,
      date: toDateTimeLocalValue(new Date()),
      topic: '',
      homework: null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        classId: 0,
        subjectId: 0,
        date: toDateTimeLocalValue(new Date()),
        topic: '',
        homework: null,
      });
    }
  }, [form, open]);

  const createMutation = useMutation({
    mutationFn: async (values: CreateLessonInput) => {
      await innerApi.post('/api/backend/lessons', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lessonsQueryKey });
      toast.success('Lesson created');
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to create lesson');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-lesson-button">Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add lesson</DialogTitle>
          <DialogDescription>
            Create a lesson for your schedule.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values),
          )}
        >
          <div className="flex flex-col gap-2">
            <Label>Class</Label>
            <Controller
              control={form.control}
              name="classId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger
                    className="w-full"
                    data-testid="lesson-class-select"
                  >
                    <SelectValue placeholder="Select class" />
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
            {form.formState.errors.classId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.classId.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Subject</Label>
            <Controller
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger
                    className="w-full"
                    data-testid="lesson-subject-select"
                  >
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(subjectsQuery.data ?? []).map((subject) => (
                        <SelectItem key={subject.id} value={String(subject.id)}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.subjectId ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.subjectId.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-date">Date</Label>
            <Input
              id="lesson-date"
              data-testid="lesson-date-input"
              type="datetime-local"
              {...form.register('date', {
                setValueAs: (value) =>
                  typeof value === 'string' && value
                    ? new Date(value).toISOString()
                    : value,
              })}
            />
            {form.formState.errors.date ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.date.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-topic">Topic</Label>
            <Input
              id="lesson-topic"
              data-testid="lesson-topic-input"
              {...form.register('topic')}
            />
            {form.formState.errors.topic ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.topic.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-homework">Homework</Label>
            <Input
              id="lesson-homework"
              data-testid="lesson-homework-input"
              {...form.register('homework', {
                setValueAs: (value) =>
                  typeof value === 'string' && value.trim() === ''
                    ? null
                    : value,
              })}
            />
            {form.formState.errors.homework ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.homework.message}
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
              data-testid="save-lesson-button"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
