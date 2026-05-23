import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import { GradesService } from '@/grades/grades.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradesService: GradesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  findAll(@Query('classId') classId?: string) {
    const where =
      classId === undefined
        ? undefined
        : {
            classId: Number(classId),
          };

    return this.prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classId: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  @Get('me/grades')
  @Roles(Role.STUDENT)
  async findMyGrades(@Req() req: AuthenticatedRequest) {
    const student = await this.prisma.student.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.gradesService.findByStudentId(student.id);
  }

  @Get(':id/grades')
  @Roles(Role.ADMIN, Role.STUDENT)
  async findGrades(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (req.user.role === Role.STUDENT && student.userId !== req.user.id) {
      throw new ForbiddenException('You can view only your own grades');
    }

    return this.gradesService.findByStudentId(id);
  }
}
