import 'server-only';

import type { Programme } from '@/lib/programmes';
import { readScholarScoutData } from '@/lib/server/data-store';
import {
  deleteProgrammeRecord,
  getGovernedProgrammes,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';

const FIXTURE_ACTOR_ID = 'e2e-fixture';

export function getE2eCommunityOutageBodies(): {
  note: string;
  inbox: string;
} {
  const fixtureId = getFixtureId();
  return {
    note: `Generated outage note ${fixtureId}`,
    inbox: `Generated outage inbox ${fixtureId}`,
  };
}

function getFixtureId(): string {
  if (process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED !== 'true') {
    throw new Error('E2E fixture mode is disabled.');
  }
  const fixtureId = process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;
  if (!fixtureId) throw new Error('E2E fixture identifier is unavailable.');
  return fixtureId;
}

/** Server-owned generated descriptors; callers cannot select catalogue records. */
export function getE2eProgrammeFixtureRecords(): Programme[] {
  const fixtureId = getFixtureId();
  return [
    {
      id: `e2e-${fixtureId}-technology`, name: 'Generated Technology Pathway',
      school: 'Scholar Scout Fixture Institute', city: 'Fixture City', state: 'CA',
      delivery: 'Online', pathway: 'certificate-program', interests: ['technology'],
      support: ['tutoring', 'career-counseling'], annualTuition: 2400,
      acceptanceRate: 100, matchScore: 90, duration: '9 months',
      credential: 'Generated certificate', overview: 'Generated non-personal programme fixture.',
      highlights: ['Generated support'], nextSteps: ['Confirm fixture details'],
      publicationStatus: 'published', sourceName: 'E2E fixture',
      sourceUrl: 'https://example.invalid/e2e-fixture', sourceConfidence: 'verified',
      sourceNotes: 'Generated local-only record used to validate the owned E2E fixture.',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
      lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `e2e-${fixtureId}-health`, name: 'Generated Health Transfer Pathway',
      school: 'Scholar Scout Fixture Institute', city: 'Fixture City', state: 'CA',
      delivery: 'Campus', pathway: '2-year-community-college', interests: ['healthcare'],
      support: ['tutoring', 'financial-aid'], annualTuition: 3200,
      acceptanceRate: 100, matchScore: 88, duration: '2 years',
      credential: 'Generated transfer pathway', overview: 'Generated non-personal programme fixture.',
      highlights: ['Generated transfer support'], nextSteps: ['Confirm fixture details'],
      publicationStatus: 'published', sourceName: 'E2E fixture',
      sourceUrl: 'https://example.invalid/e2e-fixture', sourceConfidence: 'verified',
      sourceNotes: 'Generated local-only record used to validate the owned E2E fixture.',
      sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
      lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export async function createE2eProgrammeFixture(): Promise<void> {
  for (const record of getE2eProgrammeFixtureRecords()) {
    await saveProgrammeRecord(FIXTURE_ACTOR_ID, record);
  }
}

export async function verifyE2eProgrammeFixture(): Promise<string[]> {
  const expectedIds = getE2eProgrammeFixtureRecords().map(({ id }) => id);
  const actualIds = new Set((await getGovernedProgrammes()).map(({ id }) => id));
  if (!expectedIds.every((id) => actualIds.has(id))) {
    throw new Error('Generated E2E programme fixture is incomplete.');
  }
  return expectedIds;
}

export async function cleanupE2eProgrammeFixture(): Promise<void> {
  for (const { id } of getE2eProgrammeFixtureRecords()) {
    await deleteProgrammeRecord(FIXTURE_ACTOR_ID, id);
  }
}

/** Deletes only the generated Plan 06 rehearsal document after exact cleanup. */
export async function cleanupE2eReleaseDataScope(): Promise<void> {
  if (process.env.SCHOLARSCOUT_E2E_PURGE_DATA_ON_CLEANUP !== 'true') return;
  const dataPath = process.env.SCHOLARSCOUT_BLOB_DATA_PATH;
  const token = process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN;
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.SCHOLARSCOUT_DATA_ADAPTER !== 'vercel-blob' ||
    !dataPath?.startsWith('scholarscout/e2e/') ||
    !token
  ) {
    throw new Error('Generated release data cleanup is unavailable.');
  }
  const { del } = await import('@vercel/blob');
  await del(dataPath, { token });
}

/** Proves the fixed generated outage bodies were not persisted. */
export async function verifyE2eCommunityOutageNoWrite(): Promise<void> {
  const data = await readScholarScoutData();
  const bodies = getE2eCommunityOutageBodies();
  if (
    (data.campusNotes ?? []).some(({ body }) => body === bodies.note) ||
    (data.uploaderInboxRequests ?? []).some(({ body }) => body === bodies.inbox)
  ) {
    throw new Error('Generated outage submission was persisted.');
  }
}
