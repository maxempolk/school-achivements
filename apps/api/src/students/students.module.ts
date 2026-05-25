import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GradesModule } from '@/grades/grades.module';
import { AttendanceModule } from '@/attendance/attendance.module';

import { StudentsController } from './students.controller';

@Module({
  imports: [PrismaModule, GradesModule, AttendanceModule],
  controllers: [StudentsController],
})
export class StudentsModule {}
