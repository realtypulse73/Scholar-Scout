import 'server-only';

import type { Programme } from '@/lib/programmes';
import {
  getConfiguredE2eFixtureId,
  getE2eFixtureBlobDataPath,
  isE2eRehearsalRuntime,
} from './e2e-fixture-config';

export {
  getConfiguredE2eFixtureId,
  getE2eFixtureBlobDataPath,
  isE2eFixtureEnabled,
} from './e2e-fixture-config';

const FIXTURE_ACTOR_PREFIX = 'e2e-fixture:';
const FIXTURE_VERIFICATION_ATTEMPTS = 5;
const FIXTURE_VERIFICATION_DELAY_MS = 250;

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
      sourceNotes: 'Generated fixture record for isolated Preview rehearsal.',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
      lastVerifiedAt: '2026-01-01T00:00:00.000Z',
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
      sourceNotes: 'Generated fixture record for isolated Preview rehearsal.',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
      lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function getE2eFixtureProgrammes(fixtureId: string): Programme[] {
  return createE2eProgrammeFixture(fixtureId);
}

export async function createAndVerifyE2eFixture(): Promise<'verified'> {
  const fixtureId = assertE2eFixtureRuntimeConfiguration();
  const { getGovernedProgrammes } = await import('./programme-records');
  const records = createE2eProgrammeFixture(fixtureId);
  await writeFixtureRecords(fixtureActor(fixtureId), records);
  await waitForFixtureRecords(getGovernedProgrammes, records, 'available');
  return 'verified';
}

export async function verifyE2eFixture(): Promise<'verified'> {
  const fixtureId = assertE2eFixtureRuntimeConfiguration();
  const { getGovernedProgrammes } = await import('./programme-records');
  const expected = createE2eProgrammeFixture(fixtureId);
  await waitForFixtureRecords(getGovernedProgrammes, expected, 'verified');
  return 'verified';
}

export async function cleanupE2eFixture(): Promise<'cleaned'> {
  const fixtureId = assertE2eFixtureRuntimeConfiguration();
  await deleteFixtureRecords(
    fixtureActor(fixtureId),
    createE2eProgrammeFixture(fixtureId),
  );
  return 'cleaned';
}

/**
 * Ensures a lifecycle request can access only the fixture's isolated Preview Blob object.
 */
export function assertE2eFixtureRuntimeConfiguration(): string {
  const fixtureId = getConfiguredE2eFixtureId();
  if (
    !fixtureId ||
    !isE2eRehearsalRuntime() ||
    process.env.SCHOLARSCOUT_DATA_ADAPTER !== 'vercel-blob'
  ) {
    throw new Error('E2E fixture lifecycle is unavailable.');
  }
  // Resolve the path here too, so an invalid configured ID fails before any
  // data-store operation even if an adapter implementation changes later.
  getE2eFixtureBlobDataPath(fixtureId);
  return fixtureId;
}

function fixtureActor(fixtureId: string): string {
  return `${FIXTURE_ACTOR_PREFIX}${fixtureId}`;
}

async function writeFixtureRecords(actor: string, records: Programme[]): Promise<void> {
  const { saveProgrammeRecord } = await import('./programme-records');

  for (const record of records) {
    await saveProgrammeRecord(actor, record);
  }
}

async function deleteFixtureRecords(actor: string, records: Programme[]): Promise<void> {
  const { deleteProgrammeRecord } = await import('./programme-records');

  for (const record of records) {
    await deleteProgrammeRecord(actor, record.id);
  }
}

async function waitForFixtureRecords(
  getGovernedProgrammes: () => Promise<Programme[]>,
  expected: Programme[],
  phase: 'available' | 'verified',
): Promise<void> {
  for (let attempt = 1; attempt <= FIXTURE_VERIFICATION_ATTEMPTS; attempt += 1) {
    const governed = await getGovernedProgrammes();
    if (expected.every((record) => governed.some((item) => item.id === record.id))) return;
    if (attempt < FIXTURE_VERIFICATION_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, FIXTURE_VERIFICATION_DELAY_MS));
    }
  }
  throw new Error(`E2E fixture records were not ${phase} through the governed catalogue.`);
}
