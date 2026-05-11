import type { OnboardingData } from '@/lib/onboarding-types';
import {
  INTEREST_LABELS,
  LOCATION_LABELS,
  PATHWAY_LABELS,
  SUPPORT_NEED_LABELS,
} from '@/lib/onboarding-types';
import {
  PROGRAMME_PATHWAY_LABELS,
  type Programme,
} from '@/lib/programmes';

export const ONBOARDING_PROFILE_STORAGE_KEY = 'scholarscout.onboarding-profile';

export interface ProgrammeFitExplanation {
  score: number;
  reasons: string[];
  cautions: string[];
}

export function parseOnboardingProfile(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isOnboardingData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeOnboardingProfile(data: OnboardingData) {
  return JSON.stringify(data);
}

export function explainProgrammeFit(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitExplanation {
  const reasons: string[] = [];
  const cautions: string[] = [];
  let score = 40;

  const matchingInterests = programme.interests.filter((interest) =>
    profile.interests.includes(interest),
  );

  if (matchingInterests.length > 0) {
    score += 20;
    reasons.push(
      `Matches ${matchingInterests
        .map((interest) => INTEREST_LABELS[interest])
        .join(', ')} interests.`,
    );
  } else if (profile.interests.length > 0) {
    cautions.push('Interest areas do not directly overlap yet.');
  }

  if (profile.pathwayPreference === programme.pathway) {
    score += 20;
    reasons.push(
      `Matches your ${PATHWAY_LABELS[profile.pathwayPreference]} pathway preference.`,
    );
  } else if (profile.pathwayPreference === 'undecided') {
    score += 8;
    reasons.push('Still viable while you are undecided on pathway.');
  } else if (profile.pathwayPreference) {
    cautions.push(
      `Listed as ${PROGRAMME_PATHWAY_LABELS[programme.pathway]}, not your selected pathway.`,
    );
  }

  const locationFit = getLocationFit(programme, profile);
  score += locationFit.score;
  if (locationFit.reason) {
    reasons.push(locationFit.reason);
  }
  if (locationFit.caution) {
    cautions.push(locationFit.caution);
  }

  const affordabilityFit = getAffordabilityFit(programme, profile);
  score += affordabilityFit.score;
  if (affordabilityFit.reason) {
    reasons.push(affordabilityFit.reason);
  }
  if (affordabilityFit.caution) {
    cautions.push(affordabilityFit.caution);
  }

  const matchingSupport = programme.support.filter((support) =>
    profile.supportNeeds.includes(support),
  );

  if (profile.supportNeeds.includes('none')) {
    score += 4;
    reasons.push('No specific support requirement blocks this option.');
  } else if (matchingSupport.length > 0) {
    score += 12;
    reasons.push(
      `Includes ${matchingSupport
        .map((support) => SUPPORT_NEED_LABELS[support])
        .join(', ')} support.`,
    );
  } else if (profile.supportNeeds.length > 0) {
    cautions.push('Support services may need closer review.');
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasons,
    cautions,
  };
}

export function rankProgrammesForProfile(
  programmes: Programme[],
  profile: OnboardingData | null,
) {
  if (!profile) {
    return [...programmes].sort((a, b) => b.matchScore - a.matchScore);
  }

  return [...programmes].sort((a, b) => {
    const aFit = explainProgrammeFit(a, profile).score;
    const bFit = explainProgrammeFit(b, profile).score;

    return bFit - aFit || b.matchScore - a.matchScore;
  });
}

function getLocationFit(programme: Programme, profile: OnboardingData) {
  const preference = profile.locationPreference;

  if (!preference || preference === 'no-preference') {
    return {
      score: 6,
      reason: 'Fits your open location preference.',
    };
  }

  if (preference === 'online-only') {
    return programme.delivery === 'Online'
      ? {
          score: 12,
          reason: `Matches your ${LOCATION_LABELS[preference]} preference.`,
        }
      : {
          score: -6,
          caution: 'Not fully online.',
        };
  }

  if (preference === 'local' || preference === 'in-state') {
    return programme.state !== 'US'
      ? {
          score: 8,
          reason: 'Has a campus or hybrid location to compare.',
        }
      : {
          score: -4,
          caution: 'Online-only location may not match your campus preference.',
        };
  }

  return {
    score: 4,
    reason: `Can be reviewed against your ${LOCATION_LABELS[preference]} preference.`,
  };
}

function getAffordabilityFit(programme: Programme, profile: OnboardingData) {
  const sensitivity = profile.affordabilitySensitivity;
  const lowCost = programme.annualTuition <= 5000;
  const moderateCost = programme.annualTuition <= 9000;

  if (sensitivity <= 2 && lowCost) {
    return {
      score: 12,
      reason: 'Strong cost fit for a highly cost-conscious search.',
    };
  }

  if (sensitivity <= 2) {
    return {
      score: -8,
      caution: 'Cost may need scholarship or aid review.',
    };
  }

  if (sensitivity === 3 && moderateCost) {
    return {
      score: 8,
      reason: 'Tuition fits a balanced value search.',
    };
  }

  if (sensitivity >= 4) {
    return {
      score: 5,
      reason: 'Cost appears compatible with your stated flexibility.',
    };
  }

  return {
    score: 0,
  };
}

function isOnboardingData(value: unknown): value is OnboardingData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<OnboardingData>;

  return (
    Array.isArray(data.interests) &&
    Array.isArray(data.supportNeeds) &&
    typeof data.affordabilitySensitivity === 'number' &&
    'gpaBand' in data &&
    'locationPreference' in data &&
    'pathwayPreference' in data
  );
}
