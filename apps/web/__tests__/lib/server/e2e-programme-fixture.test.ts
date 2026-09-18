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
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import { getGovernedProgrammes } from '@/lib/server/programme-records';

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
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalDataAdapter = process.env.SCHOLARSCOUT_DATA_ADAPTER;
  const originalBlobPath = process.env.SCHOLARSCOUT_BLOB_DATA_PATH;

  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = 'fixture-run-123456';
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = 'scholarscout/preview/fixture-run-123456/data.json';
    setScholarScoutDataStoreForTests(new MemoryDataStore());
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE', originalFixture);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE_ID', originalFixtureId);
    restoreEnvironment('VERCEL_ENV', originalVercelEnv);
    restoreEnvironment('SCHOLARSCOUT_DATA_ADAPTER', originalDataAdapter);
    restoreEnvironment('SCHOLARSCOUT_BLOB_DATA_PATH', originalBlobPath);
  });

  it('derives deterministic generated records from configured fixture state', () => {
    expect(createE2eProgrammeFixture('run-abc').map((programme) => programme.id)).toEqual([
      'e2e-run-abc-health',
      'e2e-run-abc-technology',
    ]);
    expect(getE2eFixtureProgrammes('run-abc')).toHaveLength(2);
  });

  it('persists and cleans only declared records through the governed catalogue', async () => {
    await expect(createAndVerifyE2eFixture()).resolves.toBe('verified');
    await expect(verifyE2eFixture()).resolves.toBe('verified');

    const governed = await getGovernedProgrammes();
    expect(governed).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'e2e-fixture-run-123456-health' }),
      expect.objectContaining({ id: 'e2e-fixture-run-123456-technology' }),
      expect.objectContaining({ id: programmes[0].id }),
    ]));

    await expect(cleanupE2eFixture()).resolves.toBe('cleaned');
    const afterCleanup = await getGovernedProgrammes();
    expect(afterCleanup.map((programme) => programme.id)).not.toContain(
      'e2e-fixture-run-123456-health',
    );
    expect(afterCleanup.map((programme) => programme.id)).toContain(programmes[0].id);
  });

  it.each([
    ['a blank path', ''],
    ['a default path', 'scholarscout/data.json'],
    ['another fixture path', 'scholarscout/preview/another-fixture-123456/data.json'],
    ['a malformed path', 'scholarscout/preview/fixture-run-123456/other.json'],
    ['an external path', 'https://storage.example.test/data.json'],
  ])('rejects %s before fixture data access', async (_label, blobPath) => {
    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = blobPath;

    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');
    expect((await getGovernedProgrammes()).map((programme) => programme.id)).not.toContain(
      'e2e-fixture-run-123456-health',
    );
  });

  it('rejects non-Preview and non-Blob runtime configurations', async () => {
    process.env.VERCEL_ENV = 'production';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');

    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'json';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
