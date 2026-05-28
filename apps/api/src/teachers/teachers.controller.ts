import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { UpdateTeacherAssignmentsDto } from './dto/update-teacher-assignments.dto';
import { TeachersService } from './teachers.service';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get(':id/assignments')
  @Roles(Role.ADMIN)
  findAssignments(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findAssignments(id);
  }

  @Put(':id/assignments')
  @Roles(Role.ADMIN)
  updateAssignments(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherAssignmentsDto,
  ) {
    return this.teachersService.updateAssignments(
      id,
      dto.classIds,
      dto.subjectIds,
    );
  }
}
