import type { OnboardingData } from '@/lib/onboarding-types';
import {
  GPA_BAND_LABELS,
  INTEREST_LABELS,
  LOCATION_LABELS,
  PATHWAY_LABELS,
  SUPPORT_NEED_LABELS,
} from '@/lib/onboarding-types';
import {
  getProgrammeSupportCoverage,
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
  | 'access'
  | 'student-ready';

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

/**
 * Returns true for students who have intense support needs, multiple
 * concurrent life challenges, or a non-standard academic record.
 *
 * These students benefit from LRE (Least Restrictive Environment) scoring:
 * support alignment is weighted as the primary retention signal, access
 * penalties are softened so the full programme range stays visible, and
 * 4-year programmes with strong support are not buried below certificate
 * or trade options just because of pathway type.
 */
export function isNonTraditionalStudent(profile: OnboardingData): boolean {
  const intenseSupportNeeds: string[] = [
    'disability-services',
    'iep-support',
    'mental-health',
    'childcare',
    'language-support',
    'housing',
  ];
  const hasIntenseNeed = profile.supportNeeds.some((s) =>
    intenseSupportNeeds.includes(s),
  );
  const hasComplexNeeds =
    profile.supportNeeds.filter((s) => s !== 'none').length >= 3;
  const hasNonStandardRecord =
    profile.gpaBand === 'below-2.0' ||
    profile.gpaBand === '2.0-2.4' ||
    profile.gpaBand === 'no-gpa';

  return hasIntenseNeed || hasComplexNeeds || hasNonStandardRecord;
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
  addSignal(getStudentReadySignal(programme, profile));

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    score: finalScore,
    band: getFitBand(finalScore),
    reasons: reasons.length > 0 ? reasons : ['Worth a look as a basic ScholarScout option.'],
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
        getRawFitScore(b.fit) - getRawFitScore(a.fit) ||
        b.fit.score - a.fit.score ||
        getSignalPoints(b.fit, 'student-ready') -
          getSignalPoints(a.fit, 'student-ready') ||
        getSignalPoints(b.fit, 'support') - getSignalPoints(a.fit, 'support') ||
        getSignalPoints(b.fit, 'access') - getSignalPoints(a.fit, 'access') ||
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
      label: 'Interest search',
      points: 8,
      message: 'Keeps options open while you learn what you like.',
    };
  }

  if (matchingInterests.length >= 2) {
    return {
      category: 'interest',
      label: 'Strong interest match',
      points: 24,
      message: `Strong match with your ${matchingInterests
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
    label: 'Different interest',
    points: -6,
    message: 'This does not match your interests yet.',
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
      label: 'Open path',
      points: 8,
      message: 'Still worth a look while you choose a path.',
    };
  }

  if (preference === programme.pathway) {
    return {
      category: 'pathway',
      label: 'Pathway match',
      points: 20,
      message: `Matches your ${PATHWAY_LABELS[preference]} path choice.`,
    };
  }

  return {
    category: 'pathway',
    label: 'Different pathway',
    points: -7,
    message: `Listed as ${PROGRAMME_PATHWAY_LABELS[programme.pathway]}, not your chosen path.`,
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
      message: 'Works with your open place choice.',
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
          message: 'Has a campus or hybrid option to compare.',
        }
      : {
          category: 'location',
          label: 'Online-only location',
          points: -4,
          message: 'Online only may not match your campus choice.',
        };
  }

  return {
    category: 'location',
    label: 'Location review',
    points: 4,
    message: `Can be checked against your ${LOCATION_LABELS[preference]} choice.`,
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
      message: 'Strong cost fit if price matters most.',
    };
  }

  if (sensitivity <= 2) {
    return {
      category: 'affordability',
      label: 'Check aid',
      points: -10,
      message: 'You may need scholarships or aid for this cost.',
    };
  }

  if (sensitivity === 3 && moderateCost) {
    return {
      category: 'affordability',
      label: 'Balanced value',
      points: 10,
      message: 'Tuition fits a middle-cost search.',
    };
  }

  if (sensitivity >= 4) {
    return {
      category: 'affordability',
      label: 'Budget room',
      points: 6,
      message: 'Cost seems to fit your budget room.',
    };
  }

  return {
    category: 'affordability',
    label: 'Cost neutral',
    points: 0,
    message: 'Compare cost with aid and scholarships.',
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
  const supportCoverage = getProgrammeSupportCoverage(programme);
  const matchingSupport = supportCoverage.filter((support) =>
    selectedSupportSet.has(support),
  );

  // Students with 3 or more concurrent support needs have complex requirements.
  // For them, covering only 1 of 3+ needs is a caution — most of what they
  // need to stay enrolled and thrive is still missing.
  const highNeedStudent = selectedSupports.length >= 3;

  if (profile.supportNeeds.includes('none') || selectedSupports.length === 0) {
    return {
      category: 'support',
      label: 'No support issue',
      points: 4,
      message: 'No support need blocks this option.',
    };
  }

  if (matchingSupport.length >= Math.min(2, selectedSupports.length)) {
    return {
      category: 'support',
      label: 'Strong support fit',
      // Extra weight for students with multiple concurrent needs — a full
      // support match here is the strongest retention signal we can give.
      points: highNeedStudent ? 26 : 20,
      message: `Includes ${matchingSupport
        .map((support) => SUPPORT_NEED_LABELS[support])
        .join(', ')} support.`,
    };
  }

  // For students with 1–2 support needs, a single match is a genuine positive.
  if (matchingSupport.length === 1 && !highNeedStudent) {
    return {
      category: 'support',
      label: 'Some support fit',
      points: 10,
      message: `Includes ${SUPPORT_NEED_LABELS[matchingSupport[0]]} support.`,
    };
  }

  // For students with 3+ concurrent needs, 1-of-3 coverage is not enough for
  // reliable retention. Surface the gap as a named caution so the student can
  // ask about it — but keep the programme visible in results.
  if (matchingSupport.length === 1 && highNeedStudent) {
    const unmetLabels = selectedSupports
      .filter((s) => !supportCoverage.includes(s))
      .map((s) => SUPPORT_NEED_LABELS[s]);
    return {
      category: 'support',
      label: 'Support services — check missing needs',
      points: -6,
      message: `Support services cover one need. Ask about ${unmetLabels.join(', ')} before deciding.`,
    };
  }

  return {
    category: 'support',
    label: 'Check support',
    points: -14,
    message: 'Support services may need a closer check before this feels workable.',
  };
}

function getAccessSignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const gpaBand = profile.gpaBand;
  const openAccess = programme.acceptanceRate >= 90;
  const broadAccess = programme.acceptanceRate >= 75;
  const nonTraditional = isNonTraditionalStudent(profile);

  if (!gpaBand || gpaBand === 'no-gpa') {
    return {
      category: 'access',
      label: 'Entry review',
      points: openAccess ? 10 : 3,
      message: openAccess
        ? 'Open entry makes this easier to explore without GPA pressure.'
        : 'Check entry rules because no GPA was given.',
    };
  }

  if (gpaBand === 'below-2.0' || gpaBand === '2.0-2.4') {
    if (openAccess) {
      return {
        category: 'access',
        label: 'Easy-entry fit',
        points: 22,
        message: `${GPA_BAND_LABELS[gpaBand]} students may benefit from flexible entry here.`,
      };
    }

    // LRE principle: do not bury programmes for non-traditional students just
    // because entry is selective. Reduce the penalty so the full range of
    // options stays visible. Support services can bridge the gap — name that.
    const supportMatchCount = getProgrammeSupportCoverage(programme).filter((s) =>
      profile.supportNeeds.includes(s as (typeof profile.supportNeeds)[number]),
    ).length;
    const accessPenalty = nonTraditional
      ? supportMatchCount > 0
        ? -3
        : -6
      : -14;

    return {
      category: 'access',
      label: 'Entry check',
      points: accessPenalty,
      message: 'Ask how entry works here — support services may help bridge the gap.',
    };
  }

  if (gpaBand === '2.5-2.9') {
    return broadAccess
      ? {
          category: 'access',
          label: 'Good entry option',
          points: 10,
          message: 'Entry looks workable for your list.',
        }
      : {
          category: 'access',
          label: 'Entry check',
          points: -5,
          message: 'This may need more entry planning than your top options.',
        };
  }

  return {
    category: 'access',
    label: 'School fit',
    points: 6,
    message: 'Your school record looks close enough to compare.',
  };
}

function getStudentReadySignal(
  programme: Programme,
  profile: OnboardingData,
): ProgrammeFitSignal {
  const supportNeeds = profile.supportNeeds.filter((support) => support !== 'none');
  const hasHigherSupportNeed = supportNeeds.some((support) =>
    [
      'disability-services',
      'iep-support',
      'mental-health',
      'first-gen',
      'childcare',
      'language-support',
      'housing',
      'financial-aid',
    ].includes(support),
  );
  const needsFlexibleEntry =
    profile.gpaBand === 'below-2.0' ||
    profile.gpaBand === '2.0-2.4' ||
    profile.gpaBand === 'no-gpa';
  const needsLowerCost = profile.affordabilitySensitivity <= 2;
  const flexiblePath = [
    '2-year-community-college',
    'trade-vocational',
    'certificate-program',
    'apprenticeship',
    'online-degree',
  ].includes(programme.pathway);
  const openEntry = programme.acceptanceRate >= 90;
  const lowCost = programme.annualTuition <= 5000;
  const supportCoverage = getProgrammeSupportCoverage(programme);
  const supportMatches = supportCoverage.filter((support) =>
    supportNeeds.includes(support as (typeof supportNeeds)[number]),
  ).length;
  const hasDeliveryFit =
    profile.locationPreference === 'online-only'
      ? programme.delivery === 'Online'
      : programme.delivery !== 'Online' || profile.locationPreference === 'no-preference';
  const needsStudentReadyFit =
    hasHigherSupportNeed || needsFlexibleEntry || needsLowerCost;
  const selectedInterests = profile.interests.filter(
    (interest): interest is Exclude<typeof interest, 'undecided'> =>
      interest !== 'undecided',
  );
  const hasInterestFit =
    selectedInterests.length === 0 ||
    profile.interests.includes('undecided') ||
    programme.interests.some(
      (interest) => interest !== 'undecided' && selectedInterests.includes(interest),
    );
  const hasPathwayFit =
    !profile.pathwayPreference ||
    profile.pathwayPreference === 'undecided' ||
    profile.pathwayPreference === programme.pathway;
  const nonTraditional = isNonTraditionalStudent(profile);

  if (!needsStudentReadyFit) {
    return {
      category: 'student-ready',
      label: 'Fit check',
      points: flexiblePath ? 4 : 2,
      message: 'This path has practical details to compare.',
    };
  }

  let points = 0;
  const matchedSignals: string[] = [];
  const missingSignals: string[] = [];

  if (flexiblePath) {
    points += 7;
    matchedSignals.push('flexible path');
  }
  // No penalty for 4-year or other non-flexible paths.
  // LRE principle: always show students the highest-credential option where
  // they can succeed with the right support — do not steer them away from
  // 4-year programmes solely because of pathway type.

  if (needsFlexibleEntry) {
    if (openEntry) {
      points += 10;
      matchedSignals.push('open entry');
    } else {
      points -= 8;
      missingSignals.push('entry rules');
    }
  }

  if (needsLowerCost) {
    if (lowCost) {
      points += 8;
      matchedSignals.push('lower cost');
    } else {
      points -= 6;
      missingSignals.push('aid and price');
    }
  }

  if (hasHigherSupportNeed) {
    if (supportMatches >= Math.min(2, supportNeeds.length)) {
      points += 12;
      matchedSignals.push('needed support');
    } else if (supportMatches === 1) {
      points += 5;
      matchedSignals.push('some support');
    } else {
      points -= 10;
      missingSignals.push('support services');
    }
  }

  if (hasDeliveryFit) {
    points += 4;
    matchedSignals.push('workable schedule or place');
  } else {
    points -= 4;
    missingSignals.push('place or schedule');
  }

  if (!hasInterestFit) {
    points -= 10;
    missingSignals.push('field of study fit');
  }

  if (!hasPathwayFit) {
    points -= 10;
    missingSignals.push('pathway fit');
  }

  // LRE stretch signal: for non-traditional students at a 4-year programme
  // where support alignment is strong, give a positive signal that this higher
  // credential level is genuinely reachable with the right services in place.
  if (nonTraditional && !flexiblePath && supportMatches >= Math.min(2, supportNeeds.length)) {
    points += 8;
    matchedSignals.push('support-ready at this level');
  }

  if (points >= 18) {
    return {
      category: 'student-ready',
      label: 'Student-ready fit',
      points,
      message: `Meets you where you are with ${formatList(matchedSignals)}.`,
    };
  }

  if (points >= 6) {
    return {
      category: 'student-ready',
      label: 'Good support check',
      points,
      message: `Has ${formatList(matchedSignals)}. Also check ${formatList(missingSignals)}.`,
    };
  }

  return {
    category: 'student-ready',
    label: 'Needs closer support check',
    points,
    message: `Before choosing this, check ${formatList(missingSignals)}.`,
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

function formatList(items: string[]) {
  if (items.length === 0) {
    return 'the key details';
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function getSignalPoints(
  fit: ProgrammeFitExplanation,
  category: FitCategory,
) {
  return fit.signals
    .filter((signal) => signal.category === category)
    .reduce((sum, signal) => sum + signal.points, 0);
}

function getRawFitScore(fit: ProgrammeFitExplanation) {
  return 35 + fit.signals.reduce((sum, signal) => sum + signal.points, 0);
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
