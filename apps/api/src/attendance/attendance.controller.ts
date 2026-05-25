import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertAttendanceDto) {
    return this.attendanceService.upsert(req.user.id, dto);
  }
}
