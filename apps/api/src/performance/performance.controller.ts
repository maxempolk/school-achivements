import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PerformanceService } from './performance.service';
import { GetPerformanceQueryDto } from './dto/get-performance-query.dto';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  getPerformance(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetPerformanceQueryDto,
  ) {
    return this.performanceService.getPerformance(req.user, query);
  }
}
