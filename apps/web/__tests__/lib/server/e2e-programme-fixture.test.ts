import {
  cleanupE2eProgrammeFixture,
  createE2eProgrammeFixture,
  getE2eProgrammeFixtureRecords,
  verifyE2eProgrammeFixture,
} from '@/lib/server/e2e-programme-fixture';
import { validateProgrammeDraft } from '@/lib/admin-programmes';
import {
  deleteProgrammeRecord,
  getGovernedProgrammes,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';

jest.mock('@/lib/server/programme-records', () => ({
  deleteProgrammeRecord: jest.fn(),
  getGovernedProgrammes: jest.fn(),
  saveProgrammeRecord: jest.fn(),
}));

const fixtureId = 'fixture-a';

describe('e2e programme fixture', () => {
  beforeEach(() => {
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED = 'true';
    process.env.SCHOLARSCOUT_E2E_FIXTURE_ID = fixtureId;
    jest.mocked(saveProgrammeRecord).mockResolvedValue(undefined);
    jest.mocked(deleteProgrammeRecord).mockResolvedValue(undefined);
    jest.mocked(getGovernedProgrammes).mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ENABLED;
    delete process.env.SCHOLARSCOUT_E2E_FIXTURE_ID;
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
});
