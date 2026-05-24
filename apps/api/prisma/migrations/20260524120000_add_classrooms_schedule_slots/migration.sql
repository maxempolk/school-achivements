-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "WeekType" AS ENUM ('ODD', 'EVEN', 'EVERY');

-- CreateTable
CREATE TABLE "Classroom" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "building" TEXT,
    "capacity" INTEGER,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "weekType" "WeekType" NOT NULL DEFAULT 'EVERY',

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "classroomId" INTEGER,
ADD COLUMN "scheduleSlotId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_number_building_key" ON "Classroom"("number", "building");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_classId_dayOfWeek_startTime_weekType_key" ON "ScheduleSlot"("classId", "dayOfWeek", "startTime", "weekType");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_teacherId_dayOfWeek_startTime_weekType_key" ON "ScheduleSlot"("teacherId", "dayOfWeek", "startTime", "weekType");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_classroomId_dayOfWeek_startTime_weekType_key" ON "ScheduleSlot"("classroomId", "dayOfWeek", "startTime", "weekType");

-- CreateIndex
CREATE INDEX "ScheduleSlot_classId_dayOfWeek_idx" ON "ScheduleSlot"("classId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleSlot_teacherId_dayOfWeek_idx" ON "ScheduleSlot"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleSlot_classroomId_dayOfWeek_idx" ON "ScheduleSlot"("classroomId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Lesson_classroomId_idx" ON "Lesson"("classroomId");

-- CreateIndex
CREATE INDEX "Lesson_scheduleSlotId_idx" ON "Lesson"("scheduleSlotId");

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
