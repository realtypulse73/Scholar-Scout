import {
  SYNTHETIC_ILLUSTRATION_DISCLOSURE,
  getCatalogueSnapshotDigest,
  type CataloguePublicationCapability,
  type CataloguePublicationState,
  type CataloguePublishedRecord,
  type CatalogueSnapshot,
  type CatalogueSnapshotManifest,
} from '@/lib/catalogue-publication';
import type {
  CatalogueCardFact,
  CatalogueOpportunityCardFacts,
  CataloguePathway,
  CatalogueRegion,
  FactAuthority,
  FactEvidence,
  FactStatus,
  SourceMetadata,
  SourcedFact,
} from '@/lib/catalogue-contract';

/**
 * Public bootstrap content for an empty Scholar Scout data store. This is not
 * a migration: an existing store always remains the authority for its data.
 */
export const OFFICIAL_GREATER_HOUSTON_CATALOGUE_SEED_VERSION = 1;

const REVIEWED_AT = '2026-11-11';
const EMPTY_SOURCE_DATE = { state: 'unavailable', value: null } as const;

const GREATER_HOUSTON_REGION: CatalogueRegion = {
  id: 'greater-houston',
  label: 'Greater Houston',
  officialBoundary: {
    authority: 'us-census-omb-cbsa',
    boundaryId: '26420',
    boundaryVersion: 'OMB July 2023 delineation',
    sourceLabel: 'U.S. Census July 2023 OMB CBSA map',
    sourceUrl: 'https://www.census.gov/geographies/reference-maps/2023/geo/cbsa.html',
    sourceDate: { state: 'documented', value: '2026-09-20' },
    checkedAt: '2026-09-23',
  },
  localFocus: {
    authority: 'City of Houston',
    anchorLabel: 'City of Houston City Hall — 901 Bagby, Houston, TX 77002',
    latitude: 29.760197,
    longitude: -95.370132,
    radiusMiles: 10,
    sourceLabel: 'City of Houston contact record',
    sourceUrl: 'https://houstontx.gov/contactus/',
    sourceDate: { state: 'documented', value: '2026-09-20' },
    checkedAt: '2026-09-23',
  },
};

interface OfficialRecordSeed {
  id: string;
  title: string;
  sourceLabel: string;
  sourceUrl: string;
  authority: FactAuthority;
  reviewedDescription: string;
  claimBoundary: string;
  assetPath: string;
  alt: string;
  location?: string;
  pathway?: CataloguePathway;
}

const OFFICIAL_RECORD_SEEDS: readonly OfficialRecordSeed[] = [
  {
    id: 'catalogue:federal-student-aid-options',
    title: 'Federal Student Aid — Types of Financial Aid',
    sourceLabel: 'Federal Student Aid official external source — Types of Financial Aid',
    sourceUrl: 'https://studentaid.gov/understand-aid/types',
    authority: 'government-official',
    reviewedDescription: 'Federal Student Aid describes grants, work-study, loans, and scholarships as ways to help pay for college or career school.',
    claimBoundary: 'This federal information source describes aid types. It is not a personal aid offer, provider relationship, or financial recommendation.',
    assetPath: '/images/catalogue/financial-aid-options.png',
    alt: 'Two people reviewing a laptop and a planning worksheet at a library table.',
  },
  {
    id: 'catalogue:houston-city-college-programs',
    title: 'Houston City College — Programs & Courses',
    sourceLabel: 'Houston City College official external source — Programs & Courses',
    sourceUrl: 'https://www.hccs.edu/programs--courses/',
    authority: 'provider-official',
    reviewedDescription: 'Houston City College says its Programs & Courses page covers more than 85 programs and more than 300 award offerings.',
    claimBoundary: 'This official source is a general programme-exploration page. It does not establish a specific programme\'s availability, price, learning format, aid, or result.',
    assetPath: '/images/catalogue/houston-city-college-program-exploration.png',
    alt: 'A student writing beside a laptop with a generic downtown skyline in the background.',
    location: 'Houston, Texas',
  },
  {
    id: 'catalogue:lone-star-college-programs',
    title: 'Lone Star College — Programs of Study',
    sourceLabel: 'Lone Star College official external source — Programs of Study',
    sourceUrl: 'https://www.lonestar.edu/programs-of-study/',
    authority: 'provider-official',
    reviewedDescription: 'Lone Star College lists more than 200 degree and certification programs on its Programs of Study page.',
    claimBoundary: 'This official source is a general programme-exploration page. It does not establish a specific programme\'s availability, price, learning format, aid, or result.',
    assetPath: '/images/catalogue/lone-star-college-program-exploration.png',
    alt: 'A student reviewing a laptop and notebook in a sunlit generic learning space with trees outside.',
  },
  {
    id: 'catalogue:san-jacinto-college-areas-of-study',
    title: 'San Jacinto College — Areas of Study',
    sourceLabel: 'San Jacinto College official external source — Areas of Study',
    sourceUrl: 'https://www.sanjac.edu/programs/areas-of-study/',
    authority: 'provider-official',
    reviewedDescription: 'San Jacinto College describes community college degrees in the Houston area and lists more than 200 degrees and certificates.',
    claimBoundary: 'This official source is a general programme-exploration page. It does not establish a specific programme\'s availability, price, learning format, aid, or result.',
    assetPath: '/images/catalogue/san-jacinto-college-areas-of-study.png',
    alt: 'A student using a tablet and notebook in a workshop beside safety helmets and tools.',
    location: 'Houston area, Texas',
    pathway: 'community-college',
  },
  {
    id: 'catalogue:usdol-apprenticeship-job-finder',
    title: 'U.S. Department of Labor — Apprenticeship Job Finder',
    sourceLabel: 'U.S. Department of Labor official external source — Apprenticeship Job Finder',
    sourceUrl: 'https://www.apprenticeship.gov/apprenticeship-job-finder',
    authority: 'government-official',
    reviewedDescription: 'The U.S. Department of Labor Job Finder lets visitors search open apprenticeship job opportunities by career path or location.',
    claimBoundary: 'This national search service does not establish a local opening, provider relationship, endorsement, or individual result.',
    assetPath: '/images/catalogue/apprenticeship-discovery.png',
    alt: 'Two people in safety glasses reviewing a metal part and technical plans in a workshop.',
  },
];

const FIXTURE_SOURCE: SourceMetadata = {
  sourceLabel: 'Local Phase 11 UAT fixture — not a real provider record',
  sourceUrl: 'https://example.edu/scholar-scout-phase-11-uat',
  sourceDate: { state: 'documented', value: '2026-09-20' },
  checkedAt: '2026-09-23',
};

function createEvidence(
  source: SourceMetadata,
  authority: FactAuthority,
  status: FactStatus,
  verificationAction: string,
  reviewedAt = REVIEWED_AT,
): FactEvidence {
  return {
    status,
    authority,
    sourceLabel: source.sourceLabel,
    sourceUrl: source.sourceUrl,
    sourceDate: { ...source.sourceDate },
    reviewedAt,
    verificationAction,
  };
}

function unresolvedFact<Value>(evidence: FactEvidence): CatalogueCardFact<Value> {
  return { value: null, state: 'unknown', evidence };
}

function sourceFact<Value>(value: Value, evidence: FactEvidence): CatalogueCardFact<Value> {
  return { value, evidence };
}

function clone<Value>(value: Value): Value {
  return JSON.parse(JSON.stringify(value)) as Value;
}

function createOfficialRecord(seed: OfficialRecordSeed): CataloguePublishedRecord {
  const source: SourceMetadata = {
    sourceLabel: seed.sourceLabel,
    sourceUrl: seed.sourceUrl,
    sourceDate: { ...EMPTY_SOURCE_DATE },
    checkedAt: REVIEWED_AT,
  };
  const verificationAction = 'Review the official external source for current details before making a decision.';
  const unknown = () => createEvidence(source, seed.authority, 'unknown', verificationAction);
  const needsConfirmation = () => createEvidence(
    source,
    seed.authority,
    'needs-confirmation',
    verificationAction,
  );
  const facts: CatalogueOpportunityCardFacts = {
    location: seed.location === undefined
      ? unresolvedFact(unknown())
      : sourceFact(seed.location, needsConfirmation()),
    pathway: seed.pathway === undefined
      ? unresolvedFact(unknown())
      : sourceFact(seed.pathway, needsConfirmation()),
    skillTaught: unresolvedFact(unknown()),
    trainingPayer: unresolvedFact(unknown()),
    costOrTuition: unresolvedFact(unknown()),
    duration: unresolvedFact(unknown()),
    delivery: unresolvedFact(unknown()),
  };

  return {
    id: seed.id,
    revision: 1,
    title: seed.title,
    regionId: 'greater-houston',
    region: clone(GREATER_HOUSTON_REGION),
    source,
    facts,
    claimBoundary: seed.claimBoundary,
    reviewedDescription: {
      value: seed.reviewedDescription,
      evidence: needsConfirmation(),
    },
    renderableMedia: {
      kind: 'illustration',
      assetPath: seed.assetPath,
      alt: seed.alt,
      label: 'Scholar Scout generated image',
      disclosure: SYNTHETIC_ILLUSTRATION_DISCLOSURE,
    },
    mediaFallback: false,
  };
}

function createFixtureFact<Value>(value: Value): SourcedFact<Value> {
  return {
    value,
    evidence: createEvidence(
      FIXTURE_SOURCE,
      'provider-official',
      'current',
      'This is a local test fixture. Verify a real provider source before making any decision.',
      '2026-09-23',
    ),
  };
}

/** The original Phase 11 fixture stays separate from every real-source record. */
export const PHASE11_UAT_COMMUNITY_PATHWAY_FIXTURE: Readonly<CataloguePublishedRecord> = {
  id: 'phase11-uat-community-pathway',
  revision: 1,
  title: 'Phase 11 UAT Community Pathway',
  regionId: 'greater-houston',
  region: clone(GREATER_HOUSTON_REGION),
  source: clone(FIXTURE_SOURCE),
  facts: {
    location: createFixtureFact('Houston, Texas'),
    pathway: createFixtureFact('community-college'),
    skillTaught: createFixtureFact('Health information support'),
    trainingPayer: createFixtureFact('Student-paid'),
    costOrTuition: createFixtureFact('$1,800'),
    duration: createFixtureFact('12 weeks'),
    delivery: createFixtureFact('hybrid'),
  },
  claimBoundary: 'This locally stored UAT fixture is for interface verification only and must be verified before any decision.',
  mediaFallback: false,
};

function createSnapshot(input: {
  id: string;
  sequence: number;
  releasedAt: string;
  records: CataloguePublishedRecord[];
  priorSnapshotId?: string;
}): CatalogueSnapshot {
  return {
    id: input.id,
    sequence: input.sequence,
    kind: 'emergency',
    releasedAt: input.releasedAt,
    ...(input.priorSnapshotId === undefined ? {} : { priorSnapshotId: input.priorSnapshotId }),
    records: input.records.slice().sort((left, right) => left.id.localeCompare(right.id)),
    contentDigest: getCatalogueSnapshotDigest(input.records.slice().sort((left, right) => left.id.localeCompare(right.id))),
  };
}

function createManifest(
  snapshot: CatalogueSnapshot,
  input: { id: string; actorId: string; reason: string; capability?: CataloguePublicationCapability },
): CatalogueSnapshotManifest {
  return {
    id: input.id,
    snapshotId: snapshot.id,
    sequence: snapshot.sequence,
    kind: snapshot.kind,
    releasedAt: snapshot.releasedAt,
    ...(snapshot.priorSnapshotId === undefined ? {} : { priorSnapshotId: snapshot.priorSnapshotId }),
    actorId: input.actorId,
    capability: input.capability ?? 'administrator',
    action: 'release',
    outcome: 'published',
    reason: input.reason,
    included: snapshot.records.map(({ id, revision }) => ({ id, revision })),
    retired: [],
    quarantined: [],
    contentDigest: snapshot.contentDigest,
  };
}

/**
 * Returns a fresh, valid public catalogue seed for a previously empty store.
 * Existing stores are never read, rewritten, or merged through this factory.
 */
export function createInitialCataloguePublicationSeed(): CataloguePublicationState {
  const fixtureSnapshotOne = createSnapshot({
    id: 'phase11-uat-snapshot-1',
    sequence: 1,
    releasedAt: '2026-09-24T02:00:00.000Z',
    records: [clone(PHASE11_UAT_COMMUNITY_PATHWAY_FIXTURE)],
  });
  const fixtureSnapshotTwo = createSnapshot({
    id: 'phase11-uat-snapshot-2',
    sequence: 2,
    releasedAt: '2026-09-24T02:10:00.000Z',
    priorSnapshotId: fixtureSnapshotOne.id,
    records: [clone(PHASE11_UAT_COMMUNITY_PATHWAY_FIXTURE)],
  });
  const officialSnapshot = createSnapshot({
    id: 'catalogue-snapshot-3',
    sequence: 3,
    releasedAt: '2026-11-11T12:00:00.000Z',
    priorSnapshotId: fixtureSnapshotTwo.id,
    records: [
      ...OFFICIAL_RECORD_SEEDS.map(createOfficialRecord),
      clone(PHASE11_UAT_COMMUNITY_PATHWAY_FIXTURE),
    ],
  });

  return {
    schemaVersion: 1,
    candidates: [],
    auditEvents: [],
    snapshots: [fixtureSnapshotOne, fixtureSnapshotTwo, officialSnapshot],
    manifests: [
      createManifest(fixtureSnapshotOne, {
        id: 'phase11-uat-manifest-1',
        actorId: 'phase11-uat',
        reason: 'Local-only Phase 11 browser accessibility fixture; not for deployment.',
      }),
      createManifest(fixtureSnapshotTwo, {
        id: 'phase11-uat-manifest-2',
        actorId: 'phase11-uat',
        reason: 'Local-only Phase 11 UAT fixture transition to an unavailable saved choice.',
      }),
      createManifest(officialSnapshot, {
        id: 'catalogue-manifest-3',
        actorId: 'local-official-sources',
        reason: 'Seeded source-backed catalogue additions; no deployment or endorsement.',
      }),
    ],
    activeSnapshotId: officialSnapshot.id,
  };
}
