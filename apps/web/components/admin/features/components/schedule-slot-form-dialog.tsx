'use client';

import { useEffect, useMemo, useState } from 'react';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createScheduleSlotSchema,
  type CreateScheduleSlotInput,
} from '@school/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { innerApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

export const dayOfWeekOptions = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const weekTypeOptions = ['EVERY', 'ODD', 'EVEN'] as const;

type DayOfWeek = (typeof dayOfWeekOptions)[number];
type WeekType = (typeof weekTypeOptions)[number];

type ScheduleSlotOption = {
  id: number;
  name?: string;
  shortName?: string | null;
  firstName?: string;
  lastName?: string;
  number?: string;
  building?: string | null;
  classes?: Array<{
    classId: number;
  }>;
  subjects?: Array<{
    subjectId: number;
  }>;
};

export type ScheduleSlotOptions = {
  classes: ScheduleSlotOption[];
  subjects: ScheduleSlotOption[];
  teachers: ScheduleSlotOption[];
  classrooms: ScheduleSlotOption[];
};

type ScheduleSlot = {
  id: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  classroomId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  weekType: WeekType;
};

type ScheduleSlotFormDialogProps = {
  mode: 'create' | 'edit';
  options: ScheduleSlotOptions;
  queryKey: readonly unknown[];
  scheduleSlot?: ScheduleSlot;
};

export function formatSlotTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 5);
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function optionLabel(option: ScheduleSlotOption) {
  if (option.name) {
    return option.shortName
      ? `${option.name} (${option.shortName})`
      : option.name;
  }

  if (option.firstName || option.lastName) {
    return [option.firstName, option.lastName].filter(Boolean).join(' ');
  }

  if (option.number) {
    return option.building
      ? `${option.number}, ${option.building}`
      : option.number;
  }

  return `#${option.id}`;
}

export function ScheduleSlotFormDialog({
  mode,
  options,
  queryKey,
  scheduleSlot,
}: ScheduleSlotFormDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';
  const defaultValues = useMemo<CreateScheduleSlotInput>(
    () => ({
      classId: scheduleSlot?.classId ?? options.classes[0]?.id ?? 0,
      subjectId: scheduleSlot?.subjectId ?? options.subjects[0]?.id ?? 0,
      teacherId: scheduleSlot?.teacherId ?? options.teachers[0]?.id ?? 0,
      classroomId: scheduleSlot?.classroomId ?? options.classrooms[0]?.id ?? 0,
      dayOfWeek: scheduleSlot?.dayOfWeek ?? 'MONDAY',
      startTime: scheduleSlot
        ? formatSlotTime(scheduleSlot.startTime)
        : '08:00',
      endTime: scheduleSlot ? formatSlotTime(scheduleSlot.endTime) : '08:45',
      weekType: scheduleSlot?.weekType ?? 'EVERY',
    }),
    [options, scheduleSlot],
  );

  const form = useForm<CreateScheduleSlotInput>({
    resolver: standardSchemaResolver(createScheduleSlotSchema),
    defaultValues,
  });
  const classId = useWatch({ control: form.control, name: 'classId' });
  const subjectId = useWatch({ control: form.control, name: 'subjectId' });
  const teacherId = useWatch({ control: form.control, name: 'teacherId' });
  const classroomId = useWatch({ control: form.control, name: 'classroomId' });
  const dayOfWeek = useWatch({ control: form.control, name: 'dayOfWeek' });
  const weekType = useWatch({ control: form.control, name: 'weekType' });

  const selectedTeacher = options.teachers.find(
    (teacher) => teacher.id === teacherId,
  );
  const assignedClassIds = useMemo(
    () => selectedTeacher?.classes?.map(({ classId }) => classId) ?? [],
    [selectedTeacher?.classes],
  );
  const assignedSubjectIds = useMemo(
    () => selectedTeacher?.subjects?.map(({ subjectId }) => subjectId) ?? [],
    [selectedTeacher?.subjects],
  );
  const classOptions = useMemo(
    () =>
      options.classes.filter((classOption) =>
        assignedClassIds.includes(classOption.id),
      ),
    [assignedClassIds, options.classes],
  );
  const subjectOptions = useMemo(
    () =>
      options.subjects.filter((subjectOption) =>
        assignedSubjectIds.includes(subjectOption.id),
      ),
    [assignedSubjectIds, options.subjects],
  );
  const teacherHasAssignments =
    classOptions.length > 0 && subjectOptions.length > 0;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  useEffect(() => {
    if (!open || !teacherId) {
      return;
    }

    const nextClassId = classOptions[0]?.id;
    const nextSubjectId = subjectOptions[0]?.id;

    if (nextClassId && !classOptions.some((option) => option.id === classId)) {
      form.setValue('classId', nextClassId, { shouldValidate: true });
    }

    if (
      nextSubjectId &&
      !subjectOptions.some((option) => option.id === subjectId)
    ) {
      form.setValue('subjectId', nextSubjectId, { shouldValidate: true });
    }
  }, [classId, classOptions, form, open, subjectId, subjectOptions, teacherId]);

  const mutation = useMutation({
    mutationFn: async (values: CreateScheduleSlotInput) => {
      if (isEdit && scheduleSlot) {
        await innerApi.patch(
          `/api/backend/schedule-slots/${scheduleSlot.id}`,
          values,
        );
        return;
      }

      await innerApi.post('/api/backend/schedule-slots', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(isEdit ? 'Schedule slot updated' : 'Schedule slot created');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error) ??
          (isEdit
            ? 'Failed to update schedule slot'
            : 'Failed to create schedule slot'),
      );
    },
  });

  const hasOptions =
    options.classes.length > 0 &&
    options.subjects.length > 0 &&
    options.teachers.length > 0 &&
    options.classrooms.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid={
            isEdit ? 'edit-schedule-slot-button' : 'create-schedule-slot-button'
          }
          disabled={!hasOptions}
          size="sm"
          variant={isEdit ? 'ghost' : 'default'}
        >
          {isEdit ? 'Edit' : 'Add'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit schedule slot' : 'Add schedule slot'}
          </DialogTitle>
          <DialogDescription>
            Configure a weekly timetable cell.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              error={form.formState.errors.classId?.message}
              helperText={
                teacherId && classOptions.length === 0
                  ? 'Selected teacher has no assigned classes.'
                  : undefined
              }
              label="Class"
              value={String(classId || '')}
              options={classOptions}
              onValueChange={(value) =>
                form.setValue('classId', Number(value), {
                  shouldValidate: true,
                })
              }
            />
            <SelectField
              error={form.formState.errors.subjectId?.message}
              helperText={
                teacherId && subjectOptions.length === 0
                  ? 'Selected teacher has no assigned subjects.'
                  : undefined
              }
              label="Subject"
              value={String(subjectId || '')}
              options={subjectOptions}
              onValueChange={(value) =>
                form.setValue('subjectId', Number(value), {
                  shouldValidate: true,
                })
              }
            />
            <SelectField
              error={form.formState.errors.teacherId?.message}
              label="Teacher"
              value={String(teacherId || '')}
              options={options.teachers}
              onValueChange={(value) =>
                form.setValue('teacherId', Number(value), {
                  shouldValidate: true,
                })
              }
            />
            <SelectField
              error={form.formState.errors.classroomId?.message}
              label="Classroom"
              value={String(classroomId || '')}
              options={options.classrooms}
              onValueChange={(value) =>
                form.setValue('classroomId', Number(value), {
                  shouldValidate: true,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <EnumSelectField
              label="Day"
              value={dayOfWeek}
              options={dayOfWeekOptions}
              onValueChange={(value) =>
                form.setValue('dayOfWeek', value as DayOfWeek, {
                  shouldValidate: true,
                })
              }
            />
            <EnumSelectField
              label="Week"
              value={weekType}
              options={weekTypeOptions}
              onValueChange={(value) =>
                form.setValue('weekType', value as WeekType, {
                  shouldValidate: true,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`slot-start-${scheduleSlot?.id ?? 'new'}`}>
                Start time
              </Label>
              <Input
                id={`slot-start-${scheduleSlot?.id ?? 'new'}`}
                aria-invalid={Boolean(form.formState.errors.startTime)}
                data-testid="schedule-slot-start-input"
                type="time"
                {...form.register('startTime')}
              />
              {form.formState.errors.startTime ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`slot-end-${scheduleSlot?.id ?? 'new'}`}>
                End time
              </Label>
              <Input
                id={`slot-end-${scheduleSlot?.id ?? 'new'}`}
                aria-invalid={Boolean(form.formState.errors.endTime)}
                data-testid="schedule-slot-end-input"
                type="time"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endTime.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="save-schedule-slot-button"
              disabled={mutation.isPending || !teacherHasAssignments}
              type="submit"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SelectFieldProps = {
  error?: string;
  helperText?: string;
  label: string;
  value: string;
  options: ScheduleSlotOption[];
  onValueChange: (value: string) => void;
};

function SelectField({
  error,
  helperText,
  label,
  value,
  options,
  onValueChange,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-invalid={Boolean(error)} className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {optionLabel(option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!error && helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

type EnumSelectFieldProps = {
  label: string;
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
};

function EnumSelectField({
  label,
  value,
  options,
  onValueChange,
}: EnumSelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
