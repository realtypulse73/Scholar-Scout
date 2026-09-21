import {
  INTEREST_LABELS,
  normalizeOrdinarySupportPreferences,
  PATHWAY_LABELS,
  type OnboardingData,
  type OrdinarySupportCategory,
} from '@/lib/onboarding-types';
import {
  normalizeProgrammeForGovernance,
  type Programme,
  type ProgrammeFieldEvidence,
} from '@/lib/programmes';

export interface OpportunityMatchEvidence {
  state: ProgrammeFieldEvidence['state'];
  sourceLabel?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  verificationGuidance: string;
}

export interface OpportunityMatch {
  programme: Programme;
  reasons: string[];
  cautions: string[];
  evidence: OpportunityMatchEvidence;
  sortKey: number;
}

/** Uses only normalized ordinary preferences and governed catalogue evidence. */
export function rankOpportunityMatches(
  programmes: Programme[],
  profile: OnboardingData | null,
): OpportunityMatch[] {
  const ordinarySupportPreferences = normalizeOrdinarySupportPreferences(
    profile?.supportNeeds ?? [],
  );

  return programmes
    .map((programme) =>
      createOpportunityMatch(programme, profile, ordinarySupportPreferences),
    )
    .sort(
      (left, right) =>
        right.sortKey - left.sortKey ||
        left.programme.id.localeCompare(right.programme.id),
    );
}

function createOpportunityMatch(
  candidate: Programme,
  profile: OnboardingData | null,
  ordinarySupportPreferences: OrdinarySupportCategory[],
): OpportunityMatch {
  const programme = normalizeProgrammeForGovernance(candidate);
  const reasons: string[] = [];
  const cautions: string[] = [];
  let sortKey = 0;
  const selectedInterests =
    profile?.interests.filter((interest) => interest !== 'undecided') ?? [];
  const matchingInterests = programme.interests.filter((interest) =>
    selectedInterests.includes(interest),
  );

  if (matchingInterests.length > 0) {
    sortKey += matchingInterests.length * 12;
    reasons.push(
      `Includes ${matchingInterests
        .map((interest) => INTEREST_LABELS[interest])
        .join(' and ')} details you selected.`,
    );
  }
  if (
    profile?.pathwayPreference &&
    profile.pathwayPreference !== 'undecided' &&
    profile.pathwayPreference === programme.pathway
  ) {
    sortKey += 10;
    reasons.push(
      `Matches your ${PATHWAY_LABELS[profile.pathwayPreference]} pathway preference.`,
    );
  }
  if (profile?.locationPreference === 'online-only' && programme.delivery === 'Online') {
    sortKey += 8;
    reasons.push('Lists online delivery, which matches your location preference.');
  }
  if (profile?.affordabilitySensitivity && programme.annualTuition <= 8000) {
    sortKey += profile.affordabilitySensitivity >= 4 ? 6 : 3;
    reasons.push(
      `Lists annual tuition of $${programme.annualTuition.toLocaleString()}, so you can compare costs.`,
    );
  }

  for (const support of ordinarySupportPreferences) {
    const evidence = programme.programmeEvidence?.supportBundle.find(
      (item) => item.support === support,
    )?.evidence;
    if (evidence?.state === 'documented') {
      sortKey += 14;
      reasons.push(`Documents ${formatSupport(support)} support for you to verify.`);
    } else {
      sortKey -= 14;
      cautions.push(
        `${formatSupport(support)} support is not documented here. Verify availability directly with the programme.`,
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push(`Lists a ${programme.pathway.replaceAll('-', ' ')} pathway to explore.`);
  }
  if (reasons.length === 1) {
    reasons.push(
      `Lists ${programme.delivery.toLowerCase()} delivery and ${programme.duration} duration details.`,
    );
  }

  const rawEvidence = programme.programmeEvidence?.materialFacts.tuition;
  const evidence = rawEvidence ?? {
    state: 'unknown' as const,
    verificationGuidance: 'Verify this information directly with the programme.',
  };
  if (evidence.state !== 'documented') {
    cautions.push(
      evidence.verificationGuidance ||
        'This detail is not currently documented. Verify it directly with the programme.',
    );
  }

  return {
    programme,
    reasons: reasons.slice(0, 4),
    cautions: Array.from(new Set(cautions)),
    evidence: {
      state: evidence.state,
      sourceLabel: evidence.sourceLabel,
      sourceUrl: evidence.sourceUrl,
      lastVerifiedAt: evidence.lastVerifiedAt,
      verificationGuidance:
        evidence.verificationGuidance ||
        'Verify this information directly with the programme.',
    },
    sortKey,
  };
}

function formatSupport(support: OrdinarySupportCategory): string {
  return support.replaceAll('-', ' ');
}
