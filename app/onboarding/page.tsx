import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Get Started | ScholarScout',
  description:
    'Tell us about yourself so we can match you with the right post-secondary programmes.',
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
