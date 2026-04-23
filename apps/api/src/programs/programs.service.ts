import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProgramDto) {
    return this.prisma.program.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findActivePrograms() {
    return this.prisma.program.findMany();
  }
}
