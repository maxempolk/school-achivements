'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { innerApi } from '@/lib/api';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

type CurrentUser = {
  id: number;
  email: string;
  role: Role;
};

type SchoolClass = {
  id: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
  shortName: string | null;
};

type SubjectStat = {
  subject: Subject;
  averageGrade: number | null;
  gradeCount: number;
};

type StudentPerformance = {
  student: {
    id: number;
    firstName: string;
    lastName: string;
  };
  averageGrade: number | null;
  gradeCount: number;
  absenceCount: number;
  attendanceCount: number;
  attendanceRate: number | null;
  subjectStats: SubjectStat[];
};

type PerformanceReport = {
  filters: {
    class: SchoolClass;
    subject: Subject | null;
  };
  classStats: {
    studentCount: number;
    averageGrade: number | null;
    gradeCount: number;
    absenceCount: number;
    attendanceCount: number;
    attendanceRate: number | null;
  };
  subjectStats: SubjectStat[];
  students: StudentPerformance[];
};

const allSubjectsValue = 'all';
const emptyClasses: SchoolClass[] = [];
const emptySubjects: Subject[] = [];

async function getMe() {
  const response = await innerApi.get<CurrentUser>('/api/backend/users/me');

  return response.data;
}

async function getClasses() {
  const response = await innerApi.get<SchoolClass[]>('/api/backend/classes');

  return response.data;
}

async function getSubjects() {
  const response = await innerApi.get<Subject[]>('/api/backend/subjects');

  return response.data;
}

async function getPerformance({
  classId,
  subjectId,
}: {
  classId: string;
  subjectId: string;
}) {
  const params = new URLSearchParams({ classId });

  if (subjectId !== allSubjectsValue) {
    params.set('subjectId', subjectId);
  }

  const response = await innerApi.get<PerformanceReport>(
    `/api/backend/performance?${params.toString()}`,
  );

  return response.data;
}

function formatNumber(value: number | null) {
  return value === null ? '-' : value.toString();
}

function formatPercent(value: number | null) {
  return value === null ? '-' : `${value}%`;
}

function formatSubjectLabel(subject: Subject) {
  return subject.shortName
    ? `${subject.name} (${subject.shortName})`
    : subject.name;
}

export function PerformanceView() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(allSubjectsValue);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });
  const canViewPerformance =
    meQuery.data?.role === 'ADMIN' || meQuery.data?.role === 'TEACHER';

  const classesQuery = useQuery({
    queryKey: ['performance', 'classes'],
    queryFn: getClasses,
    enabled: canViewPerformance,
  });
  const subjectsQuery = useQuery({
    queryKey: ['performance', 'subjects'],
    queryFn: getSubjects,
    enabled: canViewPerformance,
  });
  const classes = classesQuery.data ?? emptyClasses;
  const subjects = subjectsQuery.data ?? emptySubjects;
  const effectiveClassId = selectedClassId || classes[0]?.id.toString() || '';
  const performanceQuery = useQuery({
    queryKey: ['performance', effectiveClassId, selectedSubjectId],
    queryFn: () =>
      getPerformance({
        classId: effectiveClassId,
        subjectId: selectedSubjectId,
      }),
    enabled: canViewPerformance && effectiveClassId.length > 0,
  });
  const report = performanceQuery.data;

  const selectedClass = useMemo(
    () =>
      classes.find((classItem) => classItem.id.toString() === effectiveClassId),
    [classes, effectiveClassId],
  );

  if (meQuery.isLoading) {
    return (
      <main className="min-h-screen bg-muted/30 p-4 sm:p-6">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full max-w-xl" />
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (!canViewPerformance) {
    return (
      <main className="min-h-screen bg-muted/30 p-4 sm:p-6">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dashboard</CardTitle>
              <CardDescription>
                This report is available for admins and teachers.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-6">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Performance dashboard
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Review class achievement, subject averages, grades, and absences.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Select a class and optionally narrow the report to one subject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="performance-class">Class</Label>
                <Select
                  value={effectiveClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger
                    id="performance-class"
                    className="w-full justify-between"
                  >
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
                <Label htmlFor="performance-subject">Subject</Label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                >
                  <SelectTrigger
                    id="performance-subject"
                    className="w-full justify-between"
                  >
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={allSubjectsValue}>
                      All subjects
                    </SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.id}
                        value={subject.id.toString()}
                      >
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
              No classes available for this account.
            </CardContent>
          </Card>
        ) : null}

        {performanceQuery.isError ? (
          <Card>
            <CardContent className="px-4 py-8 text-sm text-destructive">
              Failed to load performance report.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Class"
            value={report?.filters.class.name ?? selectedClass?.name ?? '-'}
          />
          <MetricCard
            label="Average grade"
            value={formatNumber(report?.classStats.averageGrade ?? null)}
          />
          <MetricCard
            label="Grades"
            value={(report?.classStats.gradeCount ?? 0).toString()}
          />
          <MetricCard
            label="Absences"
            value={(report?.classStats.absenceCount ?? 0).toString()}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Subject averages</CardTitle>
              <CardDescription>
                {report?.subjectStats.length ?? 0} subject
                {(report?.subjectStats.length ?? 0) === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 text-right font-medium">Avg</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Grades
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceQuery.isLoading ? (
                      <TableSkeletonRows
                        columns={3}
                        rows={4}
                        cellClassNames={[
                          'h-5 w-32',
                          'ml-auto h-5 w-10',
                          'ml-auto h-5 w-12',
                        ]}
                      />
                    ) : null}
                    {!performanceQuery.isLoading &&
                    report?.subjectStats.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-8 text-muted-foreground"
                          colSpan={3}
                        >
                          No grades found.
                        </td>
                      </tr>
                    ) : null}
                    {report?.subjectStats.map((item) => (
                      <tr
                        key={item.subject.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {formatSubjectLabel(item.subject)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatNumber(item.averageGrade)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.gradeCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {report?.classStats.studentCount ?? 0} student
                {(report?.classStats.studentCount ?? 0) === 1 ? '' : 's'},
                attendance{' '}
                {formatPercent(report?.classStats.attendanceRate ?? null)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="min-w-52 px-4 py-3 font-medium">
                        Student
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Avg</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Grades
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Absences
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceQuery.isLoading ? (
                      <TableSkeletonRows
                        columns={5}
                        rows={6}
                        cellClassNames={[
                          'h-5 w-40',
                          'ml-auto h-5 w-10',
                          'ml-auto h-5 w-12',
                          'ml-auto h-5 w-12',
                          'ml-auto h-5 w-14',
                        ]}
                      />
                    ) : null}
                    {!performanceQuery.isLoading &&
                    report?.students.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-8 text-muted-foreground"
                          colSpan={5}
                        >
                          No students found.
                        </td>
                      </tr>
                    ) : null}
                    {report?.students.map((item) => (
                      <tr
                        key={item.student.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {item.student.lastName} {item.student.firstName}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatNumber(item.averageGrade)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.gradeCount}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {item.absenceCount}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatPercent(item.attendanceRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
