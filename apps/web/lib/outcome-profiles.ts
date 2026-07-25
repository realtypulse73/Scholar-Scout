export type OutcomeMetricName =
  | 'completion_rate'
  | 'transfer_rate'
  | 'placement_rate'
  | 'median_earnings'
  | 'retention_rate'
  | 'net_price';

export type OutcomeSourceType =
  | 'federal_public'
  | 'state_public'
  | 'institution_official'
  | 'partner_verified'
  | 'research_verified';

export type OutcomeConfidence = 'high' | 'medium' | 'low' | 'insufficient';

/**
 * The canonical, import-ready outcome-data row. These names intentionally match
 * the data dictionary used by staff imports and exports.
 */
export interface OutcomeMetricRecord {
  institution_id: string;
  program_CIP: string | null;
  metric_name: OutcomeMetricName;
  value: number | null;
  cohort_size: number | null;
  cohort_definition: string;
  as_of_date: string;
  source_url: string;
  source_type: OutcomeSourceType;
  confidence: OutcomeConfidence;
  suppression_reason: string | null;
}

export interface OutcomeProfile {
  program_id: string;
  institution_id: string;
  program_CIP: string | null;
  completion_rate: number | null;
  placement_rate: number | null;
  net_price: number | null;
  retention_rate: number | null;
  cohort_size: number | null;
  source_url: string | null;
  as_of_date: string | null;
  confidence: OutcomeConfidence;
  metrics: OutcomeMetricRecord[];
}

export interface OutcomeEvidenceStatus {
  isEligibleForPathwayScore: boolean;
  reasons: string[];
}

const PROFILE_METRICS: OutcomeMetricName[] = [
  'completion_rate',
  'placement_rate',
  'net_price',
  'retention_rate',
];
const RATE_METRICS = new Set<OutcomeMetricName>([
  'completion_rate',
  'transfer_rate',
  'placement_rate',
  'retention_rate',
]);
const CONFIDENCE_RANK: Record<OutcomeConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
  insufficient: 0,
};
const HIGH_CONFIDENCE_SOURCES = new Set<OutcomeSourceType>([
  'federal_public',
  'state_public',
  'institution_official',
  'partner_verified',
  'research_verified',
]);

/**
 * Validates imported program outcome rows before they are added to the data
 * store. Suppressed values remain null and must state why.
 */
export function validateOutcomeMetricRecord(record: OutcomeMetricRecord): string[] {
  const errors: string[] = [];

  if (!record.institution_id.trim()) errors.push('institution_id is required.');
  if (!record.cohort_definition.trim()) errors.push('cohort_definition is required.');
  if (!record.source_url.trim()) errors.push('source_url is required.');
  if (!isDate(record.as_of_date)) errors.push('as_of_date must be an ISO date.');

  if (record.value === null && !record.suppression_reason?.trim()) {
    errors.push('suppression_reason is required when value is unavailable.');
  }
  if (record.value !== null && record.suppression_reason) {
    errors.push('suppression_reason must be null when value is present.');
  }
  if (record.value !== null && !Number.isFinite(record.value)) {
    errors.push('value must be a finite number when present.');
  }
  if (
    record.value !== null &&
    RATE_METRICS.has(record.metric_name) &&
    (record.value < 0 || record.value > 100)
  ) {
    errors.push(`${record.metric_name} must be between 0 and 100.`);
  }
  if (
    record.value !== null &&
    !RATE_METRICS.has(record.metric_name) &&
    record.value < 0
  ) {
    errors.push(`${record.metric_name} cannot be negative.`);
  }
  if (record.cohort_size !== null && (!Number.isInteger(record.cohort_size) || record.cohort_size < 1)) {
    errors.push('cohort_size must be a positive whole number when present.');
  }

  return errors;
}

/**
 * Produces one auditable profile per ScholarScout program. It does not fill in
 * unavailable outcomes, blend program data with school-wide data, or infer
 * student likelihood from protected traits.
 */
export function createOutcomeProfile(
  programId: string,
  records: OutcomeMetricRecord[],
): OutcomeProfile {
  const sortedRecords = [...records].sort(compareRecords);
  const anchor = sortedRecords[0];

  if (!anchor) {
    return emptyOutcomeProfile(programId);
  }

  const selected = new Map<OutcomeMetricName, OutcomeMetricRecord>();
  for (const metric of PROFILE_METRICS) {
    const record = sortedRecords.find((candidate) => candidate.metric_name === metric);
    if (record) selected.set(metric, record);
  }

  const profileRecords = Array.from(selected.values());
  const profileConfidence = getLowestConfidence(profileRecords);
  const sourceUrls = new Set(profileRecords.map((record) => record.source_url));

  return {
    program_id: programId,
    institution_id: anchor.institution_id,
    program_CIP: anchor.program_CIP,
    completion_rate: selected.get('completion_rate')?.value ?? null,
    placement_rate: selected.get('placement_rate')?.value ?? null,
    net_price: selected.get('net_price')?.value ?? null,
    retention_rate: selected.get('retention_rate')?.value ?? null,
    cohort_size: getSmallestCohort(profileRecords),
    source_url: sourceUrls.size === 1 ? anchor.source_url : null,
    as_of_date: getOldestDate(profileRecords),
    confidence: profileConfidence,
    metrics: sortedRecords,
  };
}

/**
 * Allows historical program outcomes into scoring only when every required
 * metric is current, public/verified, unsuppressed, and based on a meaningful
 * cohort. The result is evidence eligibility, not a student prediction.
 */
export function assessOutcomeEvidence(
  profile: OutcomeProfile | null,
  referenceDate = new Date(),
): OutcomeEvidenceStatus {
  if (!profile) {
    return { isEligibleForPathwayScore: false, reasons: ['No outcome profile is available for this program.'] };
  }

  const reasons: string[] = [];
  for (const metricName of PROFILE_METRICS) {
    const record = profile.metrics.find((candidate) => candidate.metric_name === metricName);

    if (!record) {
      reasons.push(`Missing ${metricName} evidence.`);
      continue;
    }
    if (record.value === null) {
      reasons.push(`${metricName} is suppressed or unavailable.`);
    }
    if (record.confidence !== 'high') {
      reasons.push(`${metricName} is not high confidence.`);
    }
    if (!HIGH_CONFIDENCE_SOURCES.has(record.source_type)) {
      reasons.push(`${metricName} source type is not approved.`);
    }
    if (record.cohort_size === null || record.cohort_size < 30) {
      reasons.push(`${metricName} is based on fewer than 30 students or has no cohort size.`);
    }
    if (!isCurrent(record.as_of_date, referenceDate)) {
      reasons.push(`${metricName} is more than two years old or has an invalid date.`);
    }
  }

  return { isEligibleForPathwayScore: reasons.length === 0, reasons };
}

function emptyOutcomeProfile(programId: string): OutcomeProfile {
  return {
    program_id: programId,
    institution_id: '',
    program_CIP: null,
    completion_rate: null,
    placement_rate: null,
    net_price: null,
    retention_rate: null,
    cohort_size: null,
    source_url: null,
    as_of_date: null,
    confidence: 'insufficient',
    metrics: [],
  };
}

function compareRecords(a: OutcomeMetricRecord, b: OutcomeMetricRecord) {
  return (
    CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] ||
    b.as_of_date.localeCompare(a.as_of_date) ||
    (b.cohort_size ?? 0) - (a.cohort_size ?? 0)
  );
}

function getLowestConfidence(records: OutcomeMetricRecord[]): OutcomeConfidence {
  if (records.length !== PROFILE_METRICS.length) return 'insufficient';
  return records.reduce<OutcomeConfidence>((lowest, record) =>
    CONFIDENCE_RANK[record.confidence] < CONFIDENCE_RANK[lowest]
      ? record.confidence
      : lowest,
  'high');
}

function getSmallestCohort(records: OutcomeMetricRecord[]) {
  const cohorts = records.map((record) => record.cohort_size).filter((value): value is number => value !== null);
  return cohorts.length === records.length ? Math.min(...cohorts) : null;
}

function getOldestDate(records: OutcomeMetricRecord[]) {
  return records.length === PROFILE_METRICS.length
    ? records.map((record) => record.as_of_date).sort()[0] ?? null
    : null;
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isCurrent(value: string, referenceDate: Date) {
  if (!isDate(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  const cutoff = new Date(referenceDate);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  return date >= cutoff && date <= referenceDate;
}
