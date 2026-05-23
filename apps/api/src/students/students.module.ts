import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { GradesModule } from '@/grades/grades.module';

import { StudentsController } from './students.controller';

@Module({
  imports: [PrismaModule, GradesModule],
  controllers: [StudentsController],
})
export class StudentsModule {}
