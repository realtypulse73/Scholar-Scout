/** @jest-environment node */

import {
  cleanupE2eFixture,
  createAndVerifyE2eFixture,
  createE2eProgrammeFixture,
  getE2eFixtureProgrammes,
  verifyE2eFixture,
} from '@/lib/server/e2e-programme-fixture';
import { programmes } from '@/lib/programmes';
import {
  readScholarScoutData,
  setScholarScoutDataStoreForTests,
  validateScholarScoutDataImport,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import {
  getGovernedProgrammes,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';

const initialData: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  programmeRecords: [],
  auditEvents: [],
};

class MemoryDataStore implements ScholarScoutDataStore {
  data = structuredClone(initialData);
  version = 'memory-0';

  async read() {
    return structuredClone(this.data);
  }

  async write(data: ScholarScoutData) {
    this.data = structuredClone(data);
    this.version = `memory-${Number(this.version.split('-')[1]) + 1}`;
  }

  async readVersioned() {
    return { data: structuredClone(this.data), version: this.version };
  }

  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    if (expectedVersion !== this.version) return { status: 'conflict' as const };
    await this.write(data);
    return { status: 'applied' as const, version: this.version };
  }
}

describe('e2e programme fixture', () => {
  const originalFixture = process.env.SCHOLARSCOUT_E2E_FIXTURE;
  const originalFixtureId = process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;
  const originalVercelEnvironment = process.env.VERCEL_ENV;

  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = 'fixture-run-123456';
    setScholarScoutDataStoreForTests(new MemoryDataStore());
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE', originalFixture);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE_ID', originalFixtureId);
    restoreEnvironment('VERCEL_ENV', originalVercelEnvironment);
  });

  it('derives deterministic generated records from configured fixture state', () => {
    const records = createE2eProgrammeFixture('run-abc');
    expect(records.map((programme) => programme.id)).toEqual([
      'e2e-run-abc-health',
      'e2e-run-abc-technology',
    ]);
    expect(records).toEqual(expect.arrayContaining([
      expect.objectContaining({
        lastVerifiedAt: '2026-01-01T00:00:00.000Z',
        sourceNotes: 'Generated fixture record for isolated Preview rehearsal.',
      }),
    ]));
    expect(validateScholarScoutDataImport({
      ...initialData,
      programmeRecords: records,
    }).isValid).toBe(true);
    expect(getE2eFixtureProgrammes('run-abc')).toHaveLength(2);
  });

  it('creates, reads, and cleans exactly the declared records through the governed catalogue', async () => {
    await saveProgrammeRecord('staff-unrelated', {
      ...programmes[0],
      id: 'unrelated-governed-record',
      name: 'Unrelated governed record',
    });

    await expect(createAndVerifyE2eFixture()).resolves.toBe('verified');
    await expect(verifyE2eFixture()).resolves.toBe('verified');

    const governed = await getGovernedProgrammes();
    expect(governed.map((programme) => programme.id)).toEqual([
      'e2e-fixture-run-123456-health',
      'e2e-fixture-run-123456-technology',
    ]);
    expect(governed.map((programme) => programme.id)).not.toContain(programmes[0].id);
    expect(governed.map((programme) => programme.id)).not.toContain(
      'unrelated-governed-record',
    );

    await expect(cleanupE2eFixture()).resolves.toBe('cleaned');
    const afterCleanup = await getGovernedProgrammes();
    expect(afterCleanup).toEqual([]);

    const data = await readScholarScoutData();
    expect(data.programmeRecords.map((programme) => programme.id)).toEqual([
      'unrelated-governed-record',
    ]);
    expect(data.auditEvents.filter((event) => event.userId === 'e2e-fixture:fixture-run-123456'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ action: 'create', entityId: 'e2e-fixture-run-123456-health' }),
        expect.objectContaining({ action: 'create', entityId: 'e2e-fixture-run-123456-technology' }),
        expect.objectContaining({ action: 'delete', entityId: 'e2e-fixture-run-123456-health' }),
        expect.objectContaining({ action: 'delete', entityId: 'e2e-fixture-run-123456-technology' }),
      ]));
  });

  it('retains ordinary seed catalogue behavior when fixture mode is disabled', async () => {
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE;

    await expect(getGovernedProgrammes()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: programmes[0].id })]),
    );
  });

  it('denies production lifecycle activation before persisting any programme records', async () => {
    process.env.VERCEL_ENV = 'production';

    await expect(createAndVerifyE2eFixture()).rejects.toThrow(
      'E2E fixture lifecycle is unavailable.',
    );

    await expect(readScholarScoutData()).resolves.toEqual(
      expect.objectContaining({ programmeRecords: [], auditEvents: [] }),
    );
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
