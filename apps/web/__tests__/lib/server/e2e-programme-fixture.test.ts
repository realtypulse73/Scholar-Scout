import {
  cleanupE2eProgrammeFixture,
  cleanupE2eReleaseDataScope,
  createE2eProgrammeFixture,
  getE2eCommunityOutageBodies,
  getE2eProgrammeFixtureRecords,
  verifyE2eCommunityOutageNoWrite,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';
import { validateProgrammeDraft } from '@/lib/admin-programmes';
import {
  deleteProgrammeRecord,
  getGovernedProgrammes,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';
import { readScholarScoutData } from '@/lib/server/data-store';
import { del } from '@vercel/blob';

jest.mock('@/lib/server/programme-records', () => ({
  deleteProgrammeRecord: jest.fn(),
  getGovernedProgrammes: jest.fn(),
  saveProgrammeRecord: jest.fn(),
}));
jest.mock('@/lib/server/data-store', () => ({
  readScholarScoutData: jest.fn(),
}));
jest.mock('@vercel/blob', () => ({
  del: jest.fn(),
}));

const fixtureId = 'fixture-a';

describe('e2e programme fixture', () => {
  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = fixtureId;
    jest.mocked(saveProgrammeRecord).mockResolvedValue(undefined);
    jest.mocked(deleteProgrammeRecord).mockResolvedValue(undefined);
    jest.mocked(getGovernedProgrammes).mockResolvedValue([]);
    jest.mocked(readScholarScoutData).mockResolvedValue({
      users: [],
      onboardingProfiles: {},
      shortlists: {},
      programmeRecords: [],
      auditEvents: [],
      campusNotes: [],
      uploaderInboxRequests: [],
    });
  });

  afterEach(() => {
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED;
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;
    delete process.env.SCHOLARSCOUT_E2E_PURGE_DATA_ON_CLEANUP;
    delete process.env.SCHOLARSCOUT_BLOB_DATA_PATH;
    delete process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN;
    delete process.env.SCHOLARSCOUT_DATA_ADAPTER;
    delete process.env.VERCEL_ENV;
    jest.resetAllMocks();
  });

  it('creates and cleans only deterministic governed records', async () => {
    await createE2eProgrammeFixture();
    expect(saveProgrammeRecord).toHaveBeenCalledTimes(2);
    expect(jest.mocked(saveProgrammeRecord).mock.calls.every(([actor]) => actor === 'e2e-fixture')).toBe(true);

    await cleanupE2eProgrammeFixture();
    expect(deleteProgrammeRecord).toHaveBeenCalledTimes(2);
  });

  it('requires generated records through the governed boundary', async () => {
    await createE2eProgrammeFixture();
    const ids = jest.mocked(saveProgrammeRecord).mock.calls.map(([, record]) => record.id);
    jest.mocked(getGovernedProgrammes).mockResolvedValue(
      jest.mocked(saveProgrammeRecord).mock.calls.map(([, record]) => record),
    );

    await expect(verifyE2eProgrammeFixture()).resolves.toEqual(ids);
  });

  it('uses generated published records that satisfy the governed source contract', () => {
    expect(getE2eProgrammeFixtureRecords().map(validateProgrammeDraft)).toEqual([[], []]);
  });

  it('proves neither fixed generated outage body was persisted', async () => {
    await expect(verifyE2eCommunityOutageNoWrite()).resolves.toBeUndefined();

    const bodies = getE2eCommunityOutageBodies();
    jest.mocked(readScholarScoutData).mockResolvedValue({
      users: [],
      onboardingProfiles: {},
      shortlists: {},
      programmeRecords: [],
      auditEvents: [],
      campusNotes: [{ body: bodies.note }],
    } as never);

    await expect(verifyE2eCommunityOutageNoWrite()).rejects.toThrow(
      'Generated outage submission was persisted.',
    );
  });

  it('purges only an explicit isolated Preview Blob data path', async () => {
    process.env.SCHOLARSCOUT_E2E_PURGE_DATA_ON_CLEANUP = 'true';
    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_DATA_ADAPTER = 'vercel-blob';
    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = 'scholarscout/e2e/candidate/run/base.json';
    process.env.SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN = 'preview-token';

    await cleanupE2eReleaseDataScope();
    expect(del).toHaveBeenCalledWith(
      'scholarscout/e2e/candidate/run/base.json',
      { token: 'preview-token' },
    );

    process.env.SCHOLARSCOUT_BLOB_DATA_PATH = 'scholarscout/data.json';
    await expect(cleanupE2eReleaseDataScope()).rejects.toThrow(
      'Generated release data cleanup is unavailable.',
    );
  });
});
