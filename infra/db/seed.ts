import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const programs = [
  {
    name: 'Women in STEM Grant',
    school: 'Northstar University',
    minGpa: 3.2,
    maxGpa: 4,
    location: 'New York',
    field: 'Computer Science',
  },
  {
    name: 'Community Leadership Scholarship',
    school: 'Lakeside College',
    minGpa: 2.7,
    maxGpa: 4,
    location: 'Remote',
    field: 'Public Policy',
  },
  {
    name: 'Applied Engineering Fellowship',
    school: 'Summit Technical Institute',
    minGpa: 3,
    maxGpa: 4,
    location: 'California',
    field: 'Engineering',
  },
];

async function main() {
  for (const program of programs) {
    await prisma.program.upsert({
      where: { id: program.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      create: {
        id: program.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ...program,
      },
      update: program,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

