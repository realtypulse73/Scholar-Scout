import type { OnboardingData } from '@/lib/onboarding-types';
import type { CreatorProfile } from '@/lib/platform';
import type { Programme } from '@/lib/programmes';

export interface CampusUploaderMatch {
  uploader: CreatorProfile;
  programme: Programme;
  reasons: string[];
}

/**
 * Matches campus uploaders to declared pathway interests and practical
 * preferences only. It is a discovery screen, not an admissions decision.
 */
export function getCampusUploaderMatches(
  uploaders: CreatorProfile[],
  programmes: Programme[],
  profile: OnboardingData | null,
): CampusUploaderMatch[] {
  if (!profile || profile.interests.length === 0 || !profile.pathwayPreference) {
    return [];
  }

  return uploaders.flatMap((uploader) => {
    const programme = programmes.find((item) => item.id === uploader.programmeId);
    if (!programme || !matchesDeclaredPath(programme, profile)) return [];

    const reasons = [];
    if (profile.pathwayPreference === programme.pathway) {
      reasons.push(`Matches your ${programme.pathway.replaceAll('-', ' ')} preference.`);
    }
    const sharedInterests = programme.interests.filter((interest) =>
      profile.interests.includes(interest),
    );
    if (sharedInterests.length) {
      reasons.push(`Shares your interest in ${sharedInterests.join(' and ')}.`);
    }
    if (profile.locationPreference === 'online-only' && programme.delivery !== 'Campus') {
      reasons.push('Offers a delivery format compatible with your online preference.');
    }

    return [{ uploader, programme, reasons }];
  });
}

function matchesDeclaredPath(programme: Programme, profile: OnboardingData) {
  const pathwayMatches = profile.pathwayPreference === 'undecided' || profile.pathwayPreference === programme.pathway;
  const interestMatches = programme.interests.some((interest) => profile.interests.includes(interest));
  const locationMatches = profile.locationPreference !== 'online-only' || programme.delivery !== 'Campus';

  return pathwayMatches && interestMatches && locationMatches;
}
