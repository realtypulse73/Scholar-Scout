import { auditRecommendationFairness } from '@/lib/fairness-audit';
import { evaluateShadowMode, type ShadowPredictionRecord } from '@/lib/shadow-mode';

const records: ShadowPredictionRecord[] = Array.from({ length: 30 }, (_, index) => ({
  case_id: `case-${index}`,
  program_id: 'nursing-aas',
  model_version: 'shadow-v1',
  generated_at: '2026-01-01T00:00:00.000Z',
  completion_probability: 80,
  placement_probability: index < 21 ? 100 : 0,
  observed_completion: index < 24,
  observed_placement: index < 21,
}));

describe('shadow-mode evaluation', () => {
  it('measures completion and placement separately without changing rankings', () => {
    const report = evaluateShadowMode(records, 6, new Date('2026-07-25'));

    expect(report).toMatchObject({
      completion: { observed: 30, actualRate: 80 },
      placement: { observed: 30, actualRate: 70 },
      readyForRecommendationInfluence: true,
    });
  });

  it('suppresses undersized fairness groups and keeps them out of ranking', () => {
    const report = auditRecommendationFairness([
      { group_label: 'audit-only group', completion_predictions: [{ probability: 80, actual: true }], placement_predictions: [] },
    ]);

    expect(report.rankingInputAllowed).toBe(false);
    expect(report.completion[0]).toMatchObject({ suppressed: true, calibration_gap: null });
  });
});
