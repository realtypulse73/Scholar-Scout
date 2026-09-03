import { ROLE_LANGUAGE } from '@/lib/role-language';

describe('ROLE_LANGUAGE', () => {
  it('keeps role labels bounded and free of admissions claims', () => {
    expect(ROLE_LANGUAGE.student.profile).toContain('not an admissions decision');
    expect(ROLE_LANGUAGE.advisor.guidance).toContain('does not make admissions decisions');
    expect(ROLE_LANGUAGE.institution.verification).toContain('official institution sources');
    expect(ROLE_LANGUAGE.staff.stewardship).toContain('Authorized staff');
  });
});
