'use client';

import { useMemo, useState } from 'react';
import {
  createGradeSchema,
  type CreateGradeInput,
  type UpsertAttendanceInput,
} from '@school/shared-types';
import { BookOpenCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

type SchoolClass = {
  id: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
};

type JournalLesson = {
  id: number;
  date: string;
  topic: string;
  homework: string | null;
  class: SchoolClass;
  subject: Subject;
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

const emptyClasses: SchoolClass[] = [];
const emptySubjects: Subject[] = [];
const emptyStudents: Student[] = [];
const emptyLessons: JournalLesson[] = [];

async function getClasses() {
  const response = await innerApi.get<SchoolClass[]>('/api/backend/classes');

  return response.data;
}

async function getSubjects() {
  const response = await innerApi.get<Subject[]>('/api/backend/subjects');

  return response.data;
}

async function getStudents(classId: string) {
  const response = await innerApi.get<Student[]>('/api/backend/students', {
    params: {
      classId,
    },
  });

  return response.data;
}

async function getJournalLessons({
  classId,
  subjectId,
}: {
  classId: string;
  subjectId: string;
}) {
  const response = await innerApi.get<JournalLesson[]>(
    '/api/backend/lessons/journal',
    {
      params: {
        classId,
        subjectId,
      },
    },
  );

  return response.data;
}

function formatSubjectLabel(subject: Subject) {
  return subject.shortName
    ? `${subject.name} (${subject.shortName})`
    : subject.name;
}

function formatLessonDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date));
}

function GradeCell({
  grade,
  lessonId,
  queryKey,
  studentId,
}: {
  grade?: JournalLesson['grades'][number];
  lessonId: number;
  queryKey: readonly unknown[];
  studentId: number;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: CreateGradeInput) => {
      await innerApi.post('/api/backend/grades', payload);
    },
  });
  const initialValue = grade?.value.toString() ?? '';

  async function handleBlur(value: string) {
    const nextValue = value.trim();

    if (nextValue === initialValue) {
      return;
    }

    const payload = {
      lessonId,
      studentId,
      value: Number(nextValue),
    };
    const parsed = createGradeSchema.safeParse(payload);

    if (!parsed.success) {
      toast.error('Grade must be a number from 1 to 12');
      return;
    }

    const toastId = toast.loading('Зберігається...');

    try {
      await mutation.mutateAsync(parsed.data);
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Збережено', { id: toastId });
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? 'Failed to save grade', {
        id: toastId,
      });
    }
  }

  return (
    <Input
      aria-label="Grade"
      className="h-8 w-16 text-center"
      defaultValue={initialValue}
      disabled={mutation.isPending}
      inputMode="numeric"
      max={12}
      min={1}
      type="number"
      onBlur={(event) => handleBlur(event.currentTarget.value)}
    />
  );
}

function AttendanceCell({
  attendance,
  lessonId,
  queryKey,
  studentId,
}: {
  attendance?: JournalLesson['attendances'][number];
  lessonId: number;
  queryKey: readonly unknown[];
  studentId: number;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: UpsertAttendanceInput) => {
      await innerApi.post('/api/backend/attendance', payload);
    },
  });
  const isChecked = mutation.isPending
    ? (mutation.variables?.isPresent ?? attendance?.isPresent ?? false)
    : (attendance?.isPresent ?? false);

  async function handleChange(isPresent: boolean) {
    const toastId = toast.loading('Зберігається...');

    try {
      await mutation.mutateAsync({
        lessonId,
        studentId,
        isPresent,
      });
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Збережено', { id: toastId });
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? 'Failed to save attendance', {
        id: toastId,
      });
    }
  }

  return (
    <input
      aria-label="Present"
      checked={isChecked}
      className="size-4 rounded border-input accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={mutation.isPending}
      title="Present"
      type="checkbox"
      onChange={(event) => handleChange(event.currentTarget.checked)}
    />
  );
}

export default function TeacherJournalPage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const classesQuery = useQuery({
    queryKey: ['teacher', 'journal', 'classes'],
    queryFn: getClasses,
  });
  const subjectsQuery = useQuery({
    queryKey: ['teacher', 'journal', 'subjects'],
    queryFn: getSubjects,
  });

  const classes = classesQuery.data ?? emptyClasses;
  const subjects = subjectsQuery.data ?? emptySubjects;
  const effectiveClassId = selectedClassId || classes[0]?.id.toString() || '';
  const effectiveSubjectId =
    selectedSubjectId || subjects[0]?.id.toString() || '';
  const journalQueryKey = [
    'teacher',
    'journal',
    'lessons',
    effectiveClassId,
    effectiveSubjectId,
  ] as const;

  const studentsQuery = useQuery({
    queryKey: ['teacher', 'journal', 'students', effectiveClassId],
    queryFn: () => getStudents(effectiveClassId),
    enabled: effectiveClassId.length > 0,
  });
  const journalQuery = useQuery({
    queryKey: journalQueryKey,
    queryFn: () =>
      getJournalLessons({
        classId: effectiveClassId,
        subjectId: effectiveSubjectId,
      }),
    enabled: effectiveClassId.length > 0 && effectiveSubjectId.length > 0,
  });

  const students = studentsQuery.data ?? emptyStudents;
  const lessons = journalQuery.data ?? emptyLessons;
  const selectedClass = classes.find(
    (classItem) => classItem.id.toString() === effectiveClassId,
  );
  const selectedSubject = subjects.find(
    (subject) => subject.id.toString() === effectiveSubjectId,
  );

  const lessonMaps = useMemo(() => {
    return lessons.map((lesson) => ({
      lesson,
      gradesByStudentId: new Map(
        lesson.grades.map((grade) => [grade.studentId, grade]),
      ),
      attendanceByStudentId: new Map(
        lesson.attendances.map((attendance) => [
          attendance.studentId,
          attendance,
        ]),
      ),
    }));
  }, [lessons]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-6 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">
              Class journal
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Edit lesson grades and attendance across the class.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select a class and subject to open the electronic journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="journal-class">Class</Label>
              <Select
                value={effectiveClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="journal-class" className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem
                      key={classItem.id}
                      value={classItem.id.toString()}
                    >
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="journal-subject">Subject</Label>
              <Select
                value={effectiveSubjectId}
                onValueChange={setSelectedSubjectId}
              >
                <SelectTrigger id="journal-subject" className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {formatSubjectLabel(subject)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {classesQuery.isError || subjectsQuery.isError ? (
        <Card>
          <CardContent className="px-4 py-8 text-sm text-destructive">
            Failed to load filters.
          </CardContent>
        </Card>
      ) : null}

      {!classesQuery.isLoading && classes.length === 0 ? (
        <Card>
          <CardContent className="px-4 py-8 text-sm text-muted-foreground">
            No assigned classes found.
          </CardContent>
        </Card>
      ) : null}

      {!subjectsQuery.isLoading && subjects.length === 0 ? (
        <Card>
          <CardContent className="px-4 py-8 text-sm text-muted-foreground">
            No assigned subjects found.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedClass?.name ?? 'Class'} ·{' '}
            {selectedSubject ? formatSubjectLabel(selectedSubject) : 'Subject'}
          </CardTitle>
          <CardDescription>
            {lessons.length} lesson{lessons.length === 1 ? '' : 's'} by date.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 min-w-52 bg-muted/50 px-4 py-3 font-medium">
                    Student
                  </th>
                  {lessonMaps.map(({ lesson }) => (
                    <th
                      key={lesson.id}
                      className="min-w-28 px-3 py-3 align-top font-medium"
                    >
                      <div className="flex flex-col gap-1">
                        <span>{formatLessonDate(lesson.date)}</span>
                        <span className="normal-case text-foreground">
                          {lesson.topic}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentsQuery.isLoading || journalQuery.isLoading ? (
                  <TableSkeletonRows
                    columns={Math.max(lessonMaps.length + 1, 3)}
                    rows={5}
                  />
                ) : null}
                {studentsQuery.isError || journalQuery.isError ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-destructive"
                      colSpan={Math.max(lessonMaps.length + 1, 1)}
                    >
                      Failed to load journal.
                    </td>
                  </tr>
                ) : null}
                {!studentsQuery.isLoading &&
                !journalQuery.isLoading &&
                students.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-muted-foreground"
                      colSpan={Math.max(lessonMaps.length + 1, 1)}
                    >
                      No students found.
                    </td>
                  </tr>
                ) : null}
                {!journalQuery.isLoading &&
                !journalQuery.isError &&
                students.length > 0 &&
                lessonMaps.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={1}>
                      No lessons found for this class and subject.
                    </td>
                  </tr>
                ) : null}
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-b-0">
                    <td className="sticky left-0 z-10 bg-background px-4 py-3 align-top font-medium">
                      {student.lastName} {student.firstName}
                    </td>
                    {lessonMaps.map(
                      ({
                        attendanceByStudentId,
                        gradesByStudentId,
                        lesson,
                      }) => (
                        <td key={lesson.id} className="px-3 py-2 align-middle">
                          <div className="flex min-w-24 items-center gap-2">
                            <GradeCell
                              grade={gradesByStudentId.get(student.id)}
                              lessonId={lesson.id}
                              queryKey={journalQueryKey}
                              studentId={student.id}
                            />
                            <AttendanceCell
                              attendance={attendanceByStudentId.get(student.id)}
                              lessonId={lesson.id}
                              queryKey={journalQueryKey}
                              studentId={student.id}
                            />
                          </div>
                        </td>
                      ),
                    )}
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
