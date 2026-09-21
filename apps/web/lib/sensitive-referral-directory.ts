import type { ReferralOnlySupportCategory } from './onboarding-types';

export interface SensitiveReferralFixture {
  category: ReferralOnlySupportCategory;
  label: string;
  url: string;
  isFixture: true;
}

export const SENSITIVE_REFERRAL_FIXTURES: readonly SensitiveReferralFixture[] = [
  {
    category: 'disability-services',
    label: 'Test-only disability support information',
    url: 'https://disability-support.invalid/contact',
    isFixture: true,
  },
  {
    category: 'housing',
    label: 'Test-only housing support information',
    url: 'https://housing-support.invalid/contact',
    isFixture: true,
  },
  {
    category: 'mental-health',
    label: 'Test-only mental health support information',
    url: 'https://mental-health-support.invalid/contact',
    isFixture: true,
  },
  {
    category: 'immigration',
    label: 'Test-only immigration support information',
    url: 'https://immigration-support.invalid/contact',
    isFixture: true,
  },
  {
    category: 'complex-financial-help',
    label: 'Test-only complex financial guidance information',
    url: 'https://financial-guidance.invalid/contact',
    isFixture: true,
  },
  {
    category: 'childcare',
    label: 'Test-only childcare support information',
    url: 'https://childcare-support.invalid/contact',
    isFixture: true,
  },
  {
    category: 'language-support',
    label: 'Test-only language support information',
    url: 'https://language-support.invalid/contact',
    isFixture: true,
  },
];

export function getSensitiveReferralFixture(
  category: ReferralOnlySupportCategory,
): SensitiveReferralFixture {
  const fixture = SENSITIVE_REFERRAL_FIXTURES.find(
    (candidate) => candidate.category === category,
  );

  if (!fixture) {
    throw new Error('Referral fixture is not configured.');
  }

  return fixture;
}
