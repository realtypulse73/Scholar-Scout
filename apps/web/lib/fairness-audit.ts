export interface FairnessAuditGroup {
  /** Aggregated audit label only. It must never be supplied to ranking code. */
  group_label: string;
  completion_predictions: Array<{ probability: number; actual: boolean }>;
  placement_predictions: Array<{ probability: number; actual: boolean }>;
}

export interface FairnessAuditMetric {
  group_label: string;
  sample_size: number;
  calibration_gap: number | null;
  false_negative_rate: number | null;
  suppressed: boolean;
}

export interface FairnessAuditReport {
  completion: FairnessAuditMetric[];
  placement: FairnessAuditMetric[];
  minimum_group_size: number;
  rankingInputAllowed: false;
}

/**
 * Produces an aggregated fairness audit. Protected attributes belong here only;
 * they are intentionally absent from student fit and pathway-score inputs.
 */
export function auditRecommendationFairness(
  groups: FairnessAuditGroup[],
  minimumGroupSize = 30,
): FairnessAuditReport {
  return {
    completion: groups.map((group) => summarize(group.group_label, group.completion_predictions, minimumGroupSize)),
    placement: groups.map((group) => summarize(group.group_label, group.placement_predictions, minimumGroupSize)),
    minimum_group_size: minimumGroupSize,
    rankingInputAllowed: false,
  };
}

function summarize(
  groupLabel: string,
  predictions: Array<{ probability: number; actual: boolean }>,
  minimumGroupSize: number,
): FairnessAuditMetric {
  if (predictions.length < minimumGroupSize) {
    return { group_label: groupLabel, sample_size: predictions.length, calibration_gap: null, false_negative_rate: null, suppressed: true };
  }

  const averagePrediction = predictions.reduce((total, item) => total + clamp(item.probability), 0) / predictions.length;
  const actualRate = (predictions.filter((item) => item.actual).length / predictions.length) * 100;
  const negatives = predictions.filter((item) => item.actual);
  const falseNegatives = negatives.filter((item) => clamp(item.probability) < 50).length;

  return {
    group_label: groupLabel,
    sample_size: predictions.length,
    calibration_gap: round(averagePrediction - actualRate),
    false_negative_rate: negatives.length ? round((falseNegatives / negatives.length) * 100) : null,
    suppressed: false,
  };
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
