import type { OnboardingData } from '@/lib/onboarding-types';
import type { Programme, ProgrammePathway } from '@/lib/programmes';

/**
 * Short-form interest labels for use in plain-language explanation bullets.
 * Kept lowercase so they read naturally inside a sentence.
 */
const INTEREST_SHORT: Record<string, string> = {
  stem: 'STEM',
  arts: 'arts and humanities',
  business: 'business',
  education: 'education',
  healthcare: 'healthcare',
  trades: 'skilled trades',
  'social-sciences': 'social sciences',
  law: 'law and justice',
  sports: 'sports and fitness',
  technology: 'technology and IT',
  environment: 'environment',
  undecided: 'general studies',
};

/**
 * Short-form pathway labels for plain-language explanation bullets.
 */
const PATHWAY_SHORT: Record<ProgrammePathway, string> = {
  '4-year-university': '4-year university',
  '2-year-community-college': '2-year community college',
  'trade-vocational': 'trade and vocational school',
  'certificate-program': 'certificate program',
  apprenticeship: 'apprenticeship',
  'online-degree': 'online degree program',
};

/**
 * Short-form support need labels for plain-language explanation bullets.
 */
const SUPPORT_SHORT: Record<string, string> = {
  'financial-aid': 'financial aid',
  'first-gen': 'first-gen student support',
  'disability-services': 'disability services',
  'iep-support': 'IEP support',
  'mental-health': 'mental health services',
  tutoring: 'tutoring',
  'career-counseling': 'career counseling',
  housing: 'housing help',
  childcare: 'childcare',
  'language-support': 'language support',
};

/**
 * Returns 1–3 plain-English bullets that connect a programme to the
 * student's actual onboarding answers. Used on recommendation cards to
 * replace generic score text with student-facing reasons.
 *
 * Returns an empty array when there are no clear profile-to-programme
 * connections — callers should fall back to a generic rank reason.
 */
export function buildProfileMatchBullets(
  profile: OnboardingData,
  programme: Programme,
): string[] {
  const bullets: string[] = [];

  // --- Interest match ---
  const matchedInterests = programme.interests.filter(
    (interest) =>
      profile.interests.includes(interest) && interest !== 'undecided',
  );

  if (matchedInterests.length === 1) {
    const label = INTEREST_SHORT[matchedInterests[0]] ?? matchedInterests[0];
    bullets.push(`You picked ${label} — this program covers it.`);
  } else if (matchedInterests.length >= 2) {
    const [first, second] = matchedInterests
      .slice(0, 2)
      .map((i) => INTEREST_SHORT[i] ?? i);
    bullets.push(`Covers both ${first} and ${second} — your top picks.`);
  }

  // --- Pathway match ---
  if (
    profile.pathwayPreference !== 'undecided' &&
    (programme.pathway as string) === profile.pathwayPreference
  ) {
    const label = PATHWAY_SHORT[programme.pathway];
    bullets.push(`Fits the ${label} you chose.`);
  }

  // --- Support needs ---
  const selectedSupports = profile.supportNeeds.filter((s) => s !== 'none');
  const matchedSupport = programme.support.filter((s) =>
    selectedSupports.includes(s),
  );

  if (matchedSupport.length === 1) {
    const label = SUPPORT_SHORT[matchedSupport[0]] ?? matchedSupport[0];
    bullets.push(`Has ${label} you said you need.`);
  } else if (matchedSupport.length >= 2) {
    const [first, second] = matchedSupport
      .slice(0, 2)
      .map((s) => SUPPORT_SHORT[s] ?? s);
    bullets.push(`Has ${first} and ${second} you said you need.`);
  }

  // --- Cost / aid ---
  // Show affordability bullet only if not already at 3 bullets
  if (bullets.length < 3) {
    if (
      profile.affordabilitySensitivity <= 2 &&
      programme.annualTuition <= 4000
    ) {
      bullets.push('One of the more affordable options in your matches.');
    } else if (
      programme.aidTypes?.includes('pell-grant') &&
      profile.supportNeeds.includes('financial-aid')
    ) {
      bullets.push('Pell Grant eligible here — no payback required.');
    }
  }

  return bullets.slice(0, 3);
}
