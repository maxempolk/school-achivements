'use client';

import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { innerApi } from '@/lib/api';

type Grade = {
  id: number;
  value: number;
  comment: string | null;
  lesson: {
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
    teacher: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
};

async function getMyGrades() {
  const response = await innerApi.get<Grade[]>(
    '/api/backend/students/me/grades',
  );
  return response.data;
}

export default function StudentGradesPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['student', 'grades'],
    queryFn: getMyGrades,
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Grades</h2>
        <p className="text-sm text-muted-foreground">
          Review your latest lesson grades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My grades</CardTitle>
          <CardDescription>{data.length} grade records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Topic</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 text-right font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      Loading grades...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={5}>
                      Failed to load grades.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && data.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      No grades found.
                    </td>
                  </tr>
                ) : null}
                {data.map((grade) => (
                  <tr key={grade.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(grade.lesson.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{grade.lesson.subject.name}</td>
                    <td className="px-4 py-3 font-medium">
                      {grade.lesson.topic}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {grade.lesson.teacher.lastName}{' '}
                      {grade.lesson.teacher.firstName}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold">
                      {grade.value}
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
