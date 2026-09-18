/** @jest-environment node */

import {
  cleanupE2eFixture,
  createAndVerifyE2eFixture,
  createE2eProgrammeFixture,
  getConfiguredE2eFixtureId,
  getE2eFixtureBlobDataPath,
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
  const originalRehearsalMode = process.env.SCHOLARSCOUT_REHEARSAL_MODE;
  const originalDataAdapter = process.env.SCHOLARSCOUT_DATA_ADAPTER;
  const originalLocalFixture = process.env.SCHOLARSCOUT_E2E_LOCAL_FIXTURE;
  const originalVercel = process.env.VERCEL;
  const originalBlobPath = process.env.SCHOLARSCOUT_BLOB_DATA_PATH;

  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = 'fixture-run-123456';
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_REHEARSAL_MODE = 'true';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    delete process.env.SCHOLARSCOUT_E2E_LOCAL_FIXTURE;
    delete process.env.VERCEL;
    delete process.env.SCHOLARSCOUT_BLOB_DATA_PATH;
    setScholarScoutDataStoreForTests(new MemoryDataStore());
  });

  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE', originalFixture);
    restoreEnvironment('SCHOLARSCOUT_E2E_FIXTURE_ID', originalFixtureId);
    restoreEnvironment('VERCEL_ENV', originalVercelEnvironment);
    restoreEnvironment('SCHOLARSCOUT_REHEARSAL_MODE', originalRehearsalMode);
    restoreEnvironment('SCHOLARSCOUT_DATA_ADAPTER', originalDataAdapter);
    restoreEnvironment('SCHOLARSCOUT_E2E_LOCAL_FIXTURE', originalLocalFixture);
    restoreEnvironment('VERCEL', originalVercel);
    restoreEnvironment('SCHOLARSCOUT_BLOB_DATA_PATH', originalBlobPath);
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
    expect(getConfiguredE2eFixtureId()).toBe('fixture-run-123456');
    expect(getE2eFixtureBlobDataPath('fixture-run-123456')).toBe(
      'scholarscout/rehearsal/fixture-run-123456/data.json',
    );
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

  it('does not accept a dashboard-provided Blob path as rehearsal configuration', async () => {
    const store = new MemoryDataStore();
    const read = jest.spyOn(store, 'read');
    const write = jest.spyOn(store, 'write');
    const readVersioned = jest.spyOn(store, 'readVersioned');
    const writeVersioned = jest.spyOn(store, 'writeVersioned');
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = 'other-application/data.json';

    await expect(createAndVerifyE2eFixture()).resolves.toBe('verified');
    expect(read).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(readVersioned).toHaveBeenCalled();
    expect(writeVersioned).toHaveBeenCalled();
  });

  it('rejects a malformed fixture id before fixture data access', async () => {
    const store = new MemoryDataStore();
    const read = jest.spyOn(store, 'read');
    const write = jest.spyOn(store, 'write');
    const readVersioned = jest.spyOn(store, 'readVersioned');
    const writeVersioned = jest.spyOn(store, 'writeVersioned');
    setScholarScoutDataStoreForTests(store);
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = 'fixture/invalid';

    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(readVersioned).not.toHaveBeenCalled();
    expect(writeVersioned).not.toHaveBeenCalled();
  });

  it('rejects non-Preview and unowned local runtime configurations before fixture data access', async () => {
    const store = new MemoryDataStore();
    const read = jest.spyOn(store, 'read');
    const write = jest.spyOn(store, 'write');
    setScholarScoutDataStoreForTests(store);

    process.env.VERCEL_ENV = 'production';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');

    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_REHEARSAL_MODE = 'false';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');

    process.env.SCHOLARSCOUT_REHEARSAL_MODE = 'true';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'json';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');

    process.env.SCHOLARSCOUT_E2E_LOCAL_FIXTURE = 'true';
    process.env.VERCEL = '1';
    await expect(createAndVerifyE2eFixture()).rejects.toThrow('E2E fixture lifecycle is unavailable.');

    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('allows only the runner-owned local JSON fixture outside Vercel', async () => {
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'json';
    process.env.SCHOLARSCOUT_E2E_LOCAL_FIXTURE = 'true';

    await expect(createAndVerifyE2eFixture()).resolves.toBe('verified');
    await expect(cleanupE2eFixture()).resolves.toBe('cleaned');
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
