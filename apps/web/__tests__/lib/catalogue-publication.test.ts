import {
  CATALOGUE_CHECKLIST_CATEGORIES,
  CATALOGUE_CHECKLIST_DISCLOSURE,
  evaluateCatalogueChecklist,
  getCatalogueSnapshotDigest,
  getWeeklyReleasePeriodKey,
  isWithinNormalWeeklyReleaseWindow,
  isCataloguePublicationState,
  parseCatalogueCandidateImport,
  resolveRenderableMedia,
  type CatalogueCandidateInput,
} from '@/lib/catalogue-publication';
import type { FactEvidence } from '@/lib/catalogue-contract';

const now = new Date('2026-09-22T12:00:00.000Z');

function evidence(): FactEvidence {
  return {
    status: 'current',
    authority: 'provider-official',
    sourceLabel: 'Official programme page',
    sourceUrl: 'https://example.edu/programme',
    sourceDate: { state: 'documented', value: '2026-09-20' },
    reviewedAt: '2026-09-21',
    verificationAction: 'Review the official programme page before publication.',
  };
}

const validCandidate: CatalogueCandidateInput = {
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
  mediaCandidates: [{
    kind: 'local-preview',
    assetPath: '/media/training-workshop.mp4',
    alt: 'A reviewed training workshop.',
    label: 'Provider-approved media',
    sourceLabel: 'Provider media approval',
    sourceUrl: 'https://example.edu/media-approval',
    rights: { kind: 'provider-approved', sourceUrl: 'https://example.edu/media-approval', status: 'valid' },
    reviewedAt: '2026-09-20',
  }],
};

describe('catalogue publication editorial checklist', () => {
  it('returns the ordered six-category completeness summary and disclosure', () => {
    const result = evaluateCatalogueChecklist(validCandidate, now);

    expect(result).toMatchObject({
      passed: true,
      correctionCodes: [],
      disclosure: CATALOGUE_CHECKLIST_DISCLOSURE,
      mediaFallback: false,
    });
    expect(result.summary).toEqual(CATALOGUE_CHECKLIST_CATEGORIES.map((category) => ({
      category,
      status: 'passed',
    })));
  });

  it('returns stable source, evidence, freshness, claim, and region corrections', () => {
    const result = evaluateCatalogueChecklist({
      ...validCandidate,
      source: {
        ...validCandidate.source!,
        sourceDate: { state: 'documented', value: '2024-01-01' },
      },
      facts: {},
      claimBoundary: 'This guarantees eligibility.',
      regionId: 'greater-chicago',
    }, now);

    expect(result.passed).toBe(false);
    expect(result.correctionCodes).toEqual([
      'material-evidence',
      'freshness',
      'claim-boundary',
      'regional-boundary',
    ]);
  });

  it.each([
    ['expired', { kind: 'licensed', sourceUrl: 'https://example.edu/licence', expiresAt: '2026-09-21' }],
    ['revoked', { kind: 'provider-approved', sourceUrl: 'https://example.edu/media', status: 'revoked' }],
    ['uncertain', { kind: 'approved-embed', sourceUrl: 'https://example.edu/embed', status: 'uncertain' }],
  ])('uses factual text-and-source fallback for %s media rights', (_, mediaRights) => {
    const result = evaluateCatalogueChecklist({
      ...validCandidate,
      mediaCandidates: [{
        ...validCandidate.mediaCandidates![0],
        rights: mediaRights as never,
      }],
    }, now);

    expect(result.passed).toBe(true);
    expect(result.mediaFallback).toBe(true);
    expect(result.summary.at(-1)).toEqual({ category: 'media-rights', status: 'fallback' });
  });

  it('rejects persisted audit records that include a private or secret field', () => {
    expect(isCataloguePublicationState({
      schemaVersion: 1,
      candidates: [],
      auditEvents: [{
        actorId: 'staff-1',
        capability: 'editor',
        action: 'stage',
        timestamp: '2026-09-22T12:00:00.000Z',
        outcome: 'passed-checklist',
        version: 1,
        correctionCodes: [],
        reviewStatus: 'draft',
        secret: 'must-not-persist',
      }],
    })).toBe(false);
  });
});

describe('reviewed media projection', () => {
  const originalGenericIllustration = {
    kind: 'illustration',
    assetPath: '/images/learning-environment.png',
    alt: 'A Scholar Scout illustrative learning environment.',
    label: 'Illustration',
    sourceLabel: 'Scholar Scout illustration record',
    sourceUrl: 'https://example.edu/illustration-record',
    rights: { kind: 'scholarscout-owned', sourceUrl: 'https://example.edu/illustration-record', status: 'valid' },
    reviewedAt: '2026-09-20',
    illustration: {
      classification: 'original-generic-learning-environment',
      accessibleDescription: 'A Scholar Scout illustrative learning environment.',
      disclosure: 'AI-generated illustration — not an official campus photograph',
      representation: 'generic-learning-environment',
      identityClaim: 'none',
      sourceCategory: 'original-scholarscout',
      referenceCategory: 'none',
      depictsRealCampus: false,
    },
  } as const;

  it('uses D-03 order and returns only the fixed-disclosure original generic illustration', () => {
    const result = resolveRenderableMedia([
      {
        kind: 'approved-embed', embedUrl: 'https://example.edu/embed', alt: 'Provider embed', label: 'Provider-approved embed', sourceLabel: 'Embed approval', sourceUrl: 'https://example.edu/embed-approval', rights: { kind: 'approved-embed', sourceUrl: 'https://example.edu/embed-approval', status: 'valid' }, reviewedAt: '2026-09-20',
      },
      originalGenericIllustration,
    ], now);

    expect(result).toEqual({
      renderableMedia: {
        kind: 'illustration',
        label: 'Scholar Scout illustration',
        assetPath: '/images/learning-environment.png',
        alt: 'A Scholar Scout illustrative learning environment.',
        disclosure: 'AI-generated illustration — not an official campus photograph',
      },
      mediaFallback: false,
    });
    expect(Object.keys(result.renderableMedia ?? []).sort()).toEqual([
      'alt', 'assetPath', 'disclosure', 'kind', 'label',
    ]);
  });

  it.each([
    ['missing classification', { illustration: undefined }],
    ['missing accessible description', { illustration: { ...originalGenericIllustration.illustration, accessibleDescription: '' } }],
    ['wrong disclosure', { illustration: { ...originalGenericIllustration.illustration, disclosure: 'Illustration' } }],
    ['named school representation', { illustration: { ...originalGenericIllustration.illustration, representation: 'named-school' } }],
    ['endorsement identity claim', { illustration: { ...originalGenericIllustration.illustration, identityClaim: 'endorsed-provider' } }],
    ['unapproved source category', { illustration: { ...originalGenericIllustration.illustration, sourceCategory: 'provider-media' } }],
    ['unapproved reference category', { illustration: { ...originalGenericIllustration.illustration, referenceCategory: 'street-view' } }],
    ['real campus likeness', { illustration: { ...originalGenericIllustration.illustration, depictsRealCampus: true } }],
  ])('falls back when illustration evidence has %s', (_, change) => {
    expect(resolveRenderableMedia([{ ...originalGenericIllustration, ...change }] as never, now)).toEqual({ mediaFallback: true });
  });

  it.each([
    ['absent candidates', undefined],
    ['remote-only local candidate', [{ ...validCandidate.mediaCandidates![0], assetPath: 'https://example.edu/media.mp4' }]],
    ['unknown rights', [{ ...validCandidate.mediaCandidates![0], rights: { ...validCandidate.mediaCandidates![0].rights, status: undefined } }]],
    ['expired rights', [{ ...validCandidate.mediaCandidates![0], rights: { ...validCandidate.mediaCandidates![0].rights, expiresAt: '2026-09-21' } }]],
  ])('fails closed for %s', (_, candidates) => {
    expect(resolveRenderableMedia(candidates as typeof validCandidate.mediaCandidates, now)).toEqual({ mediaFallback: true });
  });

  it.each([
    ['revoked rights', { rights: { ...validCandidate.mediaCandidates![0].rights, status: 'revoked' } }],
    ['uncertain rights', { rights: { ...validCandidate.mediaCandidates![0].rights, status: 'uncertain' } }],
    ['missing alternative text', { alt: '' }],
    ['missing source label', { sourceLabel: '' }],
    ['missing source URL', { sourceUrl: undefined }],
    ['malformed review date', { reviewedAt: 'not-a-date' }],
    ['stale review', { reviewedAt: '2026-03-22' }],
    ['prohibited traversal path', { assetPath: '/media/../private.mp4' }],
    ['unsupported local path', { assetPath: '/private/training.mp4' }],
  ])('fails closed when local candidate evidence is %s', (_, change) => {
    const candidate = { ...validCandidate.mediaCandidates![0], ...change };
    expect(resolveRenderableMedia([candidate] as never, now)).toEqual({ mediaFallback: true });
  });

  it('prefers an eligible local preview over deferred embeds and illustrations', () => {
    const local = validCandidate.mediaCandidates![0];
    const result = resolveRenderableMedia([
      {
        kind: 'approved-embed',
        embedUrl: 'https://example.edu/embed',
        alt: 'Provider embed',
        label: 'Provider-approved embed',
        sourceLabel: 'Embed approval',
        sourceUrl: 'https://example.edu/embed-approval',
        rights: { kind: 'approved-embed', sourceUrl: 'https://example.edu/embed-approval', status: 'valid' },
        reviewedAt: '2026-09-20',
      },
      originalGenericIllustration,
      local,
    ], now);

    expect(result).toEqual({
      renderableMedia: expect.objectContaining({
        kind: 'local-preview',
        assetPath: '/media/training-workshop.mp4',
        sourceUrl: 'https://example.edu/media-approval',
      }),
      mediaFallback: false,
    });
    expect(result.renderableMedia).not.toHaveProperty('embedUrl');
  });
});

describe('weekly catalogue release schedule', () => {
  it('uses America/New_York Monday 09:00 inclusive through 17:00 exclusive', () => {
    expect(isWithinNormalWeeklyReleaseWindow(new Date('2026-09-21T13:00:00.000Z'))).toBe(true);
    expect(isWithinNormalWeeklyReleaseWindow(new Date('2026-09-21T21:00:00.000Z'))).toBe(false);
    expect(isWithinNormalWeeklyReleaseWindow(new Date('2026-09-20T13:00:00.000Z'))).toBe(false);
  });

  it('derives a stable ISO period from the New York calendar date across DST and year boundaries', () => {
    expect(getWeeklyReleasePeriodKey(new Date('2026-03-09T13:00:00.000Z'))).toBe('2026-W11');
    expect(getWeeklyReleasePeriodKey(new Date('2027-01-04T14:00:00.000Z'))).toBe('2027-W01');
  });
});

describe('catalogue candidate import envelope', () => {
  it('accepts ordered source-backed qualification requirements and reviewed statements', () => {
    const requirementEvidence = evidence();
    const result = parseCatalogueCandidateImport({
      schemaVersion: 1,
      changes: [{
        action: 'upsert',
        candidate: {
          ...validCandidate,
          publishedRequirements: [{
            text: 'A high school diploma or equivalent is required.',
            qualificationKeys: ['diploma-credits'],
            evidence: requirementEvidence,
          }],
          reviewedDescription: {
            value: 'Hands-on welding instruction for entry-level learners.',
            evidence: requirementEvidence,
          },
          documentedSupport: {
            value: 'Career advising is available through the student support office.',
            evidence: requirementEvidence,
          },
        },
      }],
    });

    expect(result).toEqual({
      ok: true,
      changes: [expect.objectContaining({
        action: 'upsert',
        candidate: expect.objectContaining({
          publishedRequirements: [{
            text: 'A high school diploma or equivalent is required.',
            qualificationKeys: ['diploma-credits'],
            evidence: requirementEvidence,
          }],
          reviewedDescription: expect.objectContaining({ evidence: requirementEvidence }),
          documentedSupport: expect.objectContaining({ evidence: requirementEvidence }),
        }),
      })],
    });
  });

  it.each([
    ['blank requirement text', {
      publishedRequirements: [{
        text: ' ',
        qualificationKeys: ['diploma-credits'],
        evidence: evidence(),
      }],
    }],
    ['unapproved qualification key', {
      publishedRequirements: [{
        text: 'A high school diploma or equivalent is required.',
        qualificationKeys: ['gpa'],
        evidence: evidence(),
      }],
    }],
    ['missing requirement evidence', {
      publishedRequirements: [{
        text: 'A high school diploma or equivalent is required.',
        qualificationKeys: ['diploma-credits'],
      }],
    }],
    ['missing support evidence', {
      documentedSupport: {
        value: 'Career advising is available through the student support office.',
      },
    }],
  ])('rejects an import with %s atomically', (_, candidateEvidence) => {
    expect(parseCatalogueCandidateImport({
      schemaVersion: 1,
      changes: [{
        action: 'upsert',
        candidate: { ...validCandidate, ...candidateEvidence },
      }],
    })).toEqual({ ok: false, correctionCodes: ['invalid-import'] });
  });

  it('preserves a non-current sourced requirement for later learner verification', () => {
    const result = parseCatalogueCandidateImport({
      schemaVersion: 1,
      changes: [{
        action: 'upsert',
        candidate: {
          ...validCandidate,
          publishedRequirements: [{
            text: 'A high school diploma or equivalent is required.',
            qualificationKeys: ['diploma-credits'],
            evidence: { ...evidence(), status: 'needs-confirmation' },
          }],
        },
      }],
    });

    expect(result).toEqual(expect.objectContaining({ ok: true }));
  });

  it('accepts one through twenty-five unique, schema-versioned changes', () => {
    const result = parseCatalogueCandidateImport({
      schemaVersion: 1,
      changes: Array.from({ length: 25 }, (_, index) => ({
        action: 'upsert',
        candidate: { ...validCandidate, id: `catalogue:training-${index}` },
      })),
    });

    expect(result).toEqual({
      ok: true,
      changes: expect.arrayContaining([
        expect.objectContaining({ action: 'upsert', id: 'catalogue:training-0' }),
      ]),
    });
  });

  it.each([
    ['unsupported schema', { schemaVersion: 2, changes: [] }],
    ['twenty-sixth change', {
      schemaVersion: 1,
      changes: Array.from({ length: 26 }, (_, index) => ({
        action: 'upsert',
        candidate: { ...validCandidate, id: `catalogue:too-many-${index}` },
      })),
    }],
    ['duplicate stable id', {
      schemaVersion: 1,
      changes: [
        { action: 'upsert', candidate: validCandidate },
        { action: 'upsert', candidate: validCandidate },
      ],
    }],
    ['unsupported action', {
      schemaVersion: 1,
      changes: [{ action: 'publish', candidate: validCandidate }],
    }],
    ['incomplete candidate', {
      schemaVersion: 1,
      changes: [{ action: 'upsert', candidate: { id: validCandidate.id } }],
    }],
    ['oversized value', {
      schemaVersion: 1,
      changes: [{
        action: 'upsert',
        candidate: { ...validCandidate, title: 'x'.repeat(4_001) },
      }],
    }],
    ['deep value', {
      schemaVersion: 1,
      changes: [{
        action: 'upsert',
        candidate: { ...validCandidate, facts: deeplyNestedFacts() },
      }],
    }],
  ])('returns safe correction feedback for %s', (_, envelope) => {
    expect(parseCatalogueCandidateImport(envelope)).toEqual({
      ok: false,
      correctionCodes: expect.arrayContaining(['invalid-import']),
    });
  });
});

function deeplyNestedFacts(): Record<string, unknown> {
  let value: Record<string, unknown> = {};
  for (let index = 0; index < 33; index += 1) value = { value };
  return value;
}
describe('catalogue publication recovery coherence', () => {
  it('rejects an altered public snapshot digest even when its shallow shape is valid', () => {
    const checklist = evaluateCatalogueChecklist(validCandidate, now);
    const candidate = {
      ...validCandidate,
      creatorId: 'editor-1',
      revision: 1,
      lifecycle: 'approved',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      checklist,
      approval: { reviewerId: 'reviewer-1', reviewedAt: now.toISOString(), revision: 1 },
      retirementIntent: false,
    };
    const record = {
      id: candidate.id,
      revision: candidate.revision,
      title: candidate.title,
      regionId: candidate.regionId,
      region: candidate.region,
      source: candidate.source,
      facts: candidate.facts,
      claimBoundary: candidate.claimBoundary,
      mediaFallback: false,
    };
    const digest = getCatalogueSnapshotDigest([record] as never);
    const state = {
      schemaVersion: 1,
      candidates: [candidate],
      auditEvents: [],
      snapshots: [{
        id: 'catalogue-snapshot-1', sequence: 1, kind: 'weekly',
        releasedAt: now.toISOString(), periodKey: '2026-W39', records: [record], contentDigest: digest,
      }],
      manifests: [{
        id: 'catalogue-manifest-1', snapshotId: 'catalogue-snapshot-1', sequence: 1,
        kind: 'weekly', releasedAt: now.toISOString(), periodKey: '2026-W39',
        actorId: 'administrator-1', capability: 'administrator', action: 'release', outcome: 'published',
        included: [{ id: candidate.id, revision: 1 }], retired: [], quarantined: [], contentDigest: digest,
      }],
      activeSnapshotId: 'catalogue-snapshot-1',
    };

    expect(isCataloguePublicationState({ ...state, snapshots: [], manifests: [], activeSnapshotId: null })).toBe(true);
    expect(isCataloguePublicationState(state)).toBe(true);
    expect(isCataloguePublicationState({
      ...state,
      snapshots: [{ ...state.snapshots[0], contentDigest: 'altered-digest' }],
    })).toBe(false);
    expect(isCataloguePublicationState({
      ...state,
      manifests: [{ ...state.manifests[0], snapshotId: 'missing-snapshot' }],
    })).toBe(false);
    expect(isCataloguePublicationState({ ...state, activeSnapshotId: 'missing-snapshot' })).toBe(false);
    expect(isCataloguePublicationState({
      ...state,
      candidates: [{ ...candidate, checklist: { ...checklist, passed: false } }],
    })).toBe(false);
  });
});
