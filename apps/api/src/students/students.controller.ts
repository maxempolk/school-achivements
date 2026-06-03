import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  type AuthenticatedRequest,
  RolesGuard,
} from '@/auth/guards/roles.guard';
import { AttendanceService } from '@/attendance/attendance.service';
import { GradesService } from '@/grades/grades.service';
import { PrismaService } from '@/prisma/prisma.service';
import { GetStudentsQueryDto } from './dto/get-students-query.dto';
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

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
    private readonly gradesService: GradesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetStudentsQueryDto,
  ) {
    const parsedClassId = query.classId;
    const assignedClassIds =
      req.user.role === Role.TEACHER
        ? await this.findTeacherClassIds(req.user.id)
        : undefined;
    const where =
      parsedClassId === undefined && assignedClassIds === undefined
        ? undefined
        : {
            classId:
              parsedClassId === undefined
                ? {
                    in: assignedClassIds,
                  }
                : parsedClassId,
          };

    if (
      req.user.role === Role.TEACHER &&
      parsedClassId !== undefined &&
      !assignedClassIds?.includes(parsedClassId)
    ) {
      return [];
    }

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

  @Get('me/attendance')
  @Roles(Role.STUDENT)
  async findMyAttendance(@Req() req: AuthenticatedRequest) {
    const student = await this.prisma.student.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.attendanceService.findByStudentId(student.id);
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

  // TODO: почему эта функция тут? разве она не должна быть в TEACHER
  private async findTeacherClassIds(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: {
        classes: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher.classes.map(({ classId }) => classId);
  }
}
