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
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.TEACHER)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(req.user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('date') date?: string,
  ) {
    return this.lessonsService.findAll(req.user, {
      teacherId,
      classId,
      date,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.lessonsService.findOne(req.user, id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(req.user.id, id, dto);
  }
}
