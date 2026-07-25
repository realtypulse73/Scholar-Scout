import {
  assessOutcomeEvidence,
  createOutcomeProfile,
  validateOutcomeMetricRecord,
  type OutcomeMetricRecord,
} from '@/lib/outcome-profiles';

const record = (metric_name: OutcomeMetricRecord['metric_name'], value: number | null): OutcomeMetricRecord => ({
  institution_id: 'buffalo-example',
  program_CIP: '51.3801',
  metric_name,
  value,
  cohort_size: 48,
  cohort_definition: 'Defined student cohort',
  as_of_date: '2026-06-01',
  source_url: 'https://data.example.edu/outcomes',
  source_type: 'state_public',
  confidence: 'high',
  suppression_reason: value === null ? 'Small cohort suppressed by source.' : null,
});

describe('outcome profiles', () => {
  it('keeps the import schema and creates a high-confidence current profile', () => {
    const profile = createOutcomeProfile('nursing-aas', [
      record('completion_rate', 78),
      record('placement_rate', 88),
      record('net_price', 7200),
      record('retention_rate', 84),
    ]);

    expect(profile).toMatchObject({
      program_id: 'nursing-aas', completion_rate: 78, placement_rate: 88,
      net_price: 7200, retention_rate: 84, cohort_size: 48, confidence: 'high',
    });
    expect(assessOutcomeEvidence(profile, new Date('2026-07-25'))).toEqual({
      isEligibleForPathwayScore: true,
      reasons: [],
    });
  });

  it('does not turn suppressed or stale results into score-ready evidence', () => {
    const profile = createOutcomeProfile('nursing-aas', [
      record('completion_rate', null),
      { ...record('placement_rate', 88), as_of_date: '2023-06-01' },
      record('net_price', 7200),
      record('retention_rate', 84),
    ]);
    const evidence = assessOutcomeEvidence(profile, new Date('2026-07-25'));

    expect(evidence.isEligibleForPathwayScore).toBe(false);
    expect(evidence.reasons).toEqual(expect.arrayContaining([
      'completion_rate is suppressed or unavailable.',
      'placement_rate is more than two years old or has an invalid date.',
    ]));
  });

  it('requires a suppression reason whenever a metric value is missing', () => {
    expect(validateOutcomeMetricRecord({ ...record('placement_rate', null), suppression_reason: null }))
      .toContain('suppression_reason is required when value is unavailable.');
  });
});
