import { notFound } from 'next/navigation';
import PhaseFiveAccessibilityFixture from '@/components/phase-5-accessibility/PhaseFiveAccessibilityFixture';

export const metadata = {
  title: 'Phase 5 Accessibility UAT | ScholarScout',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PhaseFiveAccessibilityUatPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();

  return <PhaseFiveAccessibilityFixture />;
}
