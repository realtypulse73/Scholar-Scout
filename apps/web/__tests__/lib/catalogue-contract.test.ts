import {
  CATALOGUE_PATHWAYS,
  getOpportunityCardVerificationStatus,
  CATALOGUE_REGION_IDS,
  EARTH_RADIUS_MILES,
  calculateGreatCircleMiles,
  createCoverageKey,
  getFreshnessStatus,
  isWithinLocalFocus,
  validateCatalogueRegion,
  validateCoverageMatrix,
  validateEmployerTrainingFacts,
  validateFactEvidence,
  validateCatalogueOpportunityCardFacts,
  validateOccupationAreaWageContext,
  validateSourceMetadata,
  type CatalogueCoverage,
  type CatalogueOpportunityCardFacts,
  type CatalogueRegion,
  type EmployerTrainingFacts,
  type FactEvidence,
  type OccupationAreaWageContext,
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

const employerTrainingFacts: EmployerTrainingFacts = {
  pathway: 'employer-linked-training',
  taughtSkill: {
    value: 'Industrial maintenance',
    evidence: factEvidence,
  },
  trainingPayer: 'employer',
  traineePay: {
    value: '$18 per hour during training',
    evidence: factEvidence,
  },
  employmentCommitment: 'no-published-guarantee',
  employmentCommitmentEvidence: factEvidence,
};

const wageContext: OccupationAreaWageContext = {
  occupation: 'Industrial maintenance technician',
  area: 'Greater Houston',
  wage: {
    value: '$24.00 hourly median wage',
    evidence: {
      ...factEvidence,
      authority: 'workforce-authority',
    },
  },
  informationalLabel: 'Occupation-and-area wage context only — not an offer or forecast.',
};

const cardFacts: CatalogueOpportunityCardFacts = {
  location: { value: 'Greater Houston', evidence: factEvidence },
  pathway: { value: 'employer-linked-training', evidence: factEvidence },
  skillTaught: { value: 'Industrial maintenance', evidence: factEvidence },
  trainingPayer: { value: 'Employer', evidence: factEvidence },
  costOrTuition: { value: 'No tuition published', evidence: factEvidence },
  duration: { value: '12 weeks', evidence: factEvidence },
  delivery: { value: 'hybrid', evidence: factEvidence },
};

describe('catalogue contract', () => {
  it('proves one source-dated region-to-coverage path without treating an unavailable boundary date as current', () => {
    expect(validateCatalogueRegion(region)).toEqual([]);
    expect(createCoverageKey(coverage.regionId, coverage.pathway)).toBe(
      'greater-kingston-jamaica:university',
    );
    expect(validateCoverageMatrix([region], [coverage], FACT_NOW)).toHaveLength(5);
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

    expect(validateCoverageMatrix([], [], FACT_NOW)).toEqual([
      'At least one catalogue region is required.',
      'At least one catalogue coverage row is required.',
    ]);
    expect(validateCoverageMatrix([region], invalidCoverage, FACT_NOW)).toEqual([
      'Unsupported coverage pathway: unsupported-pathway.',
      'Unsupported coverage region: unsupported-region.',
      'Duplicate catalogue coverage: greater-kingston-jamaica:university.',
    ]);
    expect(validateCoverageMatrix([region], completeCoverage.slice(1), FACT_NOW)).toEqual([
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

  it('rejects documented source dates after the injected clock and reviews before the source', () => {
    expect(validateFactEvidence({
      ...factEvidence,
      sourceDate: { state: 'documented', value: '2026-09-23' },
    }, FACT_NOW)).toContain('Fact source date cannot be in the future.');
    expect(validateFactEvidence({
      ...factEvidence,
      status: 'unknown',
      sourceDate: { state: 'documented', value: '2026-09-23' },
    }, FACT_NOW)).toContain('Fact source date cannot be in the future.');
    expect(validateFactEvidence({
      ...factEvidence,
      sourceDate: { state: 'documented', value: '2026-03-23' },
      reviewedAt: '2026-03-22',
    }, FACT_NOW)).toContain('Fact review date cannot precede the documented source date.');
  });
});

describe('employer training and wage context', () => {
  it('keeps taught skill, trainee pay, and no-guarantee evidence structurally separate', () => {
    expect(validateEmployerTrainingFacts(employerTrainingFacts, FACT_NOW)).toEqual([]);
    expect(employerTrainingFacts.employmentCommitment).toBe('no-published-guarantee');
    expect(validateEmployerTrainingFacts({
      ...employerTrainingFacts,
      employmentCommitment: 'unknown',
      employmentCommitmentEvidence: {
        ...factEvidence,
        status: 'unknown',
        sourceDate: { state: 'unavailable', value: null },
      },
    }, FACT_NOW)).toEqual([]);
  });

  it('rejects an unsupported pathway, payer, missing material evidence, and incomplete commitment evidence', () => {
    expect(validateEmployerTrainingFacts({
      ...employerTrainingFacts,
      pathway: 'registered-apprenticeship' as EmployerTrainingFacts['pathway'],
      trainingPayer: 'student' as EmployerTrainingFacts['trainingPayer'],
      taughtSkill: { value: '', evidence: factEvidence },
      traineePay: { value: '', evidence: factEvidence },
      employmentCommitmentEvidence: {
        ...factEvidence,
        sourceDate: undefined as unknown as FactEvidence['sourceDate'],
      },
    }, FACT_NOW)).toEqual(expect.arrayContaining([
      'Employer training facts require the employer-linked-training pathway.',
      'Employer training facts require employer as the training payer.',
      'Taught skill value is required.',
      'Trainee pay value is required.',
      'Employment commitment: Fact source date must be documented with an ISO calendar date or explicitly unavailable.',
    ]));
  });

  it('requires independent dated wage evidence and fixes the context-only explanation', () => {
    expect(validateOccupationAreaWageContext(wageContext, FACT_NOW)).toEqual([]);
    expect(validateOccupationAreaWageContext({
      ...wageContext,
      occupation: '',
      wage: {
        value: '',
        evidence: {
          ...wageContext.wage.evidence,
          reviewedAt: 'not-a-date',
        },
      },
      informationalLabel: 'Estimated offer' as OccupationAreaWageContext['informationalLabel'],
    }, FACT_NOW)).toEqual(expect.arrayContaining([
      'Wage context occupation is required.',
      'Wage context value is required.',
      'Wage context: Fact review date must be an ISO calendar date.',
      'Wage context must use the informational-only label.',
    ]));
    expect(Object.keys(wageContext)).not.toEqual(expect.arrayContaining([
      'provider',
      'learner',
      'offer',
      'placement',
      'forecast',
      'ranking',
    ]));
  });

  it.each([
    42,
    { amount: '$18' },
    ['$18'],
  ])('returns errors rather than throwing for malformed sourced text values', (value) => {
    const malformedEmployerTraining = {
      ...employerTrainingFacts,
      taughtSkill: { value, evidence: factEvidence },
      traineePay: { value, evidence: factEvidence },
    } as unknown as EmployerTrainingFacts;
    const malformedWageContext = {
      ...wageContext,
      wage: { value, evidence: wageContext.wage.evidence },
    } as unknown as OccupationAreaWageContext;

    expect(() => validateEmployerTrainingFacts(malformedEmployerTraining, FACT_NOW)).not.toThrow();
    expect(validateEmployerTrainingFacts(malformedEmployerTraining, FACT_NOW)).toEqual(expect.arrayContaining([
      'Taught skill value is required.',
      'Trainee pay value is required.',
    ]));
    expect(() => validateOccupationAreaWageContext(malformedWageContext, FACT_NOW)).not.toThrow();
    expect(validateOccupationAreaWageContext(malformedWageContext, FACT_NOW)).toContain(
      'Wage context value is required.',
    );
  });

  it.each([
    ['no-published-guarantee', 'unknown'],
    ['published-provider-statement', 'conflicting'],
    ['unknown', 'current'],
    ['conflicting', 'needs-confirmation'],
  ] as const)('rejects an incompatible %s commitment evidence state of %s', (commitment, status) => {
    expect(validateEmployerTrainingFacts({
      ...employerTrainingFacts,
      employmentCommitment: commitment as EmployerTrainingFacts['employmentCommitment'],
      employmentCommitmentEvidence: {
        ...factEvidence,
        status,
        sourceDate: status === 'unknown' ? { state: 'unavailable', value: null } : factEvidence.sourceDate,
      },
    }, FACT_NOW)).toContain('Employment commitment state must match its evidence status.');
  });

  it.each([
    ['no-published-guarantee', 'current'],
    ['published-provider-statement', 'needs-confirmation'],
    ['unknown', 'unknown'],
    ['conflicting', 'conflicting'],
  ] as const)('accepts a compatible %s commitment evidence state of %s', (commitment, status) => {
    expect(validateEmployerTrainingFacts({
      ...employerTrainingFacts,
      employmentCommitment: commitment as EmployerTrainingFacts['employmentCommitment'],
      employmentCommitmentEvidence: {
        ...factEvidence,
        status,
        sourceDate: status === 'unknown' ? { state: 'unavailable', value: null } : factEvidence.sourceDate,
      },
    }, FACT_NOW)).toEqual([]);
  });
});

describe('opportunity card facts', () => {
  it('accepts a complete sourced first-view card and derives a current status', () => {
    expect(validateCatalogueOpportunityCardFacts(cardFacts, FACT_NOW)).toEqual([]);
    expect(getOpportunityCardVerificationStatus(cardFacts, FACT_NOW)).toBe('current');
  });

  it('keeps an explicit needs-confirmation cost visible and supports every controlled delivery value', () => {
    const cardWithCaution = {
      ...cardFacts,
      costOrTuition: {
        value: 'Confirm current tuition',
        evidence: { ...factEvidence, status: 'needs-confirmation' as const },
      },
    };

    expect(validateCatalogueOpportunityCardFacts(cardWithCaution, FACT_NOW)).toEqual([]);
    expect(getOpportunityCardVerificationStatus(cardWithCaution, FACT_NOW)).toBe('needs-confirmation');
    for (const delivery of ['in-person', 'online', 'hybrid'] as const) {
      expect(validateCatalogueOpportunityCardFacts({
        ...cardFacts,
        delivery: { value: delivery, evidence: factEvidence },
      }, FACT_NOW)).toEqual([]);
    }
  });

  it('derives every public verification state solely from constituent card facts', () => {
    expect(getOpportunityCardVerificationStatus({
      ...cardFacts,
      duration: { value: 'Confirm duration', evidence: { ...factEvidence, status: 'needs-confirmation' } },
    }, FACT_NOW)).toBe('needs-confirmation');
    expect(getOpportunityCardVerificationStatus({
      ...cardFacts,
      duration: {
        value: null,
        state: 'unknown',
        evidence: {
          ...factEvidence,
          status: 'unknown',
          sourceDate: { state: 'unavailable', value: null },
        },
      },
    }, FACT_NOW)).toBe('unknown');
    expect(getOpportunityCardVerificationStatus({
      ...cardFacts,
      duration: { value: 'Duration sources conflict', evidence: { ...factEvidence, status: 'conflicting' } },
    }, FACT_NOW)).toBe('conflicting');
  });

  it('rejects missing, bare, malformed, unsupported, and unresolved-without-action card facts', () => {
    const missingLocation = { ...cardFacts } as Partial<CatalogueOpportunityCardFacts>;
    delete missingLocation.location;

    expect(validateCatalogueOpportunityCardFacts(missingLocation, FACT_NOW)).toContain(
      'Location card fact is required.',
    );
    expect(validateCatalogueOpportunityCardFacts({
      ...cardFacts,
      location: 'Greater Houston',
      pathway: { value: 'unapproved-pathway', evidence: factEvidence },
      delivery: { value: 'mail', evidence: factEvidence },
      skillTaught: { value: 'Industrial maintenance', evidence: { ...factEvidence, sourceDate: undefined } },
      duration: {
        value: null,
        state: 'unknown',
        evidence: { ...factEvidence, status: 'unknown', verificationAction: '' },
      },
    } as unknown as CatalogueOpportunityCardFacts, FACT_NOW)).toEqual(expect.arrayContaining([
      'Location must be a sourced or explicitly unresolved card fact.',
      'Pathway value is unsupported.',
      'Delivery value is unsupported.',
      'Skill taught: Fact source date must be documented with an ISO calendar date or explicitly unavailable.',
      'Duration: Fact verification action is required.',
    ]));
  });

  it('rejects unresolved card facts with a material value or unsupported state', () => {
    expect(validateCatalogueOpportunityCardFacts({
      ...cardFacts,
      duration: {
        value: 'Unverified duration',
        state: 'unknown',
        evidence: {
          ...factEvidence,
          status: 'unknown',
          sourceDate: { state: 'unavailable', value: null },
        },
      },
    } as unknown as CatalogueOpportunityCardFacts, FACT_NOW)).toContain(
      'Duration unresolved card facts must have a null value.',
    );
    expect(validateCatalogueOpportunityCardFacts({
      ...cardFacts,
      duration: {
        value: null,
        state: 'current',
        evidence: factEvidence,
      },
    } as unknown as CatalogueOpportunityCardFacts, FACT_NOW)).toContain(
      'Duration unresolved state is unsupported.',
    );
  });
});

describe('review regression contracts', () => {
  it('binds each region to its exact authority and boundary identifier', () => {
    const houston = {
      ...region,
      id: 'greater-houston' as const,
      label: 'Greater Houston',
      officialBoundary: {
        ...region.officialBoundary,
        authority: 'us-census-omb-cbsa' as const,
        boundaryId: '26420',
      },
    };

    expect(validateCatalogueRegion(houston)).toEqual([]);
    expect(validateCatalogueRegion({
      ...houston,
      officialBoundary: {
        ...houston.officialBoundary,
        authority: 'statin-kingston-metropolitan-area',
        boundaryId: null,
      },
    } as unknown as CatalogueRegion)).toContain(
      'Official boundary authority and ID must match the declared region.',
    );
    expect(validateCatalogueRegion({
      ...region,
      officialBoundary: {
        ...region.officialBoundary,
        authority: 'us-census-omb-cbsa',
        boundaryId: '26420',
      },
    } as unknown as CatalogueRegion)).toContain(
      'Official boundary authority and ID must match the declared region.',
    );
  });

  it('requires current attributable evidence and a direct action for verified coverage', () => {
    const verifiedCoverage = {
      ...coverage,
      state: 'verified',
      evidence: factEvidence,
    } as unknown as CatalogueCoverage;
    const incompleteVerifiedCoverage = {
      ...coverage,
      state: 'verified',
    } as unknown as CatalogueCoverage;

    expect(validateCoverageMatrix([region], [verifiedCoverage], FACT_NOW)).toHaveLength(5);
    expect(validateCoverageMatrix([region], [
      verifiedCoverage,
      ...CATALOGUE_PATHWAYS.filter((pathway) => pathway !== coverage.pathway).map((pathway) => ({
        ...coverage,
        pathway,
        state: 'verified',
        evidence: factEvidence,
      })),
    ] as unknown as CatalogueCoverage[], FACT_NOW)).toEqual([]);
    expect(validateCoverageMatrix([region], [
      incompleteVerifiedCoverage,
      ...CATALOGUE_PATHWAYS.filter((pathway) => pathway !== coverage.pathway).map((pathway) => ({
        ...coverage,
        pathway,
      })),
    ] as unknown as CatalogueCoverage[], FACT_NOW)).toContain(
      'Verified coverage requires current attributable evidence for greater-kingston-jamaica:university.',
    );
  });

  it('rejects verified coverage review dates after the injected clock or before its evidence chronology', () => {
    const completeVerifiedCoverage = CATALOGUE_PATHWAYS.map((pathway) => ({
      ...coverage,
      pathway,
      state: 'verified' as const,
      evidence: factEvidence,
    })) as unknown as CatalogueCoverage[];

    expect(validateCoverageMatrix([region], [
      { ...completeVerifiedCoverage[0], reviewedAt: '2026-09-23' },
      ...completeVerifiedCoverage.slice(1),
    ], FACT_NOW)).toContain(
      'Coverage review date cannot be in the future for greater-kingston-jamaica:university.',
    );
    expect(validateCoverageMatrix([region], [
      { ...completeVerifiedCoverage[0], reviewedAt: '2026-09-21' },
      ...completeVerifiedCoverage.slice(1),
    ], FACT_NOW)).toContain(
      'Coverage review date cannot precede evidence review date for greater-kingston-jamaica:university.',
    );
    expect(validateCoverageMatrix([region], [
      {
        ...completeVerifiedCoverage[0],
        reviewedAt: '2026-09-21',
        evidence: {
          ...factEvidence,
          sourceDate: { state: 'documented', value: '2026-09-22' },
        },
      },
      ...completeVerifiedCoverage.slice(1),
    ], FACT_NOW)).toContain(
      'Coverage review date cannot precede documented evidence source date for greater-kingston-jamaica:university.',
    );
  });

  it.each([
    null,
    'malformed evidence',
    [],
  ])('returns a stable error for malformed unresolved duration evidence: %p', (evidence) => {
    const malformedCardFacts = {
      ...cardFacts,
      duration: {
        value: null,
        state: 'unknown',
        evidence,
      },
    } as unknown as CatalogueOpportunityCardFacts;

    expect(() => validateCatalogueOpportunityCardFacts(malformedCardFacts, FACT_NOW)).not.toThrow();
    expect(validateCatalogueOpportunityCardFacts(malformedCardFacts, FACT_NOW)).toContain(
      'Duration evidence must be an object.',
    );
  });

  it.each([
    null,
    'malformed region',
    [],
  ])('returns a stable error for malformed region entries: %p', (malformedRegion) => {
    const completeCoverage = CATALOGUE_PATHWAYS.map((pathway) => ({ ...coverage, pathway }));

    expect(() => validateCoverageMatrix(
      [region, malformedRegion] as unknown as CatalogueRegion[],
      completeCoverage,
      FACT_NOW,
    )).not.toThrow();
    expect(validateCoverageMatrix(
      [region, malformedRegion] as unknown as CatalogueRegion[],
      completeCoverage,
      FACT_NOW,
    )).toContain('Catalogue region must be an object.');
  });

  it.each([
    null,
    'malformed coverage row',
    [],
  ])('returns a stable error for malformed coverage entries: %p', (malformedCoverage) => {
    const completeCoverage = [
      ...CATALOGUE_PATHWAYS.map((pathway) => ({ ...coverage, pathway })),
      malformedCoverage,
    ] as unknown as CatalogueCoverage[];

    expect(() => validateCoverageMatrix([region], completeCoverage, FACT_NOW)).not.toThrow();
    expect(validateCoverageMatrix([region], completeCoverage, FACT_NOW)).toContain(
      'Catalogue coverage row must be an object.',
    );
  });

  it.each([
    undefined,
    null,
    'malformed source metadata',
    [],
  ])('returns a stable root error for malformed source metadata: %p', (metadata) => {
    expect(() => validateSourceMetadata(metadata as unknown as typeof region.officialBoundary)).not.toThrow();
    expect(validateSourceMetadata(metadata as unknown as typeof region.officialBoundary)).toEqual([
      'Source metadata must be an object.',
    ]);
  });

  it.each([
    undefined,
    null,
    'malformed catalogue region',
    [],
  ])('returns a stable root error for malformed catalogue regions: %p', (candidate) => {
    expect(() => validateCatalogueRegion(candidate as unknown as CatalogueRegion)).not.toThrow();
    expect(validateCatalogueRegion(candidate as unknown as CatalogueRegion)).toEqual([
      'Catalogue region must be an object.',
    ]);
  });

  it.each([
    ['officialBoundary', undefined, 'Official boundary must be an object.'],
    ['officialBoundary', null, 'Official boundary must be an object.'],
    ['officialBoundary', 'malformed boundary', 'Official boundary must be an object.'],
    ['officialBoundary', [], 'Official boundary must be an object.'],
    ['localFocus', undefined, 'Local focus must be an object.'],
    ['localFocus', null, 'Local focus must be an object.'],
    ['localFocus', 'malformed focus', 'Local focus must be an object.'],
    ['localFocus', [], 'Local focus must be an object.'],
  ] as const)('returns a stable nested-object error for malformed %s: %p', (field, value, error) => {
    const malformedRegion = { ...region, [field]: value } as unknown as CatalogueRegion;

    expect(() => validateCatalogueRegion(malformedRegion)).not.toThrow();
    expect(validateCatalogueRegion(malformedRegion)).toEqual([error]);
  });

  it.each([
    ['evidence', factEvidence, 'Not-yet-verified coverage cannot include evidence for greater-kingston-jamaica:university.'],
    ['evidence', undefined, 'Not-yet-verified coverage cannot include evidence for greater-kingston-jamaica:university.'],
    ['sourceUrl', 'https://provider.example/programmes', 'Not-yet-verified coverage cannot include a source URL for greater-kingston-jamaica:university.'],
    ['sourceUrl', undefined, 'Not-yet-verified coverage cannot include a source URL for greater-kingston-jamaica:university.'],
  ] as const)('rejects an own %s field on not-yet-verified coverage: %p', (field, value, error) => {
    const completeCoverage = [
      { ...coverage, [field]: value },
      ...CATALOGUE_PATHWAYS.filter((pathway) => pathway !== coverage.pathway).map((pathway) => ({
        ...coverage,
        pathway,
      })),
    ] as unknown as CatalogueCoverage[];

    expect(validateCoverageMatrix([region], completeCoverage, FACT_NOW)).toContain(error);
  });

  it('continues to accept complete verified coverage with current attributable evidence', () => {
    const completeCoverage = CATALOGUE_PATHWAYS.map((pathway) => ({
      ...coverage,
      pathway,
      state: 'verified' as const,
      evidence: factEvidence,
    })) as unknown as CatalogueCoverage[];

    expect(validateCoverageMatrix([region], completeCoverage, FACT_NOW)).toEqual([]);
  });
});
