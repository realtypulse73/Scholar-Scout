import 'server-only';

import type { Programme } from '@/lib/programmes';
import {
  createAuditEvent,
} from './data-store';
import { commitConditionalMutation } from './persistence-operations';

const FIXTURE_ACTOR_PREFIX = 'e2e-fixture:';
const FIXTURE_VERIFICATION_ATTEMPTS = 5;
const FIXTURE_VERIFICATION_DELAY_MS = 250;

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
  const fixtureId = requireConfiguredFixtureId();
  const { getGovernedProgrammes } = await import('./programme-records');
  const records = createE2eProgrammeFixture(fixtureId);
  await writeFixtureRecords(fixtureActor(fixtureId), records);
  await waitForFixtureRecords(getGovernedProgrammes, records, 'available');
  return 'verified';
}

export async function verifyE2eFixture(): Promise<'verified'> {
  const fixtureId = requireConfiguredFixtureId();
  const { getGovernedProgrammes } = await import('./programme-records');
  const expected = createE2eProgrammeFixture(fixtureId);
  await waitForFixtureRecords(getGovernedProgrammes, expected, 'verified');
  return 'verified';
}

export async function cleanupE2eFixture(): Promise<'cleaned'> {
  const fixtureId = requireConfiguredFixtureId();
  await deleteFixtureRecords(
    fixtureActor(fixtureId),
    createE2eProgrammeFixture(fixtureId),
  );
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

async function writeFixtureRecords(actor: string, records: Programme[]): Promise<void> {
  const result = await commitConditionalMutation((data) => {
    for (const record of records) {
      const existingIndex = data.programmeRecords.findIndex(
        (item) => item.id === record.id,
      );
      const existing = data.programmeRecords[existingIndex];
      if (existing) {
        data.programmeRecords[existingIndex] = {
          ...record,
          revision: (existing.revision ?? 0) + 1,
        };
      } else {
        data.programmeRecords.unshift({ ...record, revision: 1 });
      }
      data.auditEvents.push(
        createAuditEvent(actor, existing ? 'update' : 'create', 'programme', record.id),
      );
    }
  });
  if (result.status === 'conflict') {
    throw new Error('E2E fixture records could not be stored safely.');
  }
}

async function deleteFixtureRecords(actor: string, records: Programme[]): Promise<void> {
  const fixtureIds = new Set(records.map((record) => record.id));
  const result = await commitConditionalMutation((data) => {
    data.programmeRecords = data.programmeRecords.filter(
      (record) => !fixtureIds.has(record.id),
    );
    for (const record of records) {
      data.auditEvents.push(createAuditEvent(actor, 'delete', 'programme', record.id));
    }
  });
  if (result.status === 'conflict') {
    throw new Error('E2E fixture records could not be cleaned safely.');
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
