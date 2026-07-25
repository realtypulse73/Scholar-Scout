export interface ShadowPredictionRecord {
  /** Opaque internal identifier; never a student name, email, or protected trait. */
  case_id: string;
  program_id: string;
  model_version: string;
  generated_at: string;
  completion_probability: number;
  placement_probability: number;
  observed_completion: boolean | null;
  observed_placement: boolean | null;
}

export interface ShadowModeReport {
  records: number;
  completion: OutcomePredictionReport;
  placement: OutcomePredictionReport;
  readyForRecommendationInfluence: boolean;
  reasons: string[];
}

export interface OutcomePredictionReport {
  observed: number;
  averagePrediction: number | null;
  actualRate: number | null;
  brierScore: number | null;
}

/**
 * Evaluates separate completion and placement predictions in shadow mode.
 * It intentionally does not rank or change a student's recommendation.
 */
export function evaluateShadowMode(
  records: ShadowPredictionRecord[],
  minimumObservationMonths = 6,
  now = new Date(),
): ShadowModeReport {
  const completion = summarizeOutcome(records, 'completion');
  const placement = summarizeOutcome(records, 'placement');
  const reasons: string[] = [];

  if (completion.observed < 30) reasons.push('Fewer than 30 observed completion outcomes are available.');
  if (placement.observed < 30) reasons.push('Fewer than 30 observed placement outcomes are available.');
  if (!hasObservedWindow(records, minimumObservationMonths, now)) {
    reasons.push(`Shadow mode has not yet observed ${minimumObservationMonths} months of predictions.`);
  }
  if (completion.brierScore !== null && completion.brierScore > 0.2) {
    reasons.push('Completion predictions are not calibrated tightly enough yet.');
  }
  if (placement.brierScore !== null && placement.brierScore > 0.2) {
    reasons.push('Placement predictions are not calibrated tightly enough yet.');
  }

  return {
    records: records.length,
    completion,
    placement,
    readyForRecommendationInfluence: reasons.length === 0,
    reasons,
  };
}

function summarizeOutcome(
  records: ShadowPredictionRecord[],
  outcome: 'completion' | 'placement',
): OutcomePredictionReport {
  const observed = records.filter((record) =>
    outcome === 'completion'
      ? record.observed_completion !== null
      : record.observed_placement !== null,
  );
  if (observed.length === 0) {
    return { observed: 0, averagePrediction: null, actualRate: null, brierScore: null };
  }

  const predictions = observed.map((record) =>
    (outcome === 'completion' ? record.completion_probability : record.placement_probability) / 100,
  );
  const actuals = observed.map((record) =>
    (outcome === 'completion' ? record.observed_completion : record.observed_placement) ? 1 : 0,
  );
  const totalPrediction = predictions.reduce((total, value) => total + value, 0);
  const totalActual = actuals.reduce<number>((total, value) => total + value, 0);
  const squaredError = predictions.reduce(
    (total, prediction, index) => total + (prediction - actuals[index]) ** 2,
    0,
  );

  return {
    observed: observed.length,
    averagePrediction: round(totalPrediction / observed.length),
    actualRate: round((totalActual / observed.length) * 100),
    brierScore: round(squaredError / observed.length),
  };
}

function hasObservedWindow(records: ShadowPredictionRecord[], months: number, now: Date) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  return records.some((record) => {
    const generatedAt = new Date(record.generated_at);
    return !Number.isNaN(generatedAt.getTime()) && generatedAt <= cutoff;
  });
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
