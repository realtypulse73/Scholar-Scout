import {
  CATALOGUE_CHECKLIST_CATEGORIES,
  CATALOGUE_CHECKLIST_DISCLOSURE,
  evaluateCatalogueChecklist,
  isCataloguePublicationState,
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
      media: { url: 'https://example.edu/video', alt: 'Student workshop' },
      mediaRights: mediaRights as never,
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
