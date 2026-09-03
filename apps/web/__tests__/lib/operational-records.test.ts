import {
  appendOperationalRecord,
  applyOperationalReplacement,
  listPendingReviewCampusNotes,
  OPERATIONAL_MUTATION_POLICIES,
  removePendingReviewCampusNote,
  reportCampusNoteForReview,
  restorePendingReviewCampusNote,
} from '@/lib/server/operational-records';
import {
  getCampusNotes,
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

class ConflictStore implements ScholarScoutDataStore {
  data = clone(initialData);
  version = 0;
  writes = 0;
  conflictsRemaining = 0;
  onConflict?: (data: ScholarScoutData) => void;

  async read() { return clone(this.data); }
  async write(data: ScholarScoutData) { this.data = clone(data); this.version += 1; }
  async readVersioned() { return { data: clone(this.data), version: String(this.version) }; }
  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    this.writes += 1;
    if (this.conflictsRemaining > 0) {
      this.conflictsRemaining -= 1;
      this.onConflict?.(this.data);
      this.version += 1;
      return { status: 'conflict' as const };
    }
    if (expectedVersion !== String(this.version)) return { status: 'conflict' as const };
    await this.write(data);
    return { status: 'applied' as const, version: String(this.version) };
  }
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

describe('bounded operational records', () => {
  afterEach(() => setScholarScoutDataStoreForTests(null));

  it('retries an allowlisted stable-ID append exactly once and preserves an interleaved event', async () => {
    const store = new ConflictStore();
    store.conflictsRemaining = 1;
    store.onConflict = (data) => {
      data.privilegedOperationAuditEvents = [{
        id: 'interleaved', actorId: 'staff-2', action: 'read', route: '/admin',
        outcome: 'allowed', createdAt: '2026-08-29T00:00:00.000Z',
      }];
    };
    setScholarScoutDataStoreForTests(store);

    await appendOperationalRecord({
      policy: OPERATIONAL_MUTATION_POLICIES.privilegedAuditAppend,
      collection: 'privilegedOperationAuditEvents',
      record: {
        id: 'stable-event', actorId: 'staff-1', action: 'write', route: '/admin',
        outcome: 'allowed', createdAt: '2026-08-29T00:00:01.000Z',
      },
    });

    expect(store.writes).toBe(2);
    expect(store.data.privilegedOperationAuditEvents?.map(({ id }) => id)).toEqual([
      'interleaved', 'stable-event',
    ]);
  });

  it('keeps the retry allowlist explicit and all replacement families denylisted', () => {
    expect([
      OPERATIONAL_MUTATION_POLICIES.privilegedAuditAppend,
      OPERATIONAL_MUTATION_POLICIES.recoveryLifecycleAppend,
      OPERATIONAL_MUTATION_POLICIES.recoveryOutcomeAppend,
      OPERATIONAL_MUTATION_POLICIES.feedInteractionAppend,
      OPERATIONAL_MUTATION_POLICIES.analyticsAppend,
      OPERATIONAL_MUTATION_POLICIES.referralAppend,
      OPERATIONAL_MUTATION_POLICIES.shareAppend,
    ].every((policy) => policy.retry === 'stable-id-append-once')).toBe(true);
    expect([
      OPERATIONAL_MUTATION_POLICIES.guestLifecycleRegistration,
      OPERATIONAL_MUTATION_POLICIES.guestMigration,
      OPERATIONAL_MUTATION_POLICIES.incidentHoldReplacement,
      OPERATIONAL_MUTATION_POLICIES.communityMutation,
      OPERATIONAL_MUTATION_POLICIES.outcomeMetricsReplacement,
      OPERATIONAL_MUTATION_POLICIES.simulationReplacement,
      OPERATIONAL_MUTATION_POLICIES.memoryReplacement,
      OPERATIONAL_MUTATION_POLICIES.decisionReplacement,
    ].every((policy) => policy.retry === 'never')).toBe(true);
  });

  it('stops an allowlisted append after two conflicting attempts', async () => {
    const store = new ConflictStore();
    store.conflictsRemaining = 2;
    setScholarScoutDataStoreForTests(store);
    await expect(appendOperationalRecord({
      policy: OPERATIONAL_MUTATION_POLICIES.recoveryLifecycleAppend,
      collection: 'recoveryLifecycleEvents',
      record: { id: 'recovery-event' },
    })).rejects.toMatchObject({ name: 'PersistenceConflictError' });
    expect(store.writes).toBe(2);
  });

  it('makes a duplicate stable event a no-op', async () => {
    const store = new ConflictStore();
    store.data.privilegedOperationAuditEvents = [{
      id: 'stable-event', actorId: 'staff-1', action: 'write', route: '/admin',
      outcome: 'allowed', createdAt: '2026-08-29T00:00:01.000Z',
    }];
    setScholarScoutDataStoreForTests(store);

    await appendOperationalRecord({
      policy: OPERATIONAL_MUTATION_POLICIES.privilegedAuditAppend,
      collection: 'privilegedOperationAuditEvents',
      record: store.data.privilegedOperationAuditEvents[0],
    });

    expect(store.data.privilegedOperationAuditEvents).toHaveLength(1);
    expect(store.writes).toBe(0);
  });

  it('never retries a replacement conflict', async () => {
    const store = new ConflictStore();
    store.conflictsRemaining = 1;
    setScholarScoutDataStoreForTests(store);

    await expect(applyOperationalReplacement(
      OPERATIONAL_MUTATION_POLICIES.incidentHoldReplacement,
      (data) => { data.auditEvents = []; return undefined; },
    )).rejects.toMatchObject({ name: 'PersistenceConflictError' });
    expect(store.writes).toBe(1);
  });

  it('rejects retry policy use without a stable record ID', async () => {
    const store = new ConflictStore();
    setScholarScoutDataStoreForTests(store);
    await expect(appendOperationalRecord({
      policy: OPERATIONAL_MUTATION_POLICIES.analyticsAppend,
      collection: 'auditEvents',
      record: { userId: 'student' } as never,
    })).rejects.toThrow('stable event ID');
  });

  it('hides a reported note immediately and creates one identity-safe review item', async () => {
    const store = new ConflictStore();
    store.data.campusNotes = [campusNote('public') as never];
    setScholarScoutDataStoreForTests(store);

    await expect(reportCampusNoteForReview({ noteId: 'public', reporterId: 'student-2' }))
      .resolves.toMatchObject({ status: 'reported' });
    await expect(reportCampusNoteForReview({ noteId: 'public', reporterId: 'student-3' }))
      .resolves.toMatchObject({ status: 'reported' });

    await expect(getCampusNotes('buffalo-state')).resolves.toEqual([]);
    expect(store.data.campusNoteReviews).toHaveLength(1);
    await expect(listPendingReviewCampusNotes()).resolves.toEqual([
      expect.objectContaining({ noteId: 'public', excerpt: 'A safe public note.' }),
    ]);
    expect(JSON.stringify(await listPendingReviewCampusNotes())).not.toMatch(
      /student-1|student-2|student-3|author_id|reporter/i,
    );
  });

  it('retries a report after a competing publication write and keeps the stable note out of public reads', async () => {
    const store = new ConflictStore();
    store.data.campusNotes = [campusNote('race-note') as never];
    store.conflictsRemaining = 1;
    store.onConflict = (data) => {
      data.campusNotes = [{ ...campusNote('race-note'), body: 'Published while report retried.' }] as never;
    };
    setScholarScoutDataStoreForTests(store);

    await expect(reportCampusNoteForReview({ noteId: 'race-note', reporterId: 'student-2' }))
      .resolves.toMatchObject({ status: 'reported' });

    expect(store.writes).toBe(2);
    await expect(getCampusNotes('buffalo-state')).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'race-note' })]),
    );
  });

  it('permits staff resolution only from pending review and never republishes a removed note', async () => {
    const store = new ConflictStore();
    store.data.campusNotes = [campusNote('resolution-note') as never];
    setScholarScoutDataStoreForTests(store);

    await reportCampusNoteForReview({ noteId: 'resolution-note', reporterId: 'student-2' });
    await expect(restorePendingReviewCampusNote('resolution-note')).resolves.toMatchObject({ status: 'restored' });
    await expect(removePendingReviewCampusNote('resolution-note')).resolves.toMatchObject({ status: 'conflict' });
    await reportCampusNoteForReview({ noteId: 'resolution-note', reporterId: 'student-2' });
    await expect(removePendingReviewCampusNote('resolution-note')).resolves.toMatchObject({ status: 'removed' });
    await expect(restorePendingReviewCampusNote('resolution-note')).resolves.toMatchObject({ status: 'conflict' });
    await expect(getCampusNotes('buffalo-state')).resolves.toEqual([]);
  });
});

function campusNote(id: string) {
  return {
    id,
    author_id: 'student-1',
    school_slug: 'buffalo-state',
    uploader_username: null,
    program_id: null,
    body: 'A safe public note.',
    created_at: '2026-08-29T00:00:00.000Z',
    status: 'public' as const,
  };
}
