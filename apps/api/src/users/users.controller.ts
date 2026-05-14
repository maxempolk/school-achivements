import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return req.user;
  }

  @Get('checkAdmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  checkAdmin(@Req() req: Request) {
    return req.user;
  }
}
