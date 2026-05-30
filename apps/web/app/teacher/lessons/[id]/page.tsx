'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { History } from 'lucide-react';
import {
  createGradeSchema,
  updateLessonSchema,
  type CreateGradeInput,
  type UpdateLessonInput,
  type UpsertAttendanceInput,
} from '@school/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

type LessonDetails = {
  id: number;
  date: string;
  topic: string;
  homework: string | null;
  class: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
    shortName: string | null;
  };
  grades: Array<{
    id: number;
    studentId: number;
    value: number;
    comment: string | null;
  }>;
  attendances: Array<{
    id: number;
    studentId: number;
    isPresent: boolean;
  }>;
};

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
};

type GradeAuditLog = {
  id: number;
  action: 'CREATED' | 'UPDATED';
  oldValue: number | null;
  newValue: number;
  oldComment: string | null;
  newComment: string | null;
  createdAt: string;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
};

async function getLesson(id: string) {
  const response = await innerApi.get<LessonDetails>(
    `/api/backend/lessons/${id}`,
  );
  return response.data;
}

async function getStudents(classId: number) {
  const response = await innerApi.get<Student[]>('/api/backend/students', {
    params: {
      classId,
    },
  });
  return response.data;
}

async function getGradeAuditLog(gradeId: number) {
  const response = await innerApi.get<GradeAuditLog[]>(
    `/api/backend/grades/${gradeId}/audit-log`,
  );
  return response.data;
}

function GradeInput({
  lessonId,
  student,
  initialGrade,
}: {
  lessonId: number;
  student: Student;
  initialGrade?: LessonDetails['grades'][number];
}) {
  const [value, setValue] = useState(initialGrade?.value.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: CreateGradeInput) => {
      await innerApi.post('/api/backend/grades', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['teacher', 'lesson', String(lessonId)],
      });
      toast.success('Grade saved');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) ?? 'Failed to save grade');
    },
  });

  function handleSave() {
    const payload = {
      lessonId,
      studentId: student.id,
      value: Number(value),
    };

    const parsed = createGradeSchema.safeParse(payload);

    if (!parsed.success) {
      setError('Grade must be a number from 1 to 12');
      return;
    }

    setError(null);
    mutation.mutate(parsed.data);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        <Input
          aria-invalid={Boolean(error)}
          className="w-24"
          data-testid={`grade-input-${student.id}`}
          inputMode="numeric"
          max={12}
          min={1}
          type="number"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
        <Button
          data-testid={`save-grade-${student.id}`}
          disabled={mutation.isPending}
          size="sm"
          onClick={handleSave}
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
        {initialGrade ? <GradeHistoryDialog grade={initialGrade} /> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function GradeHistoryDialog({
  grade,
}: {
  grade: LessonDetails['grades'][number];
}) {
  const [open, setOpen] = useState(false);
  const auditLogQuery = useQuery({
    queryKey: ['teacher', 'grade-audit-log', grade.id],
    queryFn: () => getGradeAuditLog(grade.id),
    enabled: open,
  });

  return (
    <>
      <Button
        aria-label="Open grade history"
        size="sm"
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <History className="size-4" />
        History
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade history</DialogTitle>
            <DialogDescription>
              Review previous changes for this grade.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {auditLogQuery.isLoading ? (
                  <TableSkeletonRows
                    columns={4}
                    rows={4}
                    cellClassNames={[
                      'h-5 w-36',
                      'h-5 w-20',
                      'h-5 w-32',
                      'ml-auto h-5 w-24',
                    ]}
                  />
                ) : null}
                {auditLogQuery.isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={4}>
                      Failed to load history.
                    </td>
                  </tr>
                ) : null}
                {!auditLogQuery.isLoading &&
                !auditLogQuery.isError &&
                auditLogQuery.data?.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                      No grade changes yet.
                    </td>
                  </tr>
                ) : null}
                {(auditLogQuery.data ?? []).map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{entry.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.teacher
                        ? `${entry.teacher.lastName} ${entry.teacher.firstName}`
                        : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium">
                        {entry.oldValue ?? 'none'} -&gt; {entry.newValue}
                      </p>
                      {entry.oldComment || entry.newComment ? (
                        <p className="text-xs text-muted-foreground">
                          {entry.oldComment ?? 'none'} -&gt;{' '}
                          {entry.newComment ?? 'none'}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AttendanceCheckbox({
  isPresent,
  lessonId,
  student,
}: {
  isPresent: boolean;
  lessonId: number;
  student: Student;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: UpsertAttendanceInput) => {
      await innerApi.post('/api/backend/attendance', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['teacher', 'lesson', String(lessonId)],
      });
      toast.success('Attendance saved');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) ?? 'Failed to save attendance');
    },
  });
  const checked = mutation.isPending
    ? (mutation.variables?.isPresent ?? isPresent)
    : isPresent;

  function handleChange(nextChecked: boolean) {
    mutation.mutate({
      lessonId,
      studentId: student.id,
      isPresent: nextChecked,
    });
  }

  return (
    <input
      aria-label={`Mark ${student.lastName} ${student.firstName} present`}
      checked={checked}
      className="size-4 rounded border-input accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      data-testid={`attendance-checkbox-${student.id}`}
      disabled={mutation.isPending}
      type="checkbox"
      onChange={(event) => handleChange(event.target.checked)}
    />
  );
}

export default function TeacherLessonPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params.id;
  const queryClient = useQueryClient();

  const lessonQuery = useQuery({
    queryKey: ['teacher', 'lesson', lessonId],
    queryFn: () => getLesson(lessonId),
  });

  const studentsQuery = useQuery({
    queryKey: ['teacher', 'lesson', lessonId, 'students'],
    queryFn: () => getStudents(lessonQuery.data?.class.id ?? 0),
    enabled: Boolean(lessonQuery.data?.class.id),
  });

  const form = useForm<UpdateLessonInput>({
    resolver: standardSchemaResolver(updateLessonSchema),
    defaultValues: {
      topic: '',
      homework: null,
    },
  });

  useEffect(() => {
    if (lessonQuery.data) {
      form.reset({
        topic: lessonQuery.data.topic,
        homework: lessonQuery.data.homework ?? null,
      });
    }
  }, [form, lessonQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateLessonInput) => {
      await innerApi.patch(`/api/backend/lessons/${lessonId}`, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['teacher', 'lesson', lessonId],
      });
      await queryClient.invalidateQueries({ queryKey: ['teacher', 'lessons'] });
      toast.success('Lesson updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) ?? 'Failed to update lesson');
    },
  });

  const gradesByStudentId = useMemo(() => {
    const map = new Map<number, LessonDetails['grades'][number]>();

    for (const grade of lessonQuery.data?.grades ?? []) {
      map.set(grade.studentId, grade);
    }

    return map;
  }, [lessonQuery.data?.grades]);
  const attendanceByStudentId = useMemo(() => {
    const map = new Map<number, boolean>();

    for (const attendance of lessonQuery.data?.attendances ?? []) {
      map.set(attendance.studentId, attendance.isPresent);
    }

    return map;
  }, [lessonQuery.data?.attendances]);

  if (lessonQuery.isLoading) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-20 self-end" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                <TableSkeletonRows columns={3} />
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <div className="text-sm text-destructive">Failed to load lesson.</div>
    );
  }

  const lesson = lessonQuery.data;
  const students = studentsQuery.data ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Button asChild className="w-fit" size="sm" variant="outline">
          <Link href="/teacher/lessons">Back to lessons</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {lesson.subject.name} · {lesson.class.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date(lesson.date).toLocaleString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson details</CardTitle>
          <CardDescription>Update topic and homework.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={form.handleSubmit((values) =>
              updateMutation.mutate(values),
            )}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson-topic">Topic</Label>
              <Input id="lesson-topic" {...form.register('topic')} />
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
            <Button
              className="self-end"
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class students</CardTitle>
          <CardDescription>
            Mark attendance and set grades for this lesson.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 text-center font-medium">Present</th>
                  <th className="px-4 py-3 text-right font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentsQuery.isLoading ? (
                  <TableSkeletonRows
                    columns={3}
                    cellClassNames={[
                      'h-5 w-40',
                      'mx-auto h-4 w-4 rounded-sm',
                      'ml-auto h-8 w-56',
                    ]}
                  />
                ) : null}
                {studentsQuery.isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={3}>
                      Failed to load students.
                    </td>
                  </tr>
                ) : null}
                {!studentsQuery.isLoading &&
                !studentsQuery.isError &&
                students.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                      No students found.
                    </td>
                  </tr>
                ) : null}
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {student.lastName} {student.firstName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AttendanceCheckbox
                        isPresent={
                          attendanceByStudentId.get(student.id) ?? false
                        }
                        lessonId={lesson.id}
                        student={student}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <GradeInput
                        initialGrade={gradesByStudentId.get(student.id)}
                        lessonId={lesson.id}
                        student={student}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
