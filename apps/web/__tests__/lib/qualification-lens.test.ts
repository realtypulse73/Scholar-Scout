import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { buildQualificationLensModel, orderQualificationsFirst } from '@/lib/qualification-lens';
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

  it('orders only the existing discovery items by checked count, then keyword connection, then public ID', () => {
    const checked = record('catalogue:checked');
    const keywordOnly = record('catalogue:keyword');
    keywordOnly.publishedRequirements = [];
    const noConnection = record('catalogue:explore');
    noConnection.publishedRequirements = [];
    noConnection.reviewedDescription = {
      value: 'Hands-on fabrication instruction for entry-level learners.',
      evidence: evidence(),
    };
    const items = buildCatalogueDiscoveryModel({
      records: [noConnection, keywordOnly, checked],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;
    const model = buildQualificationLensModel(items, {
      structured: ['diploma-credits'],
      keywords: ['welding'],
    });

    const ordered = orderQualificationsFirst(model.items);

    expect(ordered.map((entry) => entry.item.id)).toEqual([
      'catalogue:checked',
      'catalogue:keyword',
      'catalogue:explore',
    ]);
    expect(ordered).toHaveLength(model.items.length);
    expect(new Set(ordered.map((entry) => entry.item.id))).toEqual(new Set(model.items.map((entry) => entry.item.id)));
  });

  it('keeps non-current requirements as source-backed verification work without changing the connection count', () => {
    const reviewed = record('catalogue:verify');
    reviewed.publishedRequirements = [{
      text: 'A high school diploma or equivalent is required.',
      qualificationKeys: ['diploma-credits'],
      evidence: evidence('needs-confirmation'),
    }];
    const [item] = buildCatalogueDiscoveryModel({
      records: [reviewed],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    const model = buildQualificationLensModel([item], {
      structured: ['diploma-credits'],
      keywords: [],
    });

    expect(model.items[0].explanation).toEqual(expect.objectContaining({
      checkedRequirements: [],
      verificationRows: [expect.objectContaining({
        label: 'Needs verification',
        state: 'needs-confirmation',
        sourceDate: '2026-09-20',
        evidence: expect.objectContaining({
          verificationAction: 'Review the official admissions page before making a decision.',
        }),
      })],
    }));
  });

  it('requires literal whole-token keywords and rejects private or proxy-shaped inputs', () => {
    const [item] = buildCatalogueDiscoveryModel({
      records: [record('catalogue:tokens')],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    expect(buildQualificationLensModel([item], {
      structured: [],
      keywords: ['weld'],
    }).items[0].explanation.keywordConnections).toEqual([]);
    expect(() => buildQualificationLensModel([item], {
      structured: [],
      keywords: [],
      note: 'Private note that must never reach the lens.',
    } as unknown as { structured: []; keywords: [] })).toThrow('qualification-lens-input-invalid');
    expect(() => buildQualificationLensModel([item], {
      structured: [],
      keywords: [],
      gpa: '4.0',
    } as unknown as { structured: []; keywords: [] })).toThrow('qualification-lens-input-invalid');
  });

  it('shows documented support only when the record does not have a checked requirement', () => {
    const [item] = buildCatalogueDiscoveryModel({
      records: [record('catalogue:support')],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    const checked = buildQualificationLensModel([item], {
      structured: ['diploma-credits'],
      keywords: [],
    });
    const unchecked = buildQualificationLensModel([item], {
      structured: [],
      keywords: [],
    });

    expect(checked.items[0].explanation).not.toHaveProperty('documentedSupport');
    expect(unchecked.items[0].explanation).toMatchObject({
      documentedSupport: {
        label: 'Documented support',
        text: 'Career advising is available through the student support office.',
        sourceDate: '2026-09-20',
        evidence: expect.objectContaining({
          sourceUrl: 'https://example.edu/admissions',
          verificationAction: 'Review the official admissions page before making a decision.',
        }),
      },
    });
  });

  it('keeps the explanation factual when documented support is absent or uncertain', () => {
    const unavailable = record('catalogue:no-support');
    unavailable.documentedSupport = undefined;
    const uncertain = record('catalogue:uncertain-support');
    uncertain.documentedSupport = {
      value: 'Career advising is available through the student support office.',
      evidence: evidence('needs-confirmation'),
    };
    const items = buildCatalogueDiscoveryModel({
      records: [unavailable, uncertain],
      searchParams: { metro: 'greater-houston' },
      now: NOW,
    }).items;

    const model = buildQualificationLensModel(items, {
      structured: [],
      keywords: [],
    });
    expect(model.items[0].explanation).not.toHaveProperty('documentedSupport');
    expect(model.items[1].explanation).toMatchObject({
      documentedSupport: expect.objectContaining({
        label: 'Documented support',
        evidence: expect.objectContaining({ status: 'needs-confirmation' }),
      }),
    });
    for (const explanation of model.items.map((entry) => entry.explanation)) {
      expect(Object.keys(explanation).sort()).toEqual([
        'checkedRequirements',
        'documentedSupport',
        'keywordConnections',
        'verificationRows',
      ].filter((key) => key !== 'documentedSupport' || 'documentedSupport' in explanation));
      expect(explanation).not.toHaveProperty('eligible');
      expect(explanation).not.toHaveProperty('admission');
      expect(explanation).not.toHaveProperty('fit');
      expect(explanation).not.toHaveProperty('rank');
    }
  });
});
