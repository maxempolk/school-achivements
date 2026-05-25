'use client';

import { useQuery } from '@tanstack/react-query';

import { innerApi } from '@/lib/api';

export type ParentChild = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number;
  class: {
    id: number;
    name: string;
  };
};

async function getParentChildren() {
  const response = await innerApi.get<ParentChild[]>(
    '/api/backend/parents/me/children',
  );

  return response.data;
}

export function useParentChildren() {
  return useQuery({
    queryKey: ['parent', 'children'],
    queryFn: getParentChildren,
  });
}

export function selectParentChild(
  children: ParentChild[],
  childIdParam: string | null,
) {
  const childId = childIdParam ? Number(childIdParam) : undefined;

  if (childId) {
    const selectedChild = children.find((child) => child.id === childId);

    if (selectedChild) {
      return selectedChild;
    }
  }

  return children[0] ?? null;
}
