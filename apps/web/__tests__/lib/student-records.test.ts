import {
  createUser,
  saveOnboardingProfile,
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

const initialData: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  programmeRecords: [],
  auditEvents: [],
};

class MemoryDataStore implements ScholarScoutDataStore {
  data = cloneData(initialData);
  version = 'memory-0';
  beforeFirstWrite?: () => Promise<void>;
  private writes = 0;

  async read() {
    return cloneData(this.data);
  }

  async write(data: ScholarScoutData) {
    this.data = cloneData(data);
    this.version = `memory-${Number(this.version.split('-')[1]) + 1}`;
  }

  async readVersioned() {
    return { data: cloneData(this.data), version: this.version };
  }

  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    this.writes += 1;
    if (this.writes === 1 && this.beforeFirstWrite) {
      await this.beforeFirstWrite();
    }
    if (expectedVersion !== this.version) {
      return { status: 'conflict' as const };
    }
    await this.write(data);
    return { status: 'applied' as const, version: this.version };
  }
}

function cloneData(data: ScholarScoutData) {
  return JSON.parse(JSON.stringify(data)) as ScholarScoutData;
}

const profile = {
  gpaBand: '3.0-3.4' as const,
  interests: ['technology' as const],
  locationPreference: 'in-state' as const,
  pathwayPreference: '4-year-university' as const,
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid' as const],
};

describe('bounded student records', () => {
  afterEach(() => {
    setScholarScoutDataStoreForTests(null);
  });

  it('allows only one concurrent account creation to commit', async () => {
    const store = new MemoryDataStore();
    let releaseFirstWrite!: () => void;
    const secondStarted = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    store.beforeFirstWrite = async () => {
      releaseFirstWrite();
      await new Promise((resolve) => setTimeout(resolve, 20));
    };
    setScholarScoutDataStoreForTests(store);

    const first = createUser({
      email: 'one@example.com',
      name: 'One',
      password: 'password-one',
      role: 'student',
    });
    await secondStarted;
    const second = createUser({
      email: 'two@example.com',
      name: 'Two',
      password: 'password-two',
      role: 'student',
    });
    const results = await Promise.allSettled([first, second]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(store.data.users).toHaveLength(1);
  });

  it('preserves a newer profile when an older replacement loses the CAS race', async () => {
    const store = new MemoryDataStore();
    let releaseFirstWrite!: () => void;
    const firstWriteStarted = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    store.beforeFirstWrite = async () => {
      releaseFirstWrite();
      await new Promise((resolve) => setTimeout(resolve, 20));
    };
    setScholarScoutDataStoreForTests(store);

    const older = saveOnboardingProfile('account:student-one', profile);
    await firstWriteStarted;
    const newerProfile = { ...profile, affordabilitySensitivity: 5 };
    const newer = saveOnboardingProfile('account:student-one', newerProfile);
    const results = await Promise.allSettled([older, newer]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(store.data.onboardingProfiles['account:student-one']).toEqual(newerProfile);
    expect(store.data.auditEvents).toHaveLength(1);
  });

  it('changes only the server-selected profile slice', async () => {
    const store = new MemoryDataStore();
    store.data.onboardingProfiles['account:student-two'] = {
      ...profile,
      affordabilitySensitivity: 1,
    };
    setScholarScoutDataStoreForTests(store);

    await saveOnboardingProfile('account:student-one', profile);

    expect(store.data.onboardingProfiles['account:student-one']).toEqual(profile);
    expect(store.data.onboardingProfiles['account:student-two']).toEqual({
      ...profile,
      affordabilitySensitivity: 1,
    });
  });
});
