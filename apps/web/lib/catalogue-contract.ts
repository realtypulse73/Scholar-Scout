export const CATALOGUE_REGION_IDS = [
  'greater-houston',
  'greater-chicago',
  'greater-buffalo',
  'greater-atlanta',
  'greater-new-orleans',
  'greater-kingston-jamaica',
] as const;

export const CATALOGUE_PATHWAYS = [
  'university',
  'community-college',
  'trade-career-school',
  'registered-apprenticeship',
  'employer-linked-training',
  'military-information',
] as const;

export const CATALOGUE_FRESHNESS_POLICY = {
  operationalFactMaxAgeDays: 183,
  boundaryMaxAgeDays: 731,
} as const;

/** The fixed radius used for deterministic great-circle calculations. */
export const EARTH_RADIUS_MILES = 3958.7613;

const MILLISECONDS_PER_DAY = 86_400_000;

export type CatalogueRegionId = (typeof CATALOGUE_REGION_IDS)[number];
export type CataloguePathway = (typeof CATALOGUE_PATHWAYS)[number];
export type CoverageState = 'verified' | 'not-yet-verified';
export type FreshnessKind = 'operational' | 'boundary';
export type FreshnessStatus = 'current' | 'needs-confirmation' | 'unknown';
export type BoundaryAuthority =
  | 'us-census-omb-cbsa'
  | 'statin-kingston-metropolitan-area';

export type SourceDate =
  | { state: 'documented'; value: string }
  | { state: 'unavailable'; value: null };

export type FactStatus = 'current' | 'needs-confirmation' | 'unknown' | 'conflicting';
export type FactAuthority =
  | 'provider-official'
  | 'employer-official'
  | 'government-official'
  | 'workforce-authority';

export interface SourceMetadata {
  sourceLabel: string;
  sourceUrl: string;
  sourceDate: SourceDate;
  checkedAt: string;
}

/** Provenance and review state for one independently material catalogue fact. */
export interface FactEvidence {
  status: FactStatus;
  authority: FactAuthority;
  sourceLabel: string;
  sourceUrl: string;
  sourceDate: SourceDate;
  reviewedAt: string;
  verificationAction: string;
}

/** A material value that remains separate from its evidence and review state. */
export interface SourcedFact<Value> {
  value?: Value;
  evidence: FactEvidence;
}

export type EmploymentCommitmentState =
  | 'no-published-guarantee'
  | 'published-provider-statement'
  | 'unknown'
  | 'conflicting';

/**
 * Factual employer-paid training disclosures. This shape is intentionally
 * limited to the controlled employer-linked pathway and does not infer a job
 * or salary outcome from training-pay evidence.
 */
export interface EmployerTrainingFacts {
  pathway: 'employer-linked-training';
  taughtSkill: SourcedFact<string>;
  trainingPayer: 'employer';
  traineePay: SourcedFact<string>;
  employmentCommitment: EmploymentCommitmentState;
  employmentCommitmentEvidence: FactEvidence;
}

export const WAGE_CONTEXT_INFORMATIONAL_LABEL =
  'Occupation-and-area wage context only — not an offer or forecast.';

/** Dated public wage context, separate from a provider offer or learner outcome. */
export interface OccupationAreaWageContext {
  occupation: string;
  area: string;
  wage: SourcedFact<string>;
  informationalLabel: typeof WAGE_CONTEXT_INFORMATIONAL_LABEL;
}

export type CatalogueDelivery = 'in-person' | 'online' | 'hybrid';

/** An unavailable first-view fact that stays visibly non-current and actionable. */
export interface UnresolvedCatalogueCardFact {
  value: null;
  state: Exclude<FactStatus, 'current'>;
  evidence: FactEvidence;
}

export type CatalogueCardFact<Value> = SourcedFact<Value> | UnresolvedCatalogueCardFact;

/**
 * Domain-only first-view facts for a future opportunity card. This is not a
 * provider inventory, route payload, source client, or student profile.
 */
export interface CatalogueOpportunityCardFacts {
  location: CatalogueCardFact<string>;
  pathway: CatalogueCardFact<CataloguePathway>;
  skillTaught: CatalogueCardFact<string>;
  trainingPayer: CatalogueCardFact<string>;
  costOrTuition: CatalogueCardFact<string | number>;
  duration: CatalogueCardFact<string>;
  delivery: CatalogueCardFact<CatalogueDelivery>;
}

export interface OfficialBoundary extends SourceMetadata {
  authority: BoundaryAuthority;
  boundaryId: string | null;
  boundaryVersion: string;
}

export interface LocalFocus extends SourceMetadata {
  authority: string;
  anchorLabel: string;
  latitude: number;
  longitude: number;
  radiusMiles: 10;
}

export interface CatalogueRegion {
  id: CatalogueRegionId;
  label: string;
  officialBoundary: OfficialBoundary;
  localFocus: LocalFocus;
}

export interface VerifiedCatalogueCoverage {
  regionId: CatalogueRegionId;
  pathway: CataloguePathway;
  state: 'verified';
  reviewedAt: string;
  evidence: FactEvidence;
}

export interface UnverifiedCatalogueCoverage {
  regionId: CatalogueRegionId;
  pathway: CataloguePathway;
  state: 'not-yet-verified';
  reviewedAt: string;
  evidence?: never;
  sourceUrl?: never;
}

export type CatalogueCoverage = VerifiedCatalogueCoverage | UnverifiedCatalogueCoverage;

const REGION_BOUNDARY_REQUIREMENTS: Readonly<Record<CatalogueRegionId, {
  authority: BoundaryAuthority;
  boundaryId: string | null;
}>> = {
  'greater-houston': { authority: 'us-census-omb-cbsa', boundaryId: '26420' },
  'greater-chicago': { authority: 'us-census-omb-cbsa', boundaryId: '16980' },
  'greater-buffalo': { authority: 'us-census-omb-cbsa', boundaryId: '15380' },
  'greater-atlanta': { authority: 'us-census-omb-cbsa', boundaryId: '12060' },
  'greater-new-orleans': { authority: 'us-census-omb-cbsa', boundaryId: '35380' },
  'greater-kingston-jamaica': {
    authority: 'statin-kingston-metropolitan-area',
    boundaryId: null,
  },
};

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Returns the stable key for one region/pathway coverage cell.
 */
export function createCoverageKey(
  regionId: CatalogueRegionId,
  pathway: CataloguePathway,
): string {
  return `${regionId}:${pathway}`;
}

/**
 * Classifies source freshness using the supplied clock. An unavailable,
 * malformed, incomplete, or future source date is never current.
 */
export function getFreshnessStatus(
  metadata: SourceMetadata,
  kind: FreshnessKind,
  now: Date,
): FreshnessStatus {
  const sourceDate = getDocumentedDate(metadata.sourceDate);
  if (!sourceDate || !isValidDate(now)) return 'unknown';

  const nowTime = now.getTime();
  if (sourceDate.getTime() > nowTime) return 'unknown';

  const maxAgeDays = kind === 'boundary'
    ? CATALOGUE_FRESHNESS_POLICY.boundaryMaxAgeDays
    : CATALOGUE_FRESHNESS_POLICY.operationalFactMaxAgeDays;
  const ageDays = (nowTime - sourceDate.getTime()) / MILLISECONDS_PER_DAY;

  return ageDays <= maxAgeDays ? 'current' : 'needs-confirmation';
}

/**
 * Validates public source metadata without replacing an unavailable date with
 * an invented documented date.
 */
export function validateSourceMetadata(metadata: unknown): string[] {
  if (!isRecord(metadata)) {
    return ['Source metadata must be an object.'];
  }

  const errors: string[] = [];

  if (!hasText(metadata?.sourceLabel)) {
    errors.push('Source label is required.');
  }
  if (!isHttpUrl(metadata.sourceUrl)) {
    errors.push('Source URL must use http:// or https://.');
  }
  if (!isSourceDate(metadata.sourceDate)) {
    errors.push('Source date must be documented with an ISO calendar date or explicitly unavailable.');
  }
  if (!isIsoCalendarDate(metadata.checkedAt)) {
    errors.push('Checked date must be an ISO calendar date.');
  }
  if (isSourceDate(metadata.sourceDate) && isIsoCalendarDate(metadata.checkedAt)) {
    const documentedSourceDate = getDocumentedDate(metadata.sourceDate);
    const checkedDate = getIsoDate(metadata.checkedAt);

    if (documentedSourceDate && checkedDate && checkedDate.getTime() < documentedSourceDate.getTime()) {
      errors.push('Checked date cannot precede the documented source date.');
    }
  }

  return errors;
}

/**
 * Validates evidence for one material fact against a supplied clock. A current
 * status is only valid when its documented source date is within the
 * operational freshness window; unresolved states stay explicit.
 */
export function validateFactEvidence(evidence: FactEvidence, now: Date): string[] {
  if (!isValidDate(now)) return [VALIDATION_CLOCK_ERROR];

  const errors: string[] = [];
  const documentedSourceDate = getDocumentedDate(evidence?.sourceDate);
  const reviewedDate = getIsoDate(evidence?.reviewedAt);

  if (!isFactStatus(evidence?.status)) {
    errors.push('Fact status is unsupported.');
  }
  if (!isFactAuthority(evidence?.authority)) {
    errors.push('Fact authority is unsupported.');
  }
  if (!hasText(evidence?.sourceLabel)) {
    errors.push('Fact source label is required.');
  }
  if (!isHttpUrl(evidence?.sourceUrl)) {
    errors.push('Fact source URL must use http:// or https://.');
  }
  if (!isSourceDate(evidence?.sourceDate)) {
    errors.push('Fact source date must be documented with an ISO calendar date or explicitly unavailable.');
  }
  if (!reviewedDate) {
    errors.push('Fact review date must be an ISO calendar date.');
  } else if (isValidDate(now) && reviewedDate.getTime() > now.getTime()) {
    errors.push('Fact review date cannot be in the future.');
  }
  if (!hasText(evidence?.verificationAction)) {
    errors.push('Fact verification action is required.');
  }

  if (documentedSourceDate && isValidDate(now) && documentedSourceDate.getTime() > now.getTime()) {
    errors.push('Fact source date cannot be in the future.');
  }
  if (documentedSourceDate && reviewedDate && reviewedDate.getTime() < documentedSourceDate.getTime()) {
    errors.push('Fact review date cannot precede the documented source date.');
  }

  if (evidence?.status === 'current') {
    if (evidence.sourceDate?.state !== 'documented' || !isIsoCalendarDate(evidence.sourceDate.value)) {
      errors.push('Current facts require a documented source date.');
    } else if (isValidDate(now)) {
      const freshness = getFreshnessStatus({
        sourceLabel: evidence.sourceLabel,
        sourceUrl: evidence.sourceUrl,
        sourceDate: evidence.sourceDate,
        checkedAt: evidence.reviewedAt,
      }, 'operational', now);
      if (freshness !== 'current') {
        errors.push('Current facts require source evidence within the operational freshness window.');
      }
    }
  }

  return errors;
}

/**
 * Validates employer-paid training disclosures without turning a trainee-pay
 * fact into a promise of employment or future compensation.
 */
export function validateEmployerTrainingFacts(
  facts: EmployerTrainingFacts,
  now: Date,
): string[] {
  if (!isValidDate(now)) return [VALIDATION_CLOCK_ERROR];

  const errors: string[] = [];

  if (facts?.pathway !== 'employer-linked-training') {
    errors.push('Employer training facts require the employer-linked-training pathway.');
  }
  if (facts?.trainingPayer !== 'employer') {
    errors.push('Employer training facts require employer as the training payer.');
  }
  errors.push(...validateSourcedTextFact('Taught skill', facts?.taughtSkill, now));
  errors.push(...validateSourcedTextFact('Trainee pay', facts?.traineePay, now));

  if (!isEmploymentCommitmentState(facts?.employmentCommitment)) {
    errors.push('Employment commitment state is unsupported.');
  }
  if (!facts?.employmentCommitmentEvidence) {
    errors.push('Employment commitment evidence is required.');
  } else {
    errors.push(...prefixErrors(
      'Employment commitment',
      validateFactEvidence(facts.employmentCommitmentEvidence, now),
    ));
    if (isEmploymentCommitmentState(facts.employmentCommitment)
      && !isCompatibleEmploymentCommitmentEvidence(
        facts.employmentCommitment,
        facts.employmentCommitmentEvidence.status,
      )) {
      errors.push('Employment commitment state must match its evidence status.');
    }
  }

  return errors;
}

/**
 * Validates independent occupation-and-area wage context. Its fixed label
 * prevents consumers from treating it as an individual offer or forecast.
 */
export function validateOccupationAreaWageContext(
  context: OccupationAreaWageContext,
  now: Date,
): string[] {
  if (!isValidDate(now)) return [VALIDATION_CLOCK_ERROR];

  const errors: string[] = [];

  if (!hasText(context?.occupation)) {
    errors.push('Wage context occupation is required.');
  }
  if (!hasText(context?.area)) {
    errors.push('Wage context area is required.');
  }
  errors.push(...validateSourcedTextFact('Wage context', context?.wage, now));
  if (context?.informationalLabel !== WAGE_CONTEXT_INFORMATIONAL_LABEL) {
    errors.push('Wage context must use the informational-only label.');
  }

  return errors;
}

/**
 * Validates the complete non-sensitive first-view card boundary. Each fact is
 * independently sourced or explicitly unresolved with a visible next action.
 */
export function validateCatalogueOpportunityCardFacts(
  facts: Partial<CatalogueOpportunityCardFacts>,
  now: Date,
): string[] {
  if (!isValidDate(now)) return [VALIDATION_CLOCK_ERROR];

  const errors: string[] = [];

  errors.push(...validateCatalogueCardFact('Location', facts?.location, now));
  errors.push(...validateCatalogueCardFact('Pathway', facts?.pathway, now, isCataloguePathway));
  errors.push(...validateCatalogueCardFact('Skill taught', facts?.skillTaught, now));
  errors.push(...validateCatalogueCardFact('Training payer', facts?.trainingPayer, now));
  errors.push(...validateCatalogueCardFact('Cost or tuition', facts?.costOrTuition, now));
  errors.push(...validateCatalogueCardFact('Duration', facts?.duration, now));
  errors.push(...validateCatalogueCardFact('Delivery', facts?.delivery, now, isCatalogueDelivery));

  return errors;
}

/**
 * Produces a public verification state from valid constituent facts only. It
 * never represents provider quality, eligibility, rank, or any outcome.
 */
export function getOpportunityCardVerificationStatus(
  facts: Partial<CatalogueOpportunityCardFacts>,
  now: Date,
): FactStatus {
  if (validateCatalogueOpportunityCardFacts(facts, now).length > 0) {
    return 'unknown';
  }

  const states = [
    getCatalogueCardFactStatus(facts.location),
    getCatalogueCardFactStatus(facts.pathway),
    getCatalogueCardFactStatus(facts.skillTaught),
    getCatalogueCardFactStatus(facts.trainingPayer),
    getCatalogueCardFactStatus(facts.costOrTuition),
    getCatalogueCardFactStatus(facts.duration),
    getCatalogueCardFactStatus(facts.delivery),
  ];

  if (states.includes('conflicting')) return 'conflicting';
  if (states.includes('unknown')) return 'unknown';
  if (states.includes('needs-confirmation')) return 'needs-confirmation';

  return 'current';
}

/**
 * Validates the distinct official-boundary and local-focus records for a
 * region. The local focus is straight-line geographic scope only; it is not a
 * commute estimate or a replacement for the official regional boundary.
 */
export function validateCatalogueRegion(region: unknown): string[] {
  if (!isRecord(region)) {
    return ['Catalogue region must be an object.'];
  }

  const errors: string[] = [];

  if (!isCatalogueRegionId(region.id)) {
    errors.push('Region ID is unsupported.');
  }
  if (!hasText(region.label)) {
    errors.push('Region label is required.');
  }
  const boundaryRequirement = isCatalogueRegionId(region.id)
    ? REGION_BOUNDARY_REQUIREMENTS[region.id]
    : undefined;
  if (!isRecord(region.officialBoundary)) {
    errors.push('Official boundary must be an object.');
  } else {
    const officialBoundary = region.officialBoundary;

    if (!isBoundaryAuthority(officialBoundary.authority)) {
      errors.push('Official boundary authority is unsupported.');
    }
    if (typeof officialBoundary.boundaryId !== 'string' && officialBoundary.boundaryId !== null) {
      errors.push('Official boundary ID must be a string or null.');
    }
    if (boundaryRequirement
      && (officialBoundary.authority !== boundaryRequirement.authority
        || officialBoundary.boundaryId !== boundaryRequirement.boundaryId)) {
      errors.push('Official boundary authority and ID must match the declared region.');
    }
    if (!hasText(officialBoundary.boundaryVersion)) {
      errors.push('Official boundary version is required.');
    }
    errors.push(...prefixErrors('Official boundary', validateSourceMetadata(officialBoundary)));
  }

  if (!isRecord(region.localFocus)) {
    errors.push('Local focus must be an object.');
  } else {
    const localFocus = region.localFocus;

    if (!hasText(localFocus.authority)) {
      errors.push('Local focus authority is required.');
    }
    if (!hasText(localFocus.anchorLabel)) {
      errors.push('Local focus anchor label is required.');
    }
    if (!isValidCoordinate(localFocus)) {
      errors.push('Local focus coordinates must be finite latitude/longitude values.');
    }
    if (localFocus.radiusMiles !== 10) {
      errors.push('Local focus radius must be exactly 10 miles.');
    }
    errors.push(...prefixErrors('Local focus', validateSourceMetadata(localFocus)));
  }

  return errors;
}

/**
 * Calculates straight-line great-circle miles. Invalid coordinates return
 * null rather than producing a misleading distance.
 */
export function calculateGreatCircleMiles(
  from: GeoCoordinate,
  to: GeoCoordinate,
): number | null {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) return null;

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitudeValue = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitudeValue) * Math.sin(longitudeDelta / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  const centralAngle = 2 * Math.atan2(
    Math.sqrt(boundedHaversine),
    Math.sqrt(1 - boundedHaversine),
  );

  return EARTH_RADIUS_MILES * centralAngle;
}

/**
 * Checks the documented ten-mile local focus using straight-line geographic
 * distance. It is not a commute estimate or a regional-boundary replacement.
 */
export function isWithinLocalFocus(
  localFocus: LocalFocus,
  location: GeoCoordinate,
): boolean {
  const distance = calculateGreatCircleMiles(localFocus, location);

  return distance !== null && distance <= localFocus.radiusMiles;
}

/**
 * Validates explicit coverage rows. Expected pairs are ordered by the
 * controlled region and pathway constants, never by caller input order.
 */
export function validateCoverageMatrix(
  regions: readonly unknown[] | null | undefined,
  coverage: readonly unknown[] | null | undefined,
  now: Date,
): string[] {
  if (!isValidDate(now)) return [VALIDATION_CLOCK_ERROR];

  const errors: string[] = [];
  const regionList = Array.isArray(regions) ? regions : [];
  const coverageList = Array.isArray(coverage) ? coverage : [];

  if (regionList.length === 0) {
    errors.push('At least one catalogue region is required.');
  }
  if (coverageList.length === 0) {
    errors.push('At least one catalogue coverage row is required.');
  }

  const validRegions: CatalogueRegion[] = [];
  for (const candidate of regionList) {
    if (!isRecord(candidate)) {
      errors.push('Catalogue region must be an object.');
      continue;
    }

    const regionErrors = validateCatalogueRegion(candidate);
    errors.push(...regionErrors);
    if (regionErrors.length === 0) {
      validRegions.push(candidate as unknown as CatalogueRegion);
    }
  }
  const regionIds = new Set<CatalogueRegionId>();
  for (const regionId of CATALOGUE_REGION_IDS) {
    const count = validRegions.filter((region) => region.id === regionId).length;
    if (count > 1) errors.push(`Duplicate catalogue region: ${regionId}.`);
    if (count > 0) regionIds.add(regionId);
  }
  const unknownRegionIds = validRegions
    .map((region) => region.id)
    .filter((regionId) => !isCatalogueRegionId(regionId))
    .sort();
  for (const regionId of new Set(unknownRegionIds)) {
    errors.push(`Unsupported catalogue region: ${regionId}.`);
  }

  const coverageByKey = new Map<string, CatalogueCoverage[]>();
  const invalidCoverageErrors = new Set<string>();
  const validCoverageRows = coverageList.filter((row): row is CatalogueCoverage => {
    if (isRecord(row)) return true;

    errors.push('Catalogue coverage row must be an object.');
    return false;
  });
  for (const row of validCoverageRows) {
    const regionId = row.regionId as string;
    const pathway = row.pathway as string;
    const key = `${regionId}:${pathway}`;
    const rows = coverageByKey.get(key) ?? [];
    rows.push(row);
    coverageByKey.set(key, rows);

    if (!isCatalogueRegionId(regionId)) {
      invalidCoverageErrors.add(`Unsupported coverage region: ${regionId}.`);
    } else if (!regionIds.has(regionId)) {
      invalidCoverageErrors.add(`Coverage region is not declared: ${regionId}.`);
    }
    if (!isCataloguePathway(pathway)) {
      invalidCoverageErrors.add(`Unsupported coverage pathway: ${pathway}.`);
    }
    if (row.state !== 'verified' && row.state !== 'not-yet-verified') {
      invalidCoverageErrors.add(`Unsupported coverage state for ${key}.`);
    }
    const reviewedDate = getIsoDate(row.reviewedAt);
    if (!reviewedDate) {
      invalidCoverageErrors.add(`Coverage review date must be an ISO calendar date for ${key}.`);
    } else if (isValidDate(now) && reviewedDate.getTime() > now.getTime()) {
      invalidCoverageErrors.add(`Coverage review date cannot be in the future for ${key}.`);
    }
    if (row.state === 'verified') {
      if (!isRecord(row.evidence) || row.evidence.status !== 'current') {
        invalidCoverageErrors.add(`Verified coverage requires current attributable evidence for ${key}.`);
      } else {
        const evidence = row.evidence as FactEvidence;
        for (const error of validateFactEvidence(evidence, now)) {
          invalidCoverageErrors.add(`Coverage evidence for ${key}: ${error}`);
        }
        if (reviewedDate) {
          const evidenceReviewedDate = getIsoDate(evidence.reviewedAt);
          if (evidenceReviewedDate && reviewedDate.getTime() < evidenceReviewedDate.getTime()) {
            invalidCoverageErrors.add(
              `Coverage review date cannot precede evidence review date for ${key}.`,
            );
          }
          const evidenceSourceDate = getDocumentedDate(evidence.sourceDate);
          if (evidenceSourceDate && reviewedDate.getTime() < evidenceSourceDate.getTime()) {
            invalidCoverageErrors.add(
              `Coverage review date cannot precede documented evidence source date for ${key}.`,
            );
          }
        }
      }
    } else if (row.state === 'not-yet-verified') {
      if (Object.prototype.hasOwnProperty.call(row, 'evidence')) {
        invalidCoverageErrors.add(`Not-yet-verified coverage cannot include evidence for ${key}.`);
      }
      if (Object.prototype.hasOwnProperty.call(row, 'sourceUrl')) {
        invalidCoverageErrors.add(`Not-yet-verified coverage cannot include a source URL for ${key}.`);
      }
    }
  }
  errors.push(...[...invalidCoverageErrors].sort());

  for (const regionId of CATALOGUE_REGION_IDS) {
    if (!regionIds.has(regionId)) continue;
    for (const pathway of CATALOGUE_PATHWAYS) {
      const key = createCoverageKey(regionId, pathway);
      const rows = coverageByKey.get(key) ?? [];
      if (rows.length > 1) errors.push(`Duplicate catalogue coverage: ${key}.`);
      if (rows.length === 0) errors.push(`Missing catalogue coverage: ${key}.`);
    }
  }

  return errors;
}

function getDocumentedDate(sourceDate: SourceDate): Date | null {
  if (sourceDate?.state !== 'documented' || !isIsoCalendarDate(sourceDate.value)) {
    return null;
  }

  return getIsoDate(sourceDate.value);
}

function getIsoDate(value: unknown): Date | null {
  if (!isIsoCalendarDate(value)) return null;

  return new Date(`${value}T00:00:00.000Z`);
}

function isSourceDate(sourceDate: unknown): sourceDate is SourceDate {
  return isRecord(sourceDate)
    && ((sourceDate.state === 'documented' && isIsoCalendarDate(sourceDate.value))
      || (sourceDate.state === 'unavailable' && sourceDate.value === null));
}

function isFactStatus(value: unknown): value is FactStatus {
  return value === 'current'
    || value === 'needs-confirmation'
    || value === 'unknown'
    || value === 'conflicting';
}

function isFactAuthority(value: unknown): value is FactAuthority {
  return value === 'provider-official'
    || value === 'employer-official'
    || value === 'government-official'
    || value === 'workforce-authority';
}

function isEmploymentCommitmentState(value: unknown): value is EmploymentCommitmentState {
  return value === 'no-published-guarantee'
    || value === 'published-provider-statement'
    || value === 'unknown'
    || value === 'conflicting';
}

function isCompatibleEmploymentCommitmentEvidence(
  commitment: EmploymentCommitmentState,
  status: unknown,
): boolean {
  if (commitment === 'no-published-guarantee' || commitment === 'published-provider-statement') {
    return status === 'current' || status === 'needs-confirmation';
  }

  return commitment === status;
}

function validateSourcedTextFact(
  label: string,
  fact: SourcedFact<string> | undefined,
  now: Date,
): string[] {
  const errors: string[] = [];

  if (typeof fact?.value !== 'string' || !fact.value.trim()) {
    errors.push(`${label} value is required.`);
  }
  if (!fact?.evidence) {
    errors.push(`${label} evidence is required.`);
  } else {
    errors.push(...prefixErrors(label, validateFactEvidence(fact.evidence, now)));
  }

  return errors;
}

function validateCatalogueCardFact<Value>(
  label: string,
  fact: CatalogueCardFact<Value> | undefined,
  now: Date,
  isSupportedValue?: (value: unknown) => boolean,
): string[] {
  const errors: string[] = [];

  if (!fact) {
    errors.push(`${label} card fact is required.`);
    return errors;
  }
  if (!isRecord(fact) || !('evidence' in fact)) {
    errors.push(`${label} must be a sourced or explicitly unresolved card fact.`);
    return errors;
  }
  if (!isRecord(fact.evidence)) {
    errors.push(`${label} evidence must be an object.`);
    return errors;
  }

  if (isUnresolvedCatalogueCardFact(fact)) {
    if (fact.value !== null) {
      errors.push(`${label} unresolved card facts must have a null value.`);
    }
    if (!isUnresolvedFactStatus(fact.state)) {
      errors.push(`${label} unresolved state is unsupported.`);
    }
    if (fact.evidence.status !== fact.state) {
      errors.push(`${label} unresolved state must match its evidence status.`);
    }
    errors.push(...prefixErrors(label, validateFactEvidence(fact.evidence, now)));
    return errors;
  }

  if (!hasMaterialValue(fact.value)) {
    errors.push(`${label} value is required.`);
  } else if (isSupportedValue && !isSupportedValue(fact.value)) {
    errors.push(`${label} value is unsupported.`);
  }
  errors.push(...prefixErrors(label, validateFactEvidence(fact.evidence, now)));

  return errors;
}

function getCatalogueCardFactStatus(
  fact: CatalogueCardFact<unknown> | undefined,
): FactStatus {
  if (!fact) return 'unknown';

  return isUnresolvedCatalogueCardFact(fact) ? fact.state : fact.evidence.status;
}

function isUnresolvedCatalogueCardFact(
  fact: CatalogueCardFact<unknown>,
): fact is UnresolvedCatalogueCardFact {
  return isRecord(fact) && 'state' in fact;
}

function isUnresolvedFactStatus(value: unknown): value is Exclude<FactStatus, 'current'> {
  return value === 'needs-confirmation' || value === 'unknown' || value === 'conflicting';
}

function isCatalogueDelivery(value: unknown): value is CatalogueDelivery {
  return value === 'in-person' || value === 'online' || value === 'hybrid';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasMaterialValue(value: unknown): boolean {
  return (typeof value === 'string' && Boolean(value.trim()))
    || (typeof value === 'number' && Number.isFinite(value));
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isIsoCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const VALIDATION_CLOCK_ERROR = 'Validation clock must be a valid Date.';

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidCoordinate(coordinate: unknown): boolean {
  if (!isRecord(coordinate)
    || typeof coordinate.latitude !== 'number'
    || typeof coordinate.longitude !== 'number') {
    return false;
  }

  return Number.isFinite(coordinate.latitude)
    && Number.isFinite(coordinate.longitude)
    && coordinate.latitude >= -90
    && coordinate.latitude <= 90
    && coordinate.longitude >= -180
    && coordinate.longitude <= 180;
}

function isCatalogueRegionId(value: unknown): value is CatalogueRegionId {
  return typeof value === 'string' && CATALOGUE_REGION_IDS.includes(value as CatalogueRegionId);
}

function isCataloguePathway(value: unknown): value is CataloguePathway {
  return typeof value === 'string' && CATALOGUE_PATHWAYS.includes(value as CataloguePathway);
}

function isBoundaryAuthority(value: unknown): value is BoundaryAuthority {
  return value === 'us-census-omb-cbsa' || value === 'statin-kingston-metropolitan-area';
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function prefixErrors(prefix: string, errors: string[]): string[] {
  return errors.map((error) => `${prefix}: ${error}`);
}
