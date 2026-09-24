import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { buildQualificationLensModel } from '@/lib/qualification-lens';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

const NOW = new Date('2026-09-23T00:00:00.000Z');

function evidence(status: 'current' | 'needs-confirmation' | 'unknown' | 'conflicting' = 'current') {
  return {
    status,
    authority: 'provider-official' as const,
    sourceLabel: 'Official programme admissions page',
    sourceUrl: 'https://example.edu/admissions',
    sourceDate: { state: 'documented' as const, value: '2026-09-20' },
    reviewedAt: '2026-09-21',
    verificationAction: 'Review the official admissions page before making a decision.',
  };
}

function record(id: string): CataloguePublishedRecord {
  const fact = <Value,>(value: Value) => ({ value, evidence: evidence() });
  return {
    id,
    revision: 1,
    title: 'Example welding programme',
    regionId: 'greater-houston',
    region: {
      id: 'greater-houston', label: 'Greater Houston',
      officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-21' },
      localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-21' },
    },
    source: { sourceLabel: 'Official programme page', sourceUrl: 'https://example.edu/programme', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-21' },
    facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school' as const), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person' as const) },
    claimBoundary: 'Factual programme details from the official source.',
    publishedRequirements: [{
      text: 'A high school diploma or equivalent is required.',
      qualificationKeys: ['diploma-credits'],
      evidence: evidence(),
    }],
    reviewedDescription: {
      value: 'Hands-on welding instruction for entry-level learners.',
      evidence: evidence(),
    },
    documentedSupport: {
      value: 'Career advising is available through the student support office.',
      evidence: evidence(),
    },
    mediaFallback: false,
  };
}

describe('qualification lens', () => {
  it('keeps a checked published requirement and its reviewed source evidence adjacent', () => {
    const [item] = buildCatalogueDiscoveryModel({
      records: [record('catalogue:welding')],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    const model = buildQualificationLensModel([item], {
      structured: ['diploma-credits'],
      keywords: [],
    });

    expect(model.items).toEqual([expect.objectContaining({
      item: expect.objectContaining({ id: 'catalogue:welding' }),
      explanation: expect.objectContaining({
        checkedRequirements: [expect.objectContaining({
          label: 'Checked published requirement',
          text: 'A high school diploma or equivalent is required.',
          evidence: expect.objectContaining({
            sourceUrl: 'https://example.edu/admissions',
            verificationAction: 'Review the official admissions page before making a decision.',
          }),
        })],
      }),
    })]);
  });

  it('names a literal keyword connection separately from a checked requirement', () => {
    const [item] = buildCatalogueDiscoveryModel({
      records: [record('catalogue:welding')],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    const model = buildQualificationLensModel([item], {
      structured: [],
      keywords: ['welding'],
    });

    expect(model.items[0].explanation).toMatchObject({
      checkedRequirements: [],
      keywordConnections: [expect.objectContaining({
        label: 'Keyword connection',
        keyword: 'welding',
        text: 'Hands-on welding instruction for entry-level learners.',
      })],
    });
  });
});
