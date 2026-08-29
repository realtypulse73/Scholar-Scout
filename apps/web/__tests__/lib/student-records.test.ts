import {
  saveOnboardingProfile,
  saveShortlistState,
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';
import { createStudentAccountRecord } from '@/lib/server/student-records';
import type { OnboardingData } from '@/lib/onboarding-types';

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

const profile: OnboardingData = {
  gpaBand: '3.0-3.4',
  interests: ['technology'],
  locationPreference: 'in-state',
  pathwayPreference: '4-year-university',
  affordabilitySensitivity: 3,
  supportNeeds: ['financial-aid'],
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

    const first = createStudentAccountRecord({
      id: 'student-one',
      email: 'one@example.com',
      name: 'One',
      passwordHash: 'hash-one',
      role: 'student',
      createdAt: '2026-08-29T00:00:00.000Z',
    });
    await secondStarted;
    const second = createStudentAccountRecord({
      id: 'student-two',
      email: 'two@example.com',
      name: 'Two',
      passwordHash: 'hash-two',
      role: 'student',
      createdAt: '2026-08-29T00:00:00.000Z',
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
    const newerProfile: OnboardingData = {
      ...profile,
      affordabilitySensitivity: 5,
    };
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

  it('commits shortlist IDs and plans atomically for one student', async () => {
    const store = new MemoryDataStore();
    store.data.shortlists['account:student-two'] = ['existing-programme'];
    setScholarScoutDataStoreForTests(store);

    await saveShortlistState(
      'account:student-one',
      ['north-valley-health'],
      {
        'north-valley-health': {
          status: 'contacted',
          note: ' Asked about aid. ',
        },
      },
    );

    expect(store.data.shortlists['account:student-one']).toEqual([
      'north-valley-health',
    ]);
    expect(store.data.shortlistPlans?.['account:student-one']).toEqual({
      'north-valley-health': {
        status: 'contacted',
        note: 'Asked about aid.',
      },
    });
    expect(store.data.shortlists['account:student-two']).toEqual([
      'existing-programme',
    ]);
    expect(store.data.auditEvents).toHaveLength(1);
  });

  it('preserves the winning shortlist state on an interleaved replacement', async () => {
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

    const older = saveShortlistState('account:student-one', ['older'], {});
    await firstWriteStarted;
    const newer = saveShortlistState('account:student-one', ['newer'], {});
    const results = await Promise.allSettled([older, newer]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(store.data.shortlists['account:student-one']).toEqual(['newer']);
    expect(store.data.auditEvents).toHaveLength(1);
  });
});
