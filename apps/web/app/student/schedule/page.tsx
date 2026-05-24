import { MyScheduleTable } from '@/components/schedule/my-schedule-table';

export default function StudentSchedulePage() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My schedule</h2>
        <p className="text-sm text-muted-foreground">
          Review the timetable slots assigned to your class.
        </p>
      </div>

      <MyScheduleTable audience="student" />
    </section>
  );
}
