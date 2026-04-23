import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: dto,
    });
  }

  syncFromClerk(dto: CreateUserDto) {
    return this.prisma.user.upsert({
      where: { id: dto.id },
      create: dto,
      update: {
        email: dto.email,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }
}
