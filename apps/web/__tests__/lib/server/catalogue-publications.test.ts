import {
  CatalogueCandidateReviewError,
  CataloguePublicationConflictError,
  getCatalogueCandidateHistory,
  importCatalogueCandidates,
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
