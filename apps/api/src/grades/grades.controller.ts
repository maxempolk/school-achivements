import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { CreateGradeDto } from './dto/create-grade.dto';
import { GradesService } from './grades.service';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGradeDto) {
    return this.gradesService.create(req.user.id, dto);
  }
}
