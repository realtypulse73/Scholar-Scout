import { Injectable, NotFoundException } from '@nestjs/common';
import { Program, StudentProfile } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ProgramsService } from '../programs/programs.service';
import { StudentProfilesService } from '../student-profiles/student-profiles.service';
import { MatchRequestDto } from './dto/match-request.dto';

type MatchResult = {
  programId: string;
  programName: string;
  score: number;
  reasons: string[];
};

@Injectable()
export class MatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfilesService: StudentProfilesService,
    private readonly programsService: ProgramsService,
  ) {}

  async findMatches(dto: MatchRequestDto) {
    const studentProfile = await this.studentProfilesService.findById(
      dto.studentProfileId,
    );

    if (!studentProfile) {
      throw new NotFoundException('Student profile not found.');
    }

    const programs = await this.programsService.findActivePrograms();
    const matches = programs
      .map((program) => this.scoreProgram(studentProfile, program))
      .filter((match): match is MatchResult => match !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, dto.limit ?? 10);

    await this.prisma.match.deleteMany({
      where: { studentId: studentProfile.id },
    });

    if (matches.length > 0) {
      await this.prisma.match.createMany({
        data: matches.map((match) => ({
          studentId: studentProfile.id,
          programId: match.programId,
          score: match.score,
        })),
      });
    }

    return {
      studentProfileId: studentProfile.id,
      totalProgramsConsidered: programs.length,
      matches,
    };
  }

  private scoreProgram(
    student: StudentProfile,
    program: Program,
  ): MatchResult | null {
    const reasons: string[] = [];
    if (student.gpa < program.minGpa || student.gpa > program.maxGpa) {
      return null;
    }

    const gpaSpan = Math.max(program.maxGpa - program.minGpa, 0.1);
    const midpoint = program.minGpa + gpaSpan / 2;
    const distanceFromMidpoint = Math.abs(student.gpa - midpoint);
    const gpaFit = Math.max(
      0,
      Math.round(40 - (distanceFromMidpoint / gpaSpan) * 20),
    );
    reasons.push('GPA fits program range');

    const normalizedInterests = student.interests.map((interest) =>
      interest.trim().toLowerCase(),
    );
    const programField = program.field.trim().toLowerCase();
    const exactFieldMatch = normalizedInterests.includes(programField);
    const programMatch = exactFieldMatch ? 40 : 10;
    reasons.push(
      exactFieldMatch
        ? 'Program field matches student interests'
        : 'Program field is adjacent to student interests',
    );

    const normalizedStudentLocation = student.location.trim().toLowerCase();
    const normalizedProgramLocation = program.location.trim().toLowerCase();
    const locationPreference =
      normalizedStudentLocation === normalizedProgramLocation
        ? 20
        : normalizedStudentLocation.includes(normalizedProgramLocation) ||
          normalizedProgramLocation.includes(normalizedStudentLocation)
          ? 10
          : 0;
    reasons.push(
      locationPreference === 20
        ? 'Location preference is an exact match'
        : locationPreference === 10
          ? 'Location preference is a partial match'
          : 'Location preference does not align closely',
    );

    return {
      programId: program.id,
      programName: program.name,
      score: gpaFit + programMatch + locationPreference,
      reasons: [
        ...reasons,
        `GPA fit: ${gpaFit}`,
        `Program match: ${programMatch}`,
        `Location preference: ${locationPreference}`,
      ],
    };
  }
}
