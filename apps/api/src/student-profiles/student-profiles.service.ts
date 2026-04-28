import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertStudentProfileDto } from './dto/upsert-student-profile.dto';

@Injectable()
export class StudentProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(dto: UpsertStudentProfileDto) {
    return this.prisma.studentProfile.upsert({
      where: { userId: dto.userId },
      create: dto,
      update: {
        gpa: dto.gpa,
        interests: dto.interests,
        location: dto.location,
      },
    });
  }

  findById(id: string) {
    return this.prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }
}
