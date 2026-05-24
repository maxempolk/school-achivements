import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleSlotsService } from './schedule-slots.service';

@Controller('schedule-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScheduleSlotsController {
  constructor(private readonly scheduleSlotsService: ScheduleSlotsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  findAll() {
    return this.scheduleSlotsService.findAll();
  }

  @Get('options')
  @Roles(Role.ADMIN)
  getOptions() {
    return this.scheduleSlotsService.getOptions();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleSlotsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateScheduleSlotDto) {
    return this.scheduleSlotsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleSlotDto,
  ) {
    return this.scheduleSlotsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.scheduleSlotsService.remove(id);
  }
}
