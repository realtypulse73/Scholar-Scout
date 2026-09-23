import {
  CatalogueCandidateReviewError,
  CataloguePublicationConflictError,
  CatalogueReleaseScheduleError,
  getCatalogueCandidateHistory,
  importCatalogueCandidates,
  publishWeeklyCatalogueSnapshot,
  reviewCatalogueCandidate,
  stageCatalogueCandidate,
} from '@/lib/server/catalogue-publications';
import {
  setScholarScoutDataStoreForTests,
  type ScholarScoutData,
  type ScholarScoutDataStore,
} from '@/lib/server/data-store';

const NOW = new Date('2026-09-22T12:00:00.000Z');
const editor = {
  id: 'editor-1',
  email: 'editor@example.com',
  capabilities: new Set(['editor'] as const),
};
const reviewer = {
  id: 'reviewer-1',
  email: 'reviewer@example.com',
  capabilities: new Set(['reviewer'] as const),
};
const administratorEditor = {
  id: 'administrator-1',
  email: 'administrator@example.com',
  capabilities: new Set(['editor', 'administrator'] as const),
};
const administrator = {
  id: 'administrator-2',
  email: 'administrator-2@example.com',
  capabilities: new Set(['administrator'] as const),
};

const validCandidate = {
  id: 'catalogue:training',
  title: 'Technical training',
  regionId: 'greater-houston',
  region: {
    id: 'greater-houston',
    label: 'Greater Houston',
    officialBoundary: {
      authority: 'us-census-omb-cbsa',
      boundaryId: '26420',
      boundaryVersion: '2023',
      sourceLabel: 'Official boundary',
      sourceUrl: 'https://www.census.gov/example',
      sourceDate: { state: 'documented', value: '2026-09-01' },
      checkedAt: '2026-09-21',
    },
    localFocus: {
      authority: 'City of Houston',
      anchorLabel: 'Houston City Hall',
      latitude: 29.7604,
      longitude: -95.3698,
      radiusMiles: 10,
      sourceLabel: 'Official city page',
      sourceUrl: 'https://www.houstontx.gov',
      sourceDate: { state: 'documented', value: '2026-09-01' },
      checkedAt: '2026-09-21',
    },
  },
  source: {
    sourceLabel: 'Official programme page',
    sourceUrl: 'https://example.edu/programme',
    sourceDate: { state: 'documented', value: '2026-09-20' },
    checkedAt: '2026-09-21',
  },
  facts: {
    location: { value: 'Houston, Texas', evidence: evidence() },
    pathway: { value: 'trade-career-school', evidence: evidence() },
    skillTaught: { value: 'Welding', evidence: evidence() },
    trainingPayer: { value: 'Student', evidence: evidence() },
    costOrTuition: { value: '$500', evidence: evidence() },
    duration: { value: '12 weeks', evidence: evidence() },
    delivery: { value: 'in-person', evidence: evidence() },
  },
  claimBoundary: 'Factual programme details from the official source.',
};

describe('private catalogue candidate staging', () => {
  let store: MemoryDataStore;

  beforeEach(() => {
    store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
  });

  afterEach(() => setScholarScoutDataStoreForTests(null));

  it('stages a bounded import privately and preserves a retire intent', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });

    const result = await importCatalogueCandidates({
      actor: editor,
      envelope: {
        schemaVersion: 1,
        changes: [{
          action: 'retire',
          id: validCandidate.id,
          expectedRevision: 1,
        }],
      },
      now: NOW,
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: validCandidate.id,
        lifecycle: 'draft',
        retirementIntent: true,
        revision: 2,
      }),
    ]);
    expect((await store.read()).cataloguePublicationState).toMatchObject({
      candidates: [expect.objectContaining({ retirementIntent: true })],
    });
  });

  it('rejects a stale candidate revision without an automatic retry or partial write', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });
    const before = await store.read();

    await expect(importCatalogueCandidates({
      actor: editor,
      envelope: {
        schemaVersion: 1,
        changes: [{
          action: 'upsert',
          candidate: { ...validCandidate, title: 'Updated training' },
          expectedRevision: 0,
        }],
      },
      now: NOW,
    })).rejects.toThrow('catalogue-candidate-revision-conflict');

    expect(await store.read()).toEqual(before);
  });

  it('reports a concurrent replacement conflict without retrying', async () => {
    store.conflictNextWrite = true;

    await expect(importCatalogueCandidates({
      actor: editor,
      envelope: {
        schemaVersion: 1,
        changes: [{ action: 'upsert', candidate: validCandidate }],
      },
      now: NOW,
    })).rejects.toBeInstanceOf(CataloguePublicationConflictError);

    expect(store.writeAttempts).toBe(1);
    await expect(store.read()).resolves.toMatchObject({
      cataloguePublicationState: { candidates: [] },
    });
  });

  it('keeps a malformed import from changing an existing private candidate', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });
    const before = await store.read();

    await expect(importCatalogueCandidates({
      actor: editor,
      envelope: { schemaVersion: 1, changes: [{ action: 'publish' }] },
      now: NOW,
    })).rejects.toThrow('catalogue-candidate-import-invalid');

    expect(await store.read()).toEqual(before);
  });

  it('creates a new private revision and clears its prior approval on correction', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });
    await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: validCandidate.id,
      expectedRevision: 1,
      now: NOW,
    });

    const result = await importCatalogueCandidates({
      actor: editor,
      envelope: {
        schemaVersion: 1,
        changes: [{
          action: 'upsert',
          candidate: { ...validCandidate, title: 'Corrected technical training' },
          expectedRevision: 1,
        }],
      },
      now: NOW,
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        revision: 2,
        lifecycle: 'draft',
        approval: null,
        title: 'Corrected technical training',
      }),
    ]);
  });

  it('requires an independent reviewer unless an editor is also an administrator', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });

    await expect(reviewCatalogueCandidate({
      actor: editor,
      candidateId: validCandidate.id,
      expectedRevision: 1,
      now: NOW,
    })).rejects.toBeInstanceOf(CatalogueCandidateReviewError);

    const approved = await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: validCandidate.id,
      expectedRevision: 1,
      now: NOW,
    });
    expect(approved.candidate).toMatchObject({
      lifecycle: 'approved',
      approval: { reviewerId: reviewer.id, revision: 1 },
    });

    await stageCatalogueCandidate({
      actor: administratorEditor,
      candidate: { ...validCandidate, id: 'catalogue:admin-training' },
      now: NOW,
    });
    await expect(reviewCatalogueCandidate({
      actor: administratorEditor,
      candidateId: 'catalogue:admin-training',
      expectedRevision: 1,
      now: NOW,
    })).resolves.toMatchObject({
      candidate: { lifecycle: 'approved', approval: { reviewerId: administratorEditor.id } },
    });
  });

  it('returns a redacted reviewer history with only the six automated categories', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });
    await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: validCandidate.id,
      expectedRevision: 1,
      now: NOW,
    });

    expect(await getCatalogueCandidateHistory(validCandidate.id)).toEqual({
      candidate: {
        id: validCandidate.id,
        lifecycle: 'approved',
        revision: 1,
        correctionCodes: [],
        reviewStatus: 'approved',
        checklist: {
          summary: expect.arrayContaining([
            expect.objectContaining({ category: 'source' }),
            expect.objectContaining({ category: 'media-rights' }),
          ]),
          passMeaning: 'A pass means editorial completeness, not verified real-world provider truth.',
        },
      },
      audit: expect.arrayContaining([
        expect.objectContaining({ action: 'approval', capability: 'reviewer' }),
      ]),
    });
    expect(JSON.stringify(await getCatalogueCandidateHistory(validCandidate.id))).not.toContain('Official programme page');
  });
});

describe('weekly catalogue publication', () => {
  let store: MemoryDataStore;

  beforeEach(() => {
    store = new MemoryDataStore();
    setScholarScoutDataStoreForTests(store);
  });

  afterEach(() => setScholarScoutDataStoreForTests(null));

  it('publishes an approved candidate as one deterministic weekly snapshot', async () => {
    await stageCatalogueCandidate({ actor: editor, candidate: validCandidate, now: NOW });
    await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: validCandidate.id,
      expectedRevision: 1,
      now: NOW,
    });

    const result = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-21T13:00:00.000Z'),
    });

    expect(result.snapshot).toMatchObject({
      kind: 'weekly',
      periodKey: '2026-W39',
      records: [expect.objectContaining({ id: validCandidate.id })],
    });
    expect(result.manifest).toMatchObject({
      kind: 'weekly',
      included: [{ id: validCandidate.id, revision: 1 }],
    });
  });

  it('rejects an out-of-window or duplicate normal release but accepts the next ISO week', async () => {
    await approve(validCandidate);

    await expect(publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-20T13:00:00.000Z'),
    })).rejects.toMatchObject({ code: 'outside-release-window' } satisfies Partial<CatalogueReleaseScheduleError>);

    await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-21T13:00:00.000Z'),
    });

    await expect(publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-21T14:00:00.000Z'),
    })).rejects.toMatchObject({ code: 'weekly-period-already-published' } satisfies Partial<CatalogueReleaseScheduleError>);

    await expect(publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-28T13:00:00.000Z'),
    })).resolves.toMatchObject({ snapshot: { periodKey: '2026-W40' } });
  });

  it('keeps emergency releases separately auditable without consuming a weekly slot', async () => {
    await approve(validCandidate);

    const emergency = await publishWeeklyCatalogueSnapshot({
      actor: reviewer,
      candidateIds: [validCandidate.id],
      kind: 'emergency',
      reason: 'Correct a time-sensitive factual error.',
      now: new Date('2026-09-27T13:00:00.000Z'),
    });
    expect((await store.read()).cataloguePublicationState?.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: validCandidate.id,
        lifecycle: 'approved',
        approval: expect.objectContaining({ revision: 1 }),
      }),
    ]));
    const weekly = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-28T13:00:00.000Z'),
    });

    expect(emergency.manifest).toMatchObject({ kind: 'emergency', reason: 'Correct a time-sensitive factual error.' });
    expect(emergency.snapshot.periodKey).toBeUndefined();
    expect(weekly.manifest).toMatchObject({ kind: 'weekly', periodKey: '2026-W40' });
  });

  it('sorts equivalent selected records by stable ID regardless of input order', async () => {
    const earlier = { ...validCandidate, id: 'catalogue:a-training', title: 'A training' };
    const later = { ...validCandidate, id: 'catalogue:z-training', title: 'Z training' };
    await approve(earlier);
    await approve(later);

    const result = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [later.id, earlier.id],
      now: new Date('2026-09-21T13:00:00.000Z'),
    });

    expect(result.snapshot.records.map((record) => record.id)).toEqual([earlier.id, later.id]);
    expect(result.manifest.included.map((record) => record.id)).toEqual([earlier.id, later.id]);
    expect(result.snapshot.contentDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('quarantines only a stale final recheck and continues publishing an unaffected candidate', async () => {
    const stale = {
      ...validCandidate,
      id: 'catalogue:stale-training',
      source: { ...validCandidate.source, sourceDate: { state: 'documented' as const, value: '2026-09-20' } },
    };
    const releaseNow = new Date('2027-04-05T13:00:00.000Z');
    const current = {
      ...validCandidate,
      id: 'catalogue:current-training',
      source: {
        ...validCandidate.source,
        sourceDate: { state: 'documented' as const, value: '2027-04-01' },
        checkedAt: '2027-04-01',
      },
      facts: Object.fromEntries(Object.entries(validCandidate.facts).map(([key, fact]) => [key, {
        ...fact,
        evidence: {
          ...fact.evidence,
          sourceDate: { state: 'documented' as const, value: '2027-04-01' },
          reviewedAt: '2027-04-01',
        },
      }])) as typeof validCandidate.facts,
    };
    await approve(stale);
    await approve(current, releaseNow);

    const result = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [stale.id, current.id],
      now: releaseNow,
    });

    expect(result.snapshot.records).toEqual([expect.objectContaining({ id: current.id })]);
    expect(result.quarantined).toEqual([{
      id: stale.id,
      revision: 1,
      correctionCodes: ['material-evidence', 'freshness'],
    }]);
    expect((await store.read()).cataloguePublicationState?.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: stale.id, lifecycle: 'quarantined', approval: null }),
    ]));
  });

  it('removes an approved retirement only from the new active snapshot and preserves the prior version', async () => {
    await approve(validCandidate);
    const first = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-21T13:00:00.000Z'),
    });
    await importCatalogueCandidates({
      actor: editor,
      envelope: {
        schemaVersion: 1,
        changes: [{ action: 'retire', id: validCandidate.id, expectedRevision: 1 }],
      },
      now: new Date('2026-09-22T12:00:00.000Z'),
    });
    await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: validCandidate.id,
      expectedRevision: 2,
      now: new Date('2026-09-22T12:00:00.000Z'),
    });

    const retired = await publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-28T13:00:00.000Z'),
    });
    const state = (await store.read()).cataloguePublicationState!;

    expect(retired.snapshot.records).toEqual([]);
    expect(retired.manifest.retired).toEqual([{ id: validCandidate.id, revision: 2 }]);
    expect(state.snapshots?.find((snapshot) => snapshot.id === first.snapshot.id)?.records).toEqual([
      expect.objectContaining({ id: validCandidate.id }),
    ]);
  });

  it('reports a conditional-write release conflict without retrying', async () => {
    await approve(validCandidate);
    store.conflictNextWrite = true;

    await expect(publishWeeklyCatalogueSnapshot({
      actor: administrator,
      candidateIds: [validCandidate.id],
      now: new Date('2026-09-21T13:00:00.000Z'),
    })).rejects.toBeInstanceOf(CataloguePublicationConflictError);
    expect(store.writeAttempts).toBe(3);
  });

  async function approve(candidate: typeof validCandidate, now = NOW) {
    await stageCatalogueCandidate({ actor: editor, candidate, now });
    await reviewCatalogueCandidate({
      actor: reviewer,
      candidateId: candidate.id,
      expectedRevision: 1,
      now,
    });
  }
});

function evidence() {
  return {
    status: 'current' as const,
    authority: 'provider-official' as const,
    sourceLabel: 'Official programme page',
    sourceUrl: 'https://example.edu/programme',
    sourceDate: { state: 'documented' as const, value: '2026-09-20' },
    reviewedAt: '2026-09-21',
    verificationAction: 'Review the official programme page before publication.',
  };
}

class MemoryDataStore implements ScholarScoutDataStore {
  private data: ScholarScoutData = {
    users: [],
    onboardingProfiles: {},
    shortlists: {},
    programmeRecords: [],
    auditEvents: [],
    cataloguePublicationState: {
      schemaVersion: 1,
      candidates: [],
      auditEvents: [],
    },
  };
  private version = 'memory-0';
  conflictNextWrite = false;
  writeAttempts = 0;

  async read() { return clone(this.data); }
  async write(data: ScholarScoutData) { this.data = clone(data); }
  async readVersioned() { return { data: clone(this.data), version: this.version }; }
  async writeVersioned(data: ScholarScoutData, expectedVersion: string | null) {
    this.writeAttempts += 1;
    if (this.conflictNextWrite || expectedVersion !== this.version) {
      this.conflictNextWrite = false;
      return { status: 'conflict' as const };
    }
    this.data = clone(data);
    this.version = `memory-${Number(this.version.split('-')[1]) + 1}`;
    return { status: 'applied' as const, version: this.version };
  }
}

function clone(data: ScholarScoutData): ScholarScoutData {
  return JSON.parse(JSON.stringify(data)) as ScholarScoutData;
}
