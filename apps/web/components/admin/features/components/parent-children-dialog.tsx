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
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

type ParentChildrenDialogProps = {
  parent: {
    id: number;
    email: string;
    parent: {
      id: number;
      children: Array<{
        studentId: number;
      }>;
    } | null;
  };
  queryKey: readonly unknown[];
};

type StudentOption = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
};

async function getStudents() {
  const response = await innerApi.get<StudentOption[]>('/api/backend/students');

  return response.data;
}

export function ParentChildrenDialog({
  parent,
  queryKey,
}: ParentChildrenDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const studentsQuery = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: getStudents,
    enabled: open,
  });
  const initialStudentIds = useMemo(
    () => parent.parent?.children.map((child) => child.studentId) ?? [],
    [parent.parent?.children],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!parent.parent) {
        throw new Error('Parent profile is missing');
      }

      await innerApi.put(`/api/backend/parents/${parent.parent.id}/students`, {
        studentIds: selectedStudentIds,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Children updated');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) ?? 'Failed to update children');
    },
  });

  function toggleStudent(studentId: number) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedStudentIds(initialStudentIds);
    }

    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!parent.parent} size="sm" variant="ghost">
          Children
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage children</DialogTitle>
          <DialogDescription>{parent.email}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
          {studentsQuery.isLoading ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">
              Loading students...
            </p>
          ) : null}
          {studentsQuery.isError ? (
            <p className="px-2 py-6 text-sm text-destructive">
              Failed to load students.
            </p>
          ) : null}
          {!studentsQuery.isLoading &&
          !studentsQuery.isError &&
          (studentsQuery.data ?? []).length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">
              No students found.
            </p>
          ) : null}
          {(studentsQuery.data ?? []).map((student) => (
            <label
              key={student.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <input
                checked={selectedStudentIds.includes(student.id)}
                className="size-4 accent-foreground"
                disabled={mutation.isPending}
                type="checkbox"
                onChange={() => toggleStudent(student.id)}
              />
              <span className="font-medium">
                {student.lastName} {student.firstName}
              </span>
              <span className="text-muted-foreground">#{student.id}</span>
            </label>
          ))}
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
            disabled={!parent.parent || mutation.isPending}
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
