import { scoreRecommendedPathway } from '@/lib/pathway-score';
import { createOutcomeProfile, type OutcomeMetricRecord } from '@/lib/outcome-profiles';

const records: OutcomeMetricRecord[] = [
  {
    institution_id: 'example-institution', program_CIP: '51.3801', metric_name: 'completion_rate', value: 82, cohort_size: 100,
    cohort_definition: 'First-time, full-time cohort', as_of_date: '2026-06-01', source_url: 'https://example.edu/outcomes', source_type: 'federal_public', confidence: 'high', suppression_reason: null,
  },
  {
    institution_id: 'example-institution', program_CIP: '51.3801', metric_name: 'placement_rate', value: 76, cohort_size: 90,
    cohort_definition: 'Program completers employed within six months', as_of_date: '2026-06-01', source_url: 'https://example.edu/outcomes', source_type: 'federal_public', confidence: 'high', suppression_reason: null,
  },
  {
    institution_id: 'example-institution', program_CIP: '51.3801', metric_name: 'net_price', value: 6500, cohort_size: 100,
    cohort_definition: 'Annual net price after grant aid', as_of_date: '2026-06-01', source_url: 'https://example.edu/outcomes', source_type: 'federal_public', confidence: 'high', suppression_reason: null,
  },
  {
    institution_id: 'example-institution', program_CIP: '51.3801', metric_name: 'retention_rate', value: 86, cohort_size: 100,
    cohort_definition: 'Students retained after one year', as_of_date: '2026-06-01', source_url: 'https://example.edu/outcomes', source_type: 'federal_public', confidence: 'high', suppression_reason: null,
  },
];

const outcomeProfile = createOutcomeProfile('example-program', records);
const prediction = {
  model_type: 'calibrated-logistic-regression' as const,
  model_version: 'shadow-v1',
  validated_through: '2026-06-01',
  completion_probability: 80,
  placement_probability: 70,
};

describe('scoreRecommendedPathway', () => {
  it('uses the declared weighted pathway formula and subtracts unresolved barriers', () => {
    const result = scoreRecommendedPathway({
      outcomeProfile,
      prediction,
      affordabilityFit: 90,
      logisticsFeasibility: 60,
      supportAvailability: 100,
      barriers: [{ id: 'other', label: 'A scheduling question remains.', severity: 'minor' }],
    });

    expect(result).toMatchObject({ score: 75, isEligible: true, barrierPenalty: 4, missingEvidence: [] });
  });

  it('does not manufacture an outcome score when probability evidence is unavailable', () => {
    const result = scoreRecommendedPathway({
      outcomeProfile: null,
      prediction: null,
      affordabilityFit: 90,
      logisticsFeasibility: 90,
      supportAvailability: 90,
      barriers: [],
    });

    expect(result.score).toBeNull();
    expect(result.isEligible).toBe(true);
    expect(result.missingEvidence).toEqual(['outcomeProfile', 'completionProbability', 'placementProbability']);
  });

  it('blocks a pathway with an unresolved hard requirement', () => {
    const result = scoreRecommendedPathway({
      outcomeProfile,
      prediction: { ...prediction, placement_probability: 80 },
      affordabilityFit: 80,
      logisticsFeasibility: 80,
      supportAvailability: 80,
      barriers: [{ id: 'unmet-prerequisite', label: 'Required prerequisite is not complete.', severity: 'blocking' }],
    });

    expect(result).toMatchObject({ score: null, isEligible: false });
  });
});
