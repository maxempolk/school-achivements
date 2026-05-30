'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { ListSkeleton } from '@/components/ui/list-skeleton';
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

type TeacherAssignmentsDialogProps = {
  queryKey: readonly unknown[];
  teacherUser: {
    id: number;
    email: string;
    teacher: {
      id: number;
      classes: Array<{
        classId: number;
      }>;
      subjects: Array<{
        subjectId: number;
      }>;
    } | null;
  };
};

type ClassOption = {
  id: number;
  name: string;
};

type SubjectOption = {
  id: number;
  name: string;
  shortName: string | null;
};

async function getClasses() {
  const response = await innerApi.get<ClassOption[]>('/api/backend/classes');

  return response.data;
}

async function getSubjects() {
  const response = await innerApi.get<SubjectOption[]>('/api/backend/subjects');

  return response.data;
}

export function TeacherAssignmentsDialog({
  queryKey,
  teacherUser,
}: TeacherAssignmentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const classesQuery = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: getClasses,
    enabled: open,
  });
  const subjectsQuery = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: getSubjects,
    enabled: open,
  });
  const initialClassIds = useMemo(
    () => teacherUser.teacher?.classes.map(({ classId }) => classId) ?? [],
    [teacherUser.teacher?.classes],
  );
  const initialSubjectIds = useMemo(
    () => teacherUser.teacher?.subjects.map(({ subjectId }) => subjectId) ?? [],
    [teacherUser.teacher?.subjects],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!teacherUser.teacher) {
        throw new Error('Teacher profile is missing');
      }

      await innerApi.put(
        `/api/backend/teachers/${teacherUser.teacher.id}/assignments`,
        {
          classIds: selectedClassIds,
          subjectIds: selectedSubjectIds,
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Teacher assignments updated');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error) ?? 'Failed to update teacher assignments',
      );
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedClassIds(initialClassIds);
      setSelectedSubjectIds(initialSubjectIds);
    }

    setOpen(nextOpen);
  }

  function toggleClass(classId: number) {
    setSelectedClassIds((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    );
  }

  function toggleSubject(subjectId: number) {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!teacherUser.teacher} size="sm" variant="ghost">
          Assignments
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teacher assignments</DialogTitle>
          <DialogDescription>{teacherUser.email}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <AssignmentList
            emptyText="No classes found."
            errorText="Failed to load classes."
            isError={classesQuery.isError}
            isLoading={classesQuery.isLoading}
            items={classesQuery.data ?? []}
            selectedIds={selectedClassIds}
            title="Classes"
            getLabel={(item) => item.name}
            onToggle={toggleClass}
          />
          <AssignmentList
            emptyText="No subjects found."
            errorText="Failed to load subjects."
            isError={subjectsQuery.isError}
            isLoading={subjectsQuery.isLoading}
            items={subjectsQuery.data ?? []}
            selectedIds={selectedSubjectIds}
            title="Subjects"
            getLabel={(item) =>
              item.shortName ? `${item.name} (${item.shortName})` : item.name
            }
            onToggle={toggleSubject}
          />
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
            disabled={!teacherUser.teacher || mutation.isPending}
            type="button"
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AssignmentListProps<T extends { id: number }> = {
  emptyText: string;
  errorText: string;
  isError: boolean;
  isLoading: boolean;
  items: T[];
  selectedIds: number[];
  title: string;
  getLabel: (item: T) => string;
  onToggle: (id: number) => void;
};

function AssignmentList<T extends { id: number }>({
  emptyText,
  errorText,
  isError,
  isLoading,
  items,
  selectedIds,
  title,
  getLabel,
  onToggle,
}: AssignmentListProps<T>) {
  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
      <p className="px-2 text-sm font-medium">{title}</p>
      {isLoading ? <ListSkeleton showCheckbox /> : null}
      {isError ? (
        <p className="px-2 py-6 text-sm text-destructive">{errorText}</p>
      ) : null}
      {!isLoading && !isError && items.length === 0 ? (
        <p className="px-2 py-6 text-sm text-muted-foreground">{emptyText}</p>
      ) : null}
      {items.map((item) => (
        <label
          key={item.id}
          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <input
            checked={selectedIds.includes(item.id)}
            className="size-4 accent-foreground"
            type="checkbox"
            onChange={() => onToggle(item.id)}
          />
          <span className="font-medium">{getLabel(item)}</span>
          <span className="text-muted-foreground">#{item.id}</span>
        </label>
      ))}
    </div>
  );
}
