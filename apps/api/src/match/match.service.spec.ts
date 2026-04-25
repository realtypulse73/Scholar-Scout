import { MatchService } from './match.service';

describe('MatchService', () => {
  const prisma = {
    match: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const studentProfilesService = {
    findById: jest.fn(),
  };
  const programsService = {
    findActivePrograms: jest.fn(),
  };
  const service = new MatchService(
    prisma as never,
    studentProfilesService as never,
    programsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scores, sorts, limits, and persists matching programs', async () => {
    studentProfilesService.findById.mockResolvedValue({
      id: 'profile_1',
      userId: 'user_1',
      gpa: 3.6,
      interests: ['Computer Science'],
      location: 'California',
      createdAt: new Date(),
    });
    programsService.findActivePrograms.mockResolvedValue([
      {
        id: 'program_1',
        name: 'CS Scholars',
        school: 'West Coast University',
        minGpa: 3.2,
        maxGpa: 4,
        location: 'California',
        field: 'Computer Science',
        createdAt: new Date(),
      },
      {
        id: 'program_2',
        name: 'Business Bridge',
        school: 'Metro College',
        minGpa: 2.8,
        maxGpa: 3.8,
        location: 'New York',
        field: 'Business',
        createdAt: new Date(),
      },
      {
        id: 'program_3',
        name: 'Reach STEM',
        school: 'North Institute',
        minGpa: 3.9,
        maxGpa: 4,
        location: 'California',
        field: 'Computer Science',
        createdAt: new Date(),
      },
    ]);
    prisma.match.deleteMany.mockResolvedValue({ count: 0 });
    prisma.match.createMany.mockResolvedValue({ count: 1 });

    const result = await service.findMatches({
      studentProfileId: 'profile_1',
      limit: 1,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].programId).toBe('program_1');
    expect(prisma.match.deleteMany).toHaveBeenCalledWith({
      where: { studentId: 'profile_1' },
    });
    expect(prisma.match.createMany).toHaveBeenCalledWith({
      data: [{ studentId: 'profile_1', programId: 'program_1', score: 100 }],
    });
  });
});
