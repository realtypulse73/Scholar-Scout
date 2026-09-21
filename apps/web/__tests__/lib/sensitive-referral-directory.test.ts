import {
  SENSITIVE_REFERRAL_FIXTURES,
  getSensitiveReferralFixture,
} from '@/lib/sensitive-referral-directory';

describe('sensitive referral fixture directory', () => {
  it('contains only clearly labelled non-live .invalid destinations', () => {
    expect(SENSITIVE_REFERRAL_FIXTURES).toHaveLength(7);

    for (const fixture of SENSITIVE_REFERRAL_FIXTURES) {
      expect(fixture.isFixture).toBe(true);
      expect(fixture.label).toMatch(/test-only/i);
      expect(new URL(fixture.url).hostname).toMatch(/\.invalid$/);
    }
  });

  it('returns an allowlisted fixture only for a referral-only category', () => {
    expect(getSensitiveReferralFixture('housing')).toMatchObject({
      category: 'housing',
      isFixture: true,
    });
  });
});
