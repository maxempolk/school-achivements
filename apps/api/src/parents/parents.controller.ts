import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { UpdateParentStudentsDto } from './dto/update-parent-students.dto';
import { ParentsService } from './parents.service';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('me/children')
  @Roles(Role.PARENT)
  findMyChildren(@Req() req: AuthenticatedRequest) {
    return this.parentsService.findChildrenByUserId(req.user.id);
  }

  @Get('me/children/:studentId/grades')
  @Roles(Role.PARENT)
  findChildGrades(
    @Req() req: AuthenticatedRequest,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentsService.findChildGrades(req.user.id, studentId);
  }

  @Get('me/children/:studentId/attendance')
  @Roles(Role.PARENT)
  findChildAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentsService.findChildAttendance(req.user.id, studentId);
  }

  @Get('me/children/:studentId/schedule')
  @Roles(Role.PARENT)
  findChildSchedule(
    @Req() req: AuthenticatedRequest,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentsService.findChildSchedule(req.user.id, studentId);
  }

  @Put(':id/students')
  @Roles(Role.ADMIN)
  updateStudents(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParentStudentsDto,
  ) {
    return this.parentsService.updateStudents(id, dto.studentIds);
  }
}
