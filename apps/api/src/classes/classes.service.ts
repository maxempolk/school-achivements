import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.class.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }

  create(dto: CreateClassDto) {
    return this.prisma.class.create({
      data: dto,
    });
  }

  async update(id: number, dto: UpdateClassDto) {
    await this.findOne(id);

    return this.prisma.class.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.class.delete({
      where: { id },
    });
  }
}
