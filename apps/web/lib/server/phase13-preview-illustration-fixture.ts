import 'server-only';

import { catalogueRegions } from '@/lib/catalogue-fixtures';
import type {
  CatalogueCardFact,
  CatalogueOpportunityCardFacts,
  CatalogueRegion,
  FactEvidence,
  SourceMetadata,
} from '@/lib/catalogue-contract';
import {
  SYNTHETIC_ILLUSTRATION_DISCLOSURE,
  type CataloguePublishedRecord,
} from '@/lib/catalogue-publication';

const FIXTURE_DATE = '2026-11-09';
const FIXTURE_SOURCE_URL = 'https://github.com/realtypulse73/Scholar-Scout';
const FIXTURE_SOURCE_LABEL = 'Scholar Scout Preview-only illustration fixture (not a provider source)';

export type PublishedCatalogueSnapshotResult =
  | { status: 'empty'; records: CataloguePublishedRecord[] }
  | { status: 'published'; snapshotId: string; version: number; records: CataloguePublishedRecord[] };

/**
 * This opt-in is deliberately narrower than a general Preview deployment. It
 * keeps synthetic UAT cards out of ordinary Preview and every production
 * response while approved original media continues to use the normal record
 * publication path.
 */
export function isPhase13PreviewIllustrationFixtureEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.VERCEL_ENV === 'preview'
    && environment.SCHOLARSCOUT_PHASE13_UAT_FIXTURE === 'true';
}

/** Returns only original, non-affiliated illustrations for the Phase 13 browser rehearsal. */
export function getPhase13PreviewIllustrationFixtureRecords(): CataloguePublishedRecord[] {
  return [
    createFixtureRecord({
      id: 'preview-fixture:applied-health-photoreal',
      title: 'Preview test fixture — applied health practice setting',
      assetPath: '/images/fixtures/phase13-uat/applied-health-photoreal-v2.png',
      alt: 'Original photorealistic Scholar Scout image of two adult learners practicing skills with a training mannequin in a generic applied health lab.',
    }),
    createFixtureRecord({
      id: 'preview-fixture:welding-fabrication-photoreal',
      title: 'Preview test fixture — welding and fabrication practice setting',
      assetPath: '/images/fixtures/phase13-uat/welding-fabrication-photoreal-v2.png',
      alt: 'Original photorealistic Scholar Scout image of adult learners practicing welding and fabrication in a generic workshop.',
    }),
  ];
}

/**
 * Adds clearly labeled rehearsal cards only after the explicit Preview gate
 * has been enabled. The record shape is the same as approved media records,
 * so a reviewed original asset can replace an illustration without a schema
 * migration or a new learner-facing rendering path.
 */
export function withPhase13PreviewIllustrationFixture(
  snapshot: PublishedCatalogueSnapshotResult,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): PublishedCatalogueSnapshotResult {
  if (!isPhase13PreviewIllustrationFixtureEnabled(environment)) return snapshot;

  const records = [
    ...snapshot.records,
    ...getPhase13PreviewIllustrationFixtureRecords(),
  ];

  return {
    status: 'published',
    snapshotId: snapshot.status === 'published'
      ? `${snapshot.snapshotId}:phase13-preview-illustration-fixture`
      : 'phase13-preview-illustration-fixture',
    version: snapshot.status === 'published' ? snapshot.version : 0,
    records,
  };
}

function createFixtureRecord({
  id,
  title,
  assetPath,
  alt,
}: {
  id: string;
  title: string;
  assetPath: string;
  alt: string;
}): CataloguePublishedRecord {
  const evidence = createFixtureEvidence();

  return {
    id,
    revision: 1,
    title,
    regionId: 'greater-houston',
    region: cloneGreaterHoustonRegion(),
    source: createFixtureSource(),
    facts: createUnknownFacts(evidence),
    claimBoundary: 'Preview-only interface fixture. This is not an institution, provider listing, admissions offer, or source of factual opportunity information.',
    renderableMedia: {
      kind: 'illustration',
      assetPath,
      alt,
      label: 'Scholar Scout image',
      disclosure: SYNTHETIC_ILLUSTRATION_DISCLOSURE,
    },
    mediaFallback: false,
  };
}

function createFixtureSource(): SourceMetadata {
  return {
    sourceLabel: FIXTURE_SOURCE_LABEL,
    sourceUrl: FIXTURE_SOURCE_URL,
    sourceDate: { state: 'documented', value: FIXTURE_DATE },
    checkedAt: FIXTURE_DATE,
  };
}

function createFixtureEvidence(): FactEvidence {
  return {
    status: 'unknown',
    authority: 'scholarscout-preview-fixture',
    sourceLabel: FIXTURE_SOURCE_LABEL,
    sourceUrl: FIXTURE_SOURCE_URL,
    sourceDate: { state: 'documented', value: FIXTURE_DATE },
    reviewedAt: FIXTURE_DATE,
    verificationAction: 'This Preview-only fixture is not a provider record. Review the fixture note, not this card, for test context.',
  };
}

function createUnknownFacts(evidence: FactEvidence): CatalogueOpportunityCardFacts {
  const unknown = <Value,>(): CatalogueCardFact<Value> => ({
    value: null,
    state: 'unknown',
    evidence,
  });

  return {
    location: unknown<string>(),
    pathway: unknown(),
    skillTaught: unknown<string>(),
    trainingPayer: unknown<string>(),
    costOrTuition: unknown<string | number>(),
    duration: unknown<string>(),
    delivery: unknown(),
  };
}

function cloneGreaterHoustonRegion(): CatalogueRegion {
  const region = catalogueRegions.find((candidate) => candidate.id === 'greater-houston');
  if (!region) throw new Error('Greater Houston fixture region is unavailable.');

  return {
    ...region,
    officialBoundary: { ...region.officialBoundary, sourceDate: { ...region.officialBoundary.sourceDate } },
    localFocus: { ...region.localFocus, sourceDate: { ...region.localFocus.sourceDate } },
  };
}
