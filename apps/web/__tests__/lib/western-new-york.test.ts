import {
  rankWesternNewYorkInstitutions,
  type WesternNewYorkInstitution,
} from '@/lib/western-new-york';

const institution = (overrides: Partial<WesternNewYorkInstitution> = {}): WesternNewYorkInstitution => ({
  id: 'test-campus', name: 'Test Campus', city: 'Buffalo', kind: 'college', officialUrl: 'https://example.edu', mediaUrl: 'https://example.edu/visit',
  admissions: { testPolicy: 'test-free', gpaGuidance: 'Ask admissions.', admissionsUrl: 'https://example.edu/apply' },
  logistics: { publicTransit: 'verified-access', childcare: 'support-or-referral-documented', note: 'Confirm your route.' },
  accountability: { notice: 'Review sources.', sources: [] }, sourceCheckedOn: '2026-07-25', ...overrides,
});

describe('rankWesternNewYorkInstitutions', () => {
  it('prioritizes documented test, transit, and caregiving access without turning accountability materials into a score', () => {
    const [result] = rankWesternNewYorkInstitutions([institution()], {
      hasChildren: true, transportation: 'public-transit', testStatus: 'not-taken', gpaStatus: 'not-provided',
    });

    expect(result.accessScore).toBe(38);
    expect(result.reasons).toHaveLength(4);
    expect(result.reviewItems).toContain('A missing GPA is never treated as admission eligibility; confirm transcript and placement requirements.');
  });

  it('requires direct confirmation when a testing policy is not sourced', () => {
    const [result] = rankWesternNewYorkInstitutions([institution({ admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Ask admissions.', admissionsUrl: 'https://example.edu/apply' } })], {
      hasChildren: false, transportation: 'unsure', testStatus: 'not-taken', gpaStatus: 'provided',
    });

    expect(result.accessScore).toBe(0);
    expect(result.reviewItems).toContain('Confirm the current testing policy before applying.');
  });

  it('sorts equal access scores by institution name', () => {
    const results = rankWesternNewYorkInstitutions([
      institution({ id: 'zeta', name: 'Žižkov College' }),
      institution({ id: 'alpha', name: 'Álpha University' }),
    ], {
      hasChildren: false,
      transportation: 'unsure',
      testStatus: 'taken',
      gpaStatus: 'provided',
    });

    expect(results.map((result) => result.institution.name)).toEqual([
      'Álpha University',
      'Žižkov College',
    ]);
  });
});
