'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { innerApi } from '@/lib/api';

type Lesson = {
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
};

async function getLessons() {
  const response = await innerApi.get<Lesson[]>('/api/backend/lessons');
  return response.data;
}

export default function TeacherLessonsPage() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['teacher', 'lessons'],
    queryFn: getLessons,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Lessons</h2>
          <p className="text-sm text-muted-foreground">
            View lesson records started from your schedule.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your lessons</CardTitle>
          <CardDescription>{data.length} lesson entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="min-w-64 px-4 py-3 font-medium">Topic</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      Loading lessons...
                    </td>
                  </tr>
                ) : null}
                {isError ? (
                  <tr>
                    <td className="px-4 py-8 text-destructive" colSpan={5}>
                      Failed to load lessons.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && !isError && data.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      No lessons found.
                    </td>
                  </tr>
                ) : null}
                {data.map((lesson) => (
                  <tr key={lesson.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(lesson.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{lesson.class.name}</td>
                    <td className="px-4 py-3">{lesson.subject.name}</td>
                    <td className="px-4 py-3 font-medium">{lesson.topic}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/teacher/lessons/${lesson.id}`}>Open</Link>
                      </Button>
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
