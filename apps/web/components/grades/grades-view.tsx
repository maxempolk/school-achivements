import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { BookOpen, Calculator, ListChecks, Sigma } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { StatCard } from '@/components/ui/stat-card';

export type Grade = {
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

export type GradesViewProps = {
  data: Grade[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
};

function getStartOfDayTime(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function getEndOfDayTime(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
}

function formatAverage(value: number | null) {
  return value === null ? '—' : value.toFixed(1);
}

function getAverage(grades: Grade[]) {
  if (grades.length === 0) {
    return null;
  }

  const total = grades.reduce((sum, grade) => sum + grade.value, 0);

  return total / grades.length;
}

export function GradesView({
  data = [],
  isLoading,
  isError,
  emptyMessage = 'No grades found.',
}: GradesViewProps) {
  const [subjectId, setSubjectId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const subjects = useMemo(() => {
    const subjectsById = new Map<number, Grade['lesson']['subject']>();

    for (const grade of data) {
      subjectsById.set(grade.lesson.subject.id, grade.lesson.subject);
    }

    return Array.from(subjectsById.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data]);

  const periodGrades = useMemo(() => {
    const fromTime = dateFrom ? getStartOfDayTime(dateFrom) : undefined;
    const toTime = dateTo ? getEndOfDayTime(dateTo) : undefined;

    return data.filter((grade) => {
      const lessonTime = new Date(grade.lesson.date).getTime();

      if (fromTime !== undefined && lessonTime < fromTime) {
        return false;
      }

      if (toTime !== undefined && lessonTime > toTime) {
        return false;
      }

      return true;
    });
  }, [data, dateFrom, dateTo]);

  const filteredGrades = useMemo(() => {
    return periodGrades.filter((grade) => {
      return (
        subjectId === 'all' || grade.lesson.subject.id === Number(subjectId)
      );
    });
  }, [periodGrades, subjectId]);

  const subjectAverage =
    subjectId === 'all' ? null : getAverage(filteredGrades);
  const overallAverage = getAverage(periodGrades);

  const hasActiveFilters = subjectId !== 'all' || dateFrom || dateTo;

  function resetFilters() {
    setSubjectId('all');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Grade records"
          value={String(filteredGrades.length)}
        />
        <StatCard
          icon={Sigma}
          label="Overall average"
          value={formatAverage(overallAverage)}
        />
        <StatCard
          icon={Calculator}
          label="Subject average"
          value={formatAverage(subjectAverage)}
        />
        <StatCard
          icon={BookOpen}
          label="Subjects"
          value={String(subjects.length)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grades list</CardTitle>
          <CardDescription>
            {filteredGrades.length} grade records
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="grid gap-3 px-4 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_minmax(9rem,12rem)_auto] sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade-subject-filter">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger
                  id="grade-subject-filter"
                  className="w-full"
                  data-testid="grade-subject-filter"
                >
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade-date-from">From</Label>
              <Input
                id="grade-date-from"
                data-testid="grade-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade-date-to">To</Label>
              <Input
                id="grade-date-to"
                data-testid="grade-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
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
                  <TableSkeletonRows
                    columns={5}
                    cellClassNames={[
                      'h-5 w-20',
                      'h-5 w-28',
                      'h-5 w-48',
                      'h-5 w-32',
                      'ml-auto h-5 w-10',
                    ]}
                  />
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
                      {emptyMessage}
                    </td>
                  </tr>
                ) : null}
                {!isLoading &&
                !isError &&
                data.length > 0 &&
                filteredGrades.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                      No grades match the selected filters.
                    </td>
                  </tr>
                ) : null}
                {!isLoading &&
                  !isError &&
                  filteredGrades.map((grade) => (
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
    </div>
  );
}
