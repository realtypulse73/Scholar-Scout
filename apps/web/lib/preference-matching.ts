import type { OnboardingData } from '@/lib/onboarding-types';
import {
  GPA_BAND_LABELS,
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

type FitBand = 'excellent' | 'strong' | 'promising' | 'review';
type FitCategory =
  | 'interest'
  | 'pathway'
  | 'location'
  | 'affordability'
  | 'support'
  | 'access';

export interface ProgrammeFitSignal {
  category: FitCategory;
  label: string;
  points: number;
  message: string;
}

export interface ProgrammeFitExplanation {
  score: number;
  band: FitBand;
  reasons: string[];
  cautions: string[];
  signals: ProgrammeFitSignal[];
}

export interface RankedProgrammeMatch {
  programme: Programme;
  fit: ProgrammeFitExplanation;
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
  const signals: ProgrammeFitSignal[] = [];
  let score = 35;

  const addSignal = (signal: ProgrammeFitSignal) => {
    score += signal.points;
    signals.push(signal);

    if (signal.points >= 6) {
      reasons.push(signal.message);
    } else if (signal.points < 0) {
      cautions.push(signal.message);
    }
  };

  addSignal(getInterestSignal(programme, profile));
  addSignal(getPathwaySignal(programme, profile));
  addSignal(getLocationSignal(programme, profile));
  addSignal(getAffordabilitySignal(programme, profile));
  addSignal(getSupportSignal(programme, profile));
  addSignal(getAccessSignal(programme, profile));

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    score: finalScore,
    band: getFitBand(finalScore),
    reasons: reasons.length > 0 ? reasons : ['Worth reviewing as a baseline ScholarScout option.'],
    cautions,
    signals,
  };
}

export function rankProgrammesForProfile(
  programmes: Programme[],
  profile: OnboardingData | null,
) {
  if (!profile) {
    return [...programmes].sort((a, b) => b.matchScore - a.matchScore);
  }

  return getRankedProgrammeMatches(programmes, profile).map(
    (match) => match.programme,
  );
}

export function getRankedProgrammeMatches(
  programmes: Programme[],
  profile: OnboardingData,
): RankedProgrammeMatch[] {
  return programmes
    .map((programme) => ({
      programme,
      fit: explainProgrammeFit(programme, profile),
    }))
    .sort(
      (a, b) =>
        b.fit.score - a.fit.score ||
        b.programme.matchScore - a.programme.matchScore ||
        a.programme.annualTuition - b.programme.annualTuition,
    );
}

function getInterestSignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const selectedInterests = profile.interests.filter(
    (interest): interest is Exclude<typeof interest, 'undecided'> =>
      interest !== 'undecided',
  );
  const selectedInterestSet = new Set<string>(selectedInterests);
  const matchingInterests = programme.interests.filter((interest) =>
    selectedInterestSet.has(interest),
  );

  if (profile.interests.includes('undecided') || selectedInterests.length === 0) {
    return {
      category: 'interest',
      label: 'Interest discovery',
      points: 8,
      message: 'Keeps options open while interests are still being explored.',
    };
  }

  if (matchingInterests.length >= 2) {
    return {
      category: 'interest',
      label: 'Strong interest match',
      points: 24,
      message: `Strong overlap with ${matchingInterests
        .map((interest) => INTEREST_LABELS[interest])
        .join(', ')} interests.`,
    };
  }

  if (matchingInterests.length === 1) {
    return {
      category: 'interest',
      label: 'Interest match',
      points: 16,
      message: `Matches your ${INTEREST_LABELS[matchingInterests[0]]} interest.`,
    };
  }

  return {
    category: 'interest',
    label: 'Interest gap',
    points: -6,
    message: 'Interest areas do not directly overlap yet.',
  };
}

function getPathwaySignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const preference = profile.pathwayPreference;

  if (!preference || preference === 'undecided') {
    return {
      category: 'pathway',
      label: 'Flexible pathway',
      points: 8,
      message: 'Still viable while you are undecided on pathway.',
    };
  }

  if (preference === programme.pathway) {
    return {
      category: 'pathway',
      label: 'Pathway match',
      points: 20,
      message: `Matches your ${PATHWAY_LABELS[preference]} pathway preference.`,
    };
  }

  return {
    category: 'pathway',
    label: 'Different pathway',
    points: -7,
    message: `Listed as ${PROGRAMME_PATHWAY_LABELS[programme.pathway]}, not your selected pathway.`,
  };
}

function getLocationSignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const preference = profile.locationPreference;

  if (!preference || preference === 'no-preference') {
    return {
      category: 'location',
      label: 'Open location',
      points: 6,
      message: 'Fits your open location preference.',
    };
  }

  if (preference === 'online-only') {
    return programme.delivery === 'Online'
      ? {
          category: 'location',
          label: 'Online match',
          points: 12,
          message: `Matches your ${LOCATION_LABELS[preference]} preference.`,
        }
      : {
          category: 'location',
          label: 'Campus required',
          points: -8,
          message: 'Not fully online.',
        };
  }

  if (preference === 'local' || preference === 'in-state') {
    return programme.state !== 'US'
      ? {
          category: 'location',
          label: 'Campus option',
          points: 8,
          message: 'Has a campus or hybrid location to compare.',
        }
      : {
          category: 'location',
          label: 'Online-only location',
          points: -4,
          message: 'Online-only location may not match your campus preference.',
        };
  }

  return {
    category: 'location',
    label: 'Location review',
    points: 4,
    message: `Can be reviewed against your ${LOCATION_LABELS[preference]} preference.`,
  };
}

function getAffordabilitySignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const sensitivity = profile.affordabilitySensitivity;
  const lowCost = programme.annualTuition <= 5000;
  const moderateCost = programme.annualTuition <= 9000;

  if (sensitivity <= 2 && lowCost) {
    return {
      category: 'affordability',
      label: 'Strong cost fit',
      points: 14,
      message: 'Strong cost fit for a highly cost-conscious search.',
    };
  }

  if (sensitivity <= 2) {
    return {
      category: 'affordability',
      label: 'Aid review needed',
      points: -10,
      message: 'Cost may need scholarship or aid review.',
    };
  }

  if (sensitivity === 3 && moderateCost) {
    return {
      category: 'affordability',
      label: 'Balanced value',
      points: 10,
      message: 'Tuition fits a balanced value search.',
    };
  }

  if (sensitivity >= 4) {
    return {
      category: 'affordability',
      label: 'Budget flexibility',
      points: 6,
      message: 'Cost appears compatible with your stated flexibility.',
    };
  }

  return {
    category: 'affordability',
    label: 'Cost neutral',
    points: 0,
    message: 'Cost should be compared with aid and scholarships.',
  };
}

function getSupportSignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const selectedSupports = profile.supportNeeds.filter(
    (support): support is Exclude<typeof support, 'none'> => support !== 'none',
  );
  const selectedSupportSet = new Set<string>(selectedSupports);
  const matchingSupport = programme.support.filter((support) =>
    selectedSupportSet.has(support),
  );

  if (profile.supportNeeds.includes('none') || selectedSupports.length === 0) {
    return {
      category: 'support',
      label: 'No support blocker',
      points: 4,
      message: 'No specific support requirement blocks this option.',
    };
  }

  if (matchingSupport.length >= Math.min(2, selectedSupports.length)) {
    return {
      category: 'support',
      label: 'Strong support fit',
      points: 14,
      message: `Includes ${matchingSupport
        .map((support) => SUPPORT_NEED_LABELS[support])
        .join(', ')} support.`,
    };
  }

  if (matchingSupport.length === 1) {
    return {
      category: 'support',
      label: 'Partial support fit',
      points: 8,
      message: `Includes ${SUPPORT_NEED_LABELS[matchingSupport[0]]} support.`,
    };
  }

  return {
    category: 'support',
    label: 'Support review needed',
    points: -8,
    message: 'Support services may need closer review.',
  };
}

function getAccessSignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const gpaBand = profile.gpaBand;
  const openAccess = programme.acceptanceRate >= 90;
  const broadAccess = programme.acceptanceRate >= 75;

  if (!gpaBand || gpaBand === 'no-gpa') {
    return {
      category: 'access',
      label: 'Entry review',
      points: openAccess ? 10 : 3,
      message: openAccess
        ? 'Open-access entry makes this easier to explore without GPA pressure.'
        : 'Entry requirements should be reviewed because no GPA was provided.',
    };
  }

  if (gpaBand === 'below-2.0' || gpaBand === '2.0-2.4') {
    return openAccess
      ? {
          category: 'access',
          label: 'High access fit',
          points: 16,
          message: `${GPA_BAND_LABELS[gpaBand]} students may benefit from this programme's flexible entry profile.`,
        }
      : {
          category: 'access',
          label: 'Admissions caution',
          points: -10,
          message: 'Entry flexibility may require a closer admissions conversation.',
        };
  }

  if (gpaBand === '2.5-2.9') {
    return broadAccess
      ? {
          category: 'access',
          label: 'Accessible option',
          points: 10,
          message: 'Entry profile appears accessible for a practical application list.',
        }
      : {
          category: 'access',
          label: 'Selective option',
          points: -3,
          message: 'May belong in a reach category rather than a primary option.',
        };
  }

  return {
    category: 'access',
    label: 'Academic fit',
    points: 6,
    message: 'Academic profile appears compatible enough for comparison.',
  };
}

function getFitBand(score: number): FitBand {
  if (score >= 85) {
    return 'excellent';
  }

  if (score >= 72) {
    return 'strong';
  }

  if (score >= 58) {
    return 'promising';
  }

  return 'review';
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
