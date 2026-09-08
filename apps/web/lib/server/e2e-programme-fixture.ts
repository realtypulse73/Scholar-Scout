import 'server-only';

import type { Programme } from '@/lib/programmes';

const FIXTURE_ACTOR_PREFIX = 'e2e-fixture:';

export function isE2eFixtureEnabled(): boolean {
  return process.env.SCHOLARSCOUT_E2E_FIXTURE === 'true';
}

export function getConfiguredE2eFixtureId(): string | null {
  const fixtureId = process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;
  return isE2eFixtureEnabled() && fixtureId && /^[a-z0-9-]{16,128}$/i.test(fixtureId)
    ? fixtureId
    : null;
}

export function createE2eProgrammeFixture(fixtureId: string): Programme[] {
  const prefix = `e2e-${fixtureId}`;
  return [
    {
      id: `${prefix}-health`,
      name: 'E2E Applied Health Pathway',
      school: 'Scholar Scout Fixture College',
      city: 'Fixture City',
      state: 'NY',
      delivery: 'Campus',
      pathway: '2-year-community-college',
      interests: ['healthcare', 'stem'],
      support: ['tutoring', 'financial-aid'],
      annualTuition: 4200,
      acceptanceRate: 100,
      matchScore: 92,
      duration: '2 years',
      credential: 'Fixture associate pathway',
      overview: 'Generated non-personal record used only by the isolated browser fixture.',
      highlights: ['Generated fixture', 'Tutoring support'],
      nextSteps: ['Review the generated pathway'],
      publicationStatus: 'published',
      sourceName: 'Generated fixture',
      sourceConfidence: 'verified',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
    },
    {
      id: `${prefix}-technology`,
      name: 'E2E Technology Certificate',
      school: 'Scholar Scout Fixture College',
      city: 'Fixture City',
      state: 'NY',
      delivery: 'Hybrid',
      pathway: 'certificate-program',
      interests: ['technology', 'stem'],
      support: ['career-counseling', 'financial-aid'],
      annualTuition: 3600,
      acceptanceRate: 100,
      matchScore: 89,
      duration: '10 months',
      credential: 'Fixture career certificate',
      overview: 'Generated non-personal record used only by the isolated browser fixture.',
      highlights: ['Generated fixture', 'Career guidance'],
      nextSteps: ['Compare the generated certificate'],
      publicationStatus: 'published',
      sourceName: 'Generated fixture',
      sourceConfidence: 'verified',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
    },
  ];
}

export function getE2eFixtureProgrammes(fixtureId: string): Programme[] {
  return createE2eProgrammeFixture(fixtureId);
}

export async function createAndVerifyE2eFixture(): Promise<'verified'> {
  const fixtureId = requireConfiguredFixtureId();
  const { getGovernedProgrammes, saveProgrammeRecord } = await import('./programme-records');
  const records = createE2eProgrammeFixture(fixtureId);
  await Promise.all(records.map((record) => saveProgrammeRecord(fixtureActor(fixtureId), record)));
  const governed = await getGovernedProgrammes();
  if (governed.length !== records.length || !records.every((record) => governed.some((item) => item.id === record.id))) {
    throw new Error('E2E fixture records were not available through the governed catalogue.');
  }
  return 'verified';
}

export async function verifyE2eFixture(): Promise<'verified'> {
  const fixtureId = requireConfiguredFixtureId();
  const { getGovernedProgrammes } = await import('./programme-records');
  const expected = createE2eProgrammeFixture(fixtureId);
  const governed = await getGovernedProgrammes();
  if (governed.length !== expected.length || !expected.every((record) => governed.some((item) => item.id === record.id))) {
    throw new Error('E2E fixture records could not be verified.');
  }
  return 'verified';
}

export async function cleanupE2eFixture(): Promise<'cleaned'> {
  const fixtureId = requireConfiguredFixtureId();
  const { deleteProgrammeRecord } = await import('./programme-records');
  await Promise.all(createE2eProgrammeFixture(fixtureId).map((record) =>
    deleteProgrammeRecord(fixtureActor(fixtureId), record.id),
  ));
  return 'cleaned';
}

function requireConfiguredFixtureId(): string {
  const fixtureId = getConfiguredE2eFixtureId();
  if (!fixtureId || process.env.VERCEL_ENV === 'production') {
    throw new Error('E2E fixture lifecycle is unavailable.');
  }
  return fixtureId;
}

function fixtureActor(fixtureId: string): string {
  return `${FIXTURE_ACTOR_PREFIX}${fixtureId}`;
}
