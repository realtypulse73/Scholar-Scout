import {
  CATALOGUE_PATHWAYS,
  CATALOGUE_REGION_IDS,
  EARTH_RADIUS_MILES,
  calculateGreatCircleMiles,
  createCoverageKey,
  getFreshnessStatus,
  isWithinLocalFocus,
  validateCatalogueRegion,
  validateCoverageMatrix,
  validateFactEvidence,
  validateSourceMetadata,
  type CatalogueCoverage,
  type CatalogueRegion,
  type FactEvidence,
} from '@/lib/catalogue-contract';

const region: CatalogueRegion = {
  id: 'greater-kingston-jamaica',
  label: 'Greater Kingston, Jamaica',
  officialBoundary: {
    authority: 'statin-kingston-metropolitan-area',
    boundaryId: null,
    boundaryVersion: 'STATIN KMA communities and population',
    sourceLabel: 'STATIN Kingston Metropolitan Area',
    sourceUrl: 'https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html',
    sourceDate: { state: 'unavailable', value: null },
    checkedAt: '2026-09-22',
  },
  localFocus: {
    authority: 'Kingston and St. Andrew Municipal Corporation',
    anchorLabel: 'Kingston and St. Andrew Municipal Corporation',
    latitude: 17.9714,
    longitude: -76.7921,
    radiusMiles: 10,
    sourceLabel: 'KSAMC contact details',
    sourceUrl: 'https://www.ksamc.gov.jm/contact-us',
    sourceDate: { state: 'documented', value: '2026-09-22' },
    checkedAt: '2026-09-22',
  },
};

const coverage: CatalogueCoverage = {
  regionId: region.id,
  pathway: 'university',
  state: 'not-yet-verified',
  reviewedAt: '2026-09-22',
};

const factEvidence: FactEvidence = {
  status: 'current',
  authority: 'provider-official',
  sourceLabel: 'Programme catalogue',
  sourceUrl: 'https://provider.example/programmes',
  sourceDate: { state: 'documented', value: '2026-03-23' },
  reviewedAt: '2026-09-22',
  verificationAction: 'Confirm details with the provider.',
};

const FACT_NOW = new Date('2026-09-22T00:00:00.000Z');

describe('catalogue contract', () => {
  it('proves one source-dated region-to-coverage path without treating an unavailable boundary date as current', () => {
    expect(validateCatalogueRegion(region)).toEqual([]);
    expect(createCoverageKey(coverage.regionId, coverage.pathway)).toBe(
      'greater-kingston-jamaica:university',
    );
    expect(validateCoverageMatrix([region], [coverage])).toHaveLength(5);
    expect(getFreshnessStatus(region.officialBoundary, 'boundary', new Date('2026-09-22')))
      .toBe('unknown');
  });

  it('accepts a location at the documented local-focus anchor', () => {
    expect(isWithinLocalFocus(region.localFocus, {
      latitude: region.localFocus.latitude,
      longitude: region.localFocus.longitude,
    })).toBe(true);
  });

  it('keeps the approved region and pathway vocabulary stable', () => {
    expect(CATALOGUE_REGION_IDS).toEqual([
      'greater-houston',
      'greater-chicago',
      'greater-buffalo',
      'greater-atlanta',
      'greater-new-orleans',
      'greater-kingston-jamaica',
    ]);
    expect(CATALOGUE_PATHWAYS).toEqual([
      'university',
      'community-college',
      'trade-career-school',
      'registered-apprenticeship',
      'employer-linked-training',
      'military-information',
    ]);
  });

  it('applies the exact 731-day boundary threshold using the injected clock', () => {
    const atThreshold = {
      ...region.officialBoundary,
      sourceDate: { state: 'documented' as const, value: '2024-09-21' },
    };
    const oneDayLate = {
      ...atThreshold,
      sourceDate: { state: 'documented' as const, value: '2024-09-20' },
    };
    const now = new Date('2026-09-22T00:00:00.000Z');

    expect(getFreshnessStatus(atThreshold, 'boundary', now)).toBe('current');
    expect(getFreshnessStatus(oneDayLate, 'boundary', now)).toBe('needs-confirmation');
  });

  it.each([
    { state: 'unavailable' as const, value: null },
    { state: 'documented' as const, value: '2026-02-30' },
    { state: 'documented' as const, value: '2026-09-23' },
  ])('never treats an unavailable, malformed, or future source date as current', (sourceDate) => {
    expect(getFreshnessStatus({
      ...region.officialBoundary,
      sourceDate,
    }, 'boundary', new Date('2026-09-22T00:00:00.000Z'))).toBe('unknown');
  });

  it('uses an inclusive ten-mile great-circle boundary and rejects invalid coordinates', () => {
    const pointAtTenMiles = { latitude: 0, longitude: 0.144731584379897 };
    const pointBeyondTenMiles = { latitude: 0, longitude: 0.1448 };
    const localFocus = { ...region.localFocus, latitude: 0, longitude: 0 };

    expect(calculateGreatCircleMiles({ latitude: 0, longitude: 0 }, pointAtTenMiles))
      .toBeCloseTo(10, 10);
    expect(isWithinLocalFocus(localFocus, pointAtTenMiles)).toBe(true);
    expect(isWithinLocalFocus(localFocus, pointBeyondTenMiles)).toBe(false);
    expect(EARTH_RADIUS_MILES).toBe(3958.7613);
    expect(calculateGreatCircleMiles({ latitude: 91, longitude: 0 }, pointAtTenMiles)).toBeNull();
    expect(isWithinLocalFocus(localFocus, { latitude: 0, longitude: Number.NaN })).toBe(false);
    expect(validateCatalogueRegion({
      ...region,
      localFocus: { ...region.localFocus, latitude: 91 },
    })).toContain('Local focus coordinates must be finite latitude/longitude values.');
  });

  it('returns deterministic validation errors for empty, duplicate, unsupported, and missing coverage cells', () => {
    const completeCoverage = CATALOGUE_PATHWAYS.map((pathway) => ({
      ...coverage,
      pathway,
    }));
    const invalidCoverage = [
      ...completeCoverage,
      completeCoverage[0],
      {
        ...coverage,
        regionId: 'unsupported-region',
        pathway: 'unsupported-pathway',
      },
    ] as unknown as CatalogueCoverage[];

    expect(validateCoverageMatrix([], [])).toEqual([
      'At least one catalogue region is required.',
      'At least one catalogue coverage row is required.',
    ]);
    expect(validateCoverageMatrix([region], invalidCoverage)).toEqual([
      'Unsupported coverage pathway: unsupported-pathway.',
      'Unsupported coverage region: unsupported-region.',
      'Duplicate catalogue coverage: greater-kingston-jamaica:university.',
    ]);
    expect(validateCoverageMatrix([region], completeCoverage.slice(1))).toEqual([
      'Missing catalogue coverage: greater-kingston-jamaica:university.',
    ]);
  });

  it('requires valid source dates and public source URLs', () => {
    expect(validateSourceMetadata({
      ...region.officialBoundary,
      sourceUrl: 'ftp://example.com/source',
      sourceDate: { state: 'documented', value: '2026-02-30' },
      checkedAt: 'not-a-date',
    })).toEqual([
      'Source URL must use http:// or https://.',
      'Source date must be documented with an ISO calendar date or explicitly unavailable.',
      'Checked date must be an ISO calendar date.',
    ]);
  });
});

describe('field-level fact evidence', () => {
  it('accepts complete documented current evidence and an unavailable unresolved source date', () => {
    expect(validateFactEvidence(factEvidence, FACT_NOW)).toEqual([]);
    expect(validateFactEvidence({
      ...factEvidence,
      status: 'unknown',
      sourceDate: { state: 'unavailable', value: null },
    }, FACT_NOW)).toEqual([]);
  });

  it('requires authority, public attribution, structured source/review dates, status, and an action', () => {
    expect(validateFactEvidence({
      ...factEvidence,
      authority: 'unapproved-authority' as FactEvidence['authority'],
      sourceLabel: '',
      sourceUrl: 'ftp://provider.example/programmes',
      sourceDate: undefined as unknown as FactEvidence['sourceDate'],
      reviewedAt: 'not-a-date',
      verificationAction: '',
    }, FACT_NOW)).toEqual(expect.arrayContaining([
      'Fact authority is unsupported.',
      'Fact source label is required.',
      'Fact source URL must use http:// or https://.',
      'Fact source date must be documented with an ISO calendar date or explicitly unavailable.',
      'Fact review date must be an ISO calendar date.',
      'Fact verification action is required.',
    ]));
  });

  it('keeps unavailable dates and explicit conflict from being treated as current', () => {
    const now = new Date('2026-09-22T00:00:00.000Z');

    expect(validateFactEvidence({
      ...factEvidence,
      status: 'current',
      sourceDate: { state: 'unavailable', value: null },
    }, FACT_NOW)).toContain('Current facts require a documented source date.');
    expect(validateFactEvidence({
      ...factEvidence,
      status: 'conflicting',
    }, FACT_NOW)).toEqual([]);
    expect(getFreshnessStatus({
      sourceLabel: factEvidence.sourceLabel,
      sourceUrl: factEvidence.sourceUrl,
      sourceDate: { state: 'unavailable', value: null },
      checkedAt: factEvidence.reviewedAt,
    }, 'operational', now)).toBe('unknown');
  });

  it('rejects malformed or future dates and honors the exact operational freshness threshold', () => {
    const now = new Date('2026-09-22T00:00:00.000Z');
    const atThreshold = {
      sourceLabel: factEvidence.sourceLabel,
      sourceUrl: factEvidence.sourceUrl,
      sourceDate: { state: 'documented' as const, value: '2026-03-23' },
      checkedAt: factEvidence.reviewedAt,
    };

    expect(validateFactEvidence({
      ...factEvidence,
      sourceDate: { state: 'documented', value: '2026-02-30' },
      reviewedAt: '2026-09-23',
    }, FACT_NOW)).toEqual(expect.arrayContaining([
      'Fact source date must be documented with an ISO calendar date or explicitly unavailable.',
      'Fact review date cannot be in the future.',
    ]));
    expect(getFreshnessStatus(atThreshold, 'operational', now)).toBe('current');
    expect(getFreshnessStatus({
      ...atThreshold,
      sourceDate: { state: 'documented', value: '2026-03-22' },
    }, 'operational', now)).toBe('needs-confirmation');
    expect(getFreshnessStatus({
      ...atThreshold,
      sourceDate: { state: 'documented', value: '2026-09-23' },
    }, 'operational', now)).toBe('unknown');
  });
});
