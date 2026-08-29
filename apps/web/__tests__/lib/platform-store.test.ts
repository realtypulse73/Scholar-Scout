import {
  appendAnalyticsEvent,
  appendFeedInteraction,
  saveSimulationResult,
} from '@/lib/server/platform-store';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

const initialData: ScholarScoutData = {
  users: [], onboardingProfiles: {}, shortlists: {}, programmeRecords: [], auditEvents: [],
};

class ConflictStore implements ScholarScoutDataStore {
  data = JSON.parse(JSON.stringify(initialData)) as ScholarScoutData;
  version = 0;
  writes = 0;
  conflictsRemaining = 0;
  async read() { return JSON.parse(JSON.stringify(this.data)) as ScholarScoutData; }
  async write(data: ScholarScoutData) { this.data = JSON.parse(JSON.stringify(data)); this.version += 1; }
  async readVersioned() { return { data: await this.read(), version: String(this.version) }; }
  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    this.writes += 1;
    if (this.conflictsRemaining-- > 0) { this.version += 1; return { status: 'conflict' as const }; }
    if (expectedVersion !== String(this.version)) return { status: 'conflict' as const };
    await this.write(data);
    return { status: 'applied' as const, version: String(this.version) };
  }
}

describe('bounded platform persistence', () => {
  afterEach(() => setScholarScoutDataStoreForTests(null));

  it('retries stable-ID feed and analytics appends only once', async () => {
    const store = new ConflictStore();
    store.conflictsRemaining = 1;
    setScholarScoutDataStoreForTests(store);
    await appendFeedInteraction({ userKey: 'account:one', feedItemId: 'feed-1', watchSeconds: 4, skipped: false });
    expect(store.writes).toBe(3); // two append attempts plus the non-retried memory replacement

    store.conflictsRemaining = 1;
    const before = store.writes;
    await appendAnalyticsEvent({ area: 'discovery', name: 'view', userKey: 'account:one' });
    expect(store.writes - before).toBe(2);
  });

  it('does not retry simulation replacements after a conflict', async () => {
    const store = new ConflictStore();
    store.conflictsRemaining = 1;
    setScholarScoutDataStoreForTests(store);
    await expect(saveSimulationResult({
      userKey: 'account:one', simulationId: 'missing', answers: [],
    })).rejects.toThrow();
    expect(store.writes).toBeLessThanOrEqual(1);
  });
});
