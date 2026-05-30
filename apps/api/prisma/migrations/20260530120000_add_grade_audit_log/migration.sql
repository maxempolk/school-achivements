-- CreateEnum
CREATE TYPE "GradeAuditAction" AS ENUM ('CREATED', 'UPDATED');

-- CreateTable
CREATE TABLE "GradeAuditLog" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "action" "GradeAuditAction" NOT NULL,
    "oldValue" INTEGER,
    "newValue" INTEGER NOT NULL,
    "oldComment" TEXT,
    "newComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeAuditLog_gradeId_idx" ON "GradeAuditLog"("gradeId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_lessonId_idx" ON "GradeAuditLog"("lessonId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_studentId_idx" ON "GradeAuditLog"("studentId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_teacherId_idx" ON "GradeAuditLog"("teacherId");

-- CreateIndex
CREATE INDEX "GradeAuditLog_createdAt_idx" ON "GradeAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "GradeAuditLog" ADD CONSTRAINT "GradeAuditLog_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAuditLog" ADD CONSTRAINT "GradeAuditLog_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAuditLog" ADD CONSTRAINT "GradeAuditLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAuditLog" ADD CONSTRAINT "GradeAuditLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
