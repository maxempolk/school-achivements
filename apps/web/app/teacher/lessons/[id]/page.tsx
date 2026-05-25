'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createGradeSchema,
  updateLessonSchema,
  type CreateGradeInput,
  type UpdateLessonInput,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
};

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
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

function GradeInput({
  lessonId,
  student,
  initialValue,
}: {
  lessonId: number;
  student: Student;
  initialValue?: number;
}) {
  const [value, setValue] = useState(initialValue?.toString() ?? '');
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
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
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
    const map = new Map<number, number>();

    for (const grade of lessonQuery.data?.grades ?? []) {
      map.set(grade.studentId, grade.value);
    }

    return map;
  }, [lessonQuery.data?.grades]);

  if (lessonQuery.isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading lesson...</div>
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
          <CardDescription>Set grades for this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 text-right font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentsQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={2}>
                      Loading students...
                    </td>
                  </tr>
                ) : null}
                {studentsQuery.isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={2}>
                      Failed to load students.
                    </td>
                  </tr>
                ) : null}
                {!studentsQuery.isLoading &&
                !studentsQuery.isError &&
                students.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={2}>
                      No students found.
                    </td>
                  </tr>
                ) : null}
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {student.lastName} {student.firstName}
                    </td>
                    <td className="px-4 py-3">
                      <GradeInput
                        initialValue={gradesByStudentId.get(student.id)}
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
