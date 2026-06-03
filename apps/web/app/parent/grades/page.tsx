'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { GradesView, type Grade } from '@/components/grades/grades-view';
import {
  selectParentChild,
  useParentChildren,
} from '@/components/parent/use-parent-children';
import { innerApi } from '@/lib/api';

async function getChildGrades(childId: number) {
  const response = await innerApi.get<Grade[]>(
    `/api/backend/parents/me/children/${childId}/grades`,
  );

  return response.data;
}

export default function ParentGradesPage() {
  const searchParams = useSearchParams();
  const childrenQuery = useParentChildren();
  const selectedChild = selectParentChild(
    childrenQuery.data ?? [],
    searchParams.get('childId'),
  );
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['parent', 'grades', selectedChild?.id],
    queryFn: () => getChildGrades(selectedChild!.id),
    enabled: Boolean(selectedChild),
  });

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Grades</h2>
        <p className="text-sm text-muted-foreground">
          Review grades for the selected child.
        </p>
      </div>

      <GradesView
        data={data}
        isError={childrenQuery.isError || isError}
        isLoading={childrenQuery.isLoading || isLoading}
        emptyMessage={
          selectedChild ? 'No grades found.' : 'Select a linked child first.'
        }
      />
    </section>
  );
}
