import {
  WESTERN_NEW_YORK_INSTITUTIONS,
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
});

describe('production SUNY Erie source record', () => {
  it('keeps every visible source on the verified ecc.edu destinations', () => {
    const sunyErie = WESTERN_NEW_YORK_INSTITUTIONS.find((item) => item.id === 'suny-erie');

    expect(sunyErie).toMatchObject({
      officialUrl: 'https://www.ecc.edu/',
      mediaUrl: 'https://www.ecc.edu/admissions-and-aid/index.html',
      sourceCheckedOn: '2026-08-29',
      admissions: {
        admissionsUrl: 'https://www.ecc.edu/admissions-and-aid/how-to-apply.html',
      },
      accountability: {
        sources: [
          {
            url: 'https://www.ecc.edu/admissions-and-aid/index.html',
          },
        ],
      },
    });
  });
});
