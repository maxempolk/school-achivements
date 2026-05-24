import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.classroom.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    return classroom;
  }

  create(dto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: dto,
    });
  }

  async update(id: number, dto: UpdateClassroomDto) {
    await this.findOne(id);

    return this.prisma.classroom.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.classroom.delete({
      where: { id },
    });
  }
}
