import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';

import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
