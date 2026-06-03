import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';

import { NotificationsService } from './notifications.service';
import { AuthenticatedUser } from '@/auth/types';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.findAll(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.notificationsService.markAllAsRead(user.id);
  }
}
