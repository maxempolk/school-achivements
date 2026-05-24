import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { LessonsModule } from './lessons/lessons.module';
import { GradesModule } from './grades/grades.module';
import { StudentsModule } from './students/students.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { ScheduleSlotsModule } from './schedule-slots/schedule-slots.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ClassesModule,
    SubjectsModule,
    LessonsModule,
    GradesModule,
    StudentsModule,
    ClassroomsModule,
    ScheduleSlotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
