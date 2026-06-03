'use client';

import { useQuery } from '@tanstack/react-query';
import { GradesView, type Grade } from '@/components/grades/grades-view';
import { innerApi } from '@/lib/api';

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

      <GradesView data={data} isError={isError} isLoading={isLoading} />
    </section>
  );
}
