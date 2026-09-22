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

export interface CatalogueCoverage {
  regionId: CatalogueRegionId;
  pathway: CataloguePathway;
  state: CoverageState;
  reviewedAt: string;
  sourceUrl?: string;
}

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
export function validateSourceMetadata(metadata: SourceMetadata): string[] {
  const errors: string[] = [];

  if (!metadata.sourceLabel?.trim()) {
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

  return errors;
}

/**
 * Validates evidence for one material fact against a supplied clock. A current
 * status is only valid when its documented source date is within the
 * operational freshness window; unresolved states stay explicit.
 */
export function validateFactEvidence(evidence: FactEvidence, now: Date): string[] {
  const errors: string[] = [];

  if (!isFactStatus(evidence?.status)) {
    errors.push('Fact status is unsupported.');
  }
  if (!isFactAuthority(evidence?.authority)) {
    errors.push('Fact authority is unsupported.');
  }
  if (!evidence?.sourceLabel?.trim()) {
    errors.push('Fact source label is required.');
  }
  if (!isHttpUrl(evidence?.sourceUrl)) {
    errors.push('Fact source URL must use http:// or https://.');
  }
  if (!isSourceDate(evidence?.sourceDate)) {
    errors.push('Fact source date must be documented with an ISO calendar date or explicitly unavailable.');
  }
  if (!isIsoCalendarDate(evidence?.reviewedAt)) {
    errors.push('Fact review date must be an ISO calendar date.');
  } else if (isValidDate(now) && new Date(`${evidence.reviewedAt}T00:00:00.000Z`).getTime() > now.getTime()) {
    errors.push('Fact review date cannot be in the future.');
  }
  if (!evidence?.verificationAction?.trim()) {
    errors.push('Fact verification action is required.');
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
 * Validates the distinct official-boundary and local-focus records for a
 * region. The local focus is straight-line geographic scope only; it is not a
 * commute estimate or a replacement for the official regional boundary.
 */
export function validateCatalogueRegion(region: CatalogueRegion): string[] {
  const errors: string[] = [];

  if (!isCatalogueRegionId(region.id)) {
    errors.push('Region ID is unsupported.');
  }
  if (!region.label?.trim()) {
    errors.push('Region label is required.');
  }
  if (!isBoundaryAuthority(region.officialBoundary.authority)) {
    errors.push('Official boundary authority is unsupported.');
  }
  if (typeof region.officialBoundary.boundaryId !== 'string' && region.officialBoundary.boundaryId !== null) {
    errors.push('Official boundary ID must be a string or null.');
  }
  if (!region.officialBoundary.boundaryVersion?.trim()) {
    errors.push('Official boundary version is required.');
  }
  errors.push(...prefixErrors('Official boundary', validateSourceMetadata(region.officialBoundary)));

  if (!region.localFocus.authority?.trim()) {
    errors.push('Local focus authority is required.');
  }
  if (!region.localFocus.anchorLabel?.trim()) {
    errors.push('Local focus anchor label is required.');
  }
  if (!isValidCoordinate(region.localFocus)) {
    errors.push('Local focus coordinates must be finite latitude/longitude values.');
  }
  if (region.localFocus.radiusMiles !== 10) {
    errors.push('Local focus radius must be exactly 10 miles.');
  }
  errors.push(...prefixErrors('Local focus', validateSourceMetadata(region.localFocus)));

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
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

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
  regions: readonly CatalogueRegion[] | null | undefined,
  coverage: readonly CatalogueCoverage[] | null | undefined,
): string[] {
  const errors: string[] = [];
  const regionList = Array.isArray(regions) ? regions : [];
  const coverageList = Array.isArray(coverage) ? coverage : [];

  if (regionList.length === 0) {
    errors.push('At least one catalogue region is required.');
  }
  if (coverageList.length === 0) {
    errors.push('At least one catalogue coverage row is required.');
  }

  const regionIds = new Set<CatalogueRegionId>();
  for (const regionId of CATALOGUE_REGION_IDS) {
    const count = regionList.filter((region) => region.id === regionId).length;
    if (count > 1) errors.push(`Duplicate catalogue region: ${regionId}.`);
    if (count > 0) regionIds.add(regionId);
  }
  const unknownRegionIds = regionList
    .map((region) => region.id)
    .filter((regionId) => !isCatalogueRegionId(regionId))
    .sort();
  for (const regionId of new Set(unknownRegionIds)) {
    errors.push(`Unsupported catalogue region: ${regionId}.`);
  }

  const coverageByKey = new Map<string, CatalogueCoverage[]>();
  const invalidCoverageErrors = new Set<string>();
  for (const row of coverageList) {
    const regionId = row.regionId as string;
    const pathway = row.pathway as string;
    const key = `${regionId}:${pathway}`;
    const rows = coverageByKey.get(key) ?? [];
    rows.push(row);
    coverageByKey.set(key, rows);

    if (!isCatalogueRegionId(regionId)) {
      invalidCoverageErrors.add(`Unsupported coverage region: ${regionId}.`);
    }
    if (!isCataloguePathway(pathway)) {
      invalidCoverageErrors.add(`Unsupported coverage pathway: ${pathway}.`);
    }
    if (row.state !== 'verified' && row.state !== 'not-yet-verified') {
      invalidCoverageErrors.add(`Unsupported coverage state for ${key}.`);
    }
    if (!isIsoCalendarDate(row.reviewedAt)) {
      invalidCoverageErrors.add(`Coverage review date must be an ISO calendar date for ${key}.`);
    }
    if (row.sourceUrl !== undefined && !isHttpUrl(row.sourceUrl)) {
      invalidCoverageErrors.add(`Coverage source URL must use http:// or https:// for ${key}.`);
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

  return new Date(`${sourceDate.value}T00:00:00.000Z`);
}

function isSourceDate(sourceDate: SourceDate): boolean {
  return (sourceDate?.state === 'documented' && isIsoCalendarDate(sourceDate.value))
    || (sourceDate?.state === 'unavailable' && sourceDate.value === null);
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

function isIsoCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

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

function isValidCoordinate(coordinate: GeoCoordinate): boolean {
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
