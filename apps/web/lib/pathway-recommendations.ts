import type { OnboardingData } from '@/lib/onboarding-types';
import { PATHWAY_LABELS } from '@/lib/onboarding-types';
import type { Programme } from '@/lib/programmes';
import { PROGRAMME_PATHWAY_LABELS } from '@/lib/programmes';
import { explainProgrammeFit } from '@/lib/preference-matching';

export type PathwayPhaseType = 'start' | 'bridge' | 'advance' | 'verify';
export type PathwayPriority = 'high' | 'medium' | 'low';

export interface PathwayRecommendationPhase {
  type: PathwayPhaseType;
  title: string;
  description: string;
  actions: string[];
}

export interface PathwayRecommendation {
  programme: Programme;
  headline: string;
  priority: PathwayPriority;
  confidenceScore: number;
  rationale: string[];
  phases: PathwayRecommendationPhase[];
}

export function buildPathwayRecommendation(
  programme: Programme,
  profile: OnboardingData | null,
): PathwayRecommendation {
  const fit = profile ? explainProgrammeFit(programme, profile) : null;
  const confidenceScore = fit?.score ?? programme.matchScore;
  const priority = getPriority(confidenceScore);
  const pathwayLabel = PROGRAMME_PATHWAY_LABELS[programme.pathway];
  const userPathway = profile?.pathwayPreference
    ? PATHWAY_LABELS[profile.pathwayPreference]
    : 'an open pathway';

  return {
    programme,
    headline: getPathwayHeadline(programme, confidenceScore),
    priority,
    confidenceScore,
    rationale:
      fit?.reasons.slice(0, 3) ?? [
        `${pathwayLabel} option with ${programme.acceptanceRate}% entry flexibility.`,
        `Estimated annual tuition is $${programme.annualTuition.toLocaleString()}.`,
      ],
    phases: [
      getStartPhase(programme, userPathway),
      getBridgePhase(programme),
      getAdvancePhase(programme),
      getVerifyPhase(programme, fit?.cautions ?? []),
    ],
  };
}

export function buildPathwayRecommendations(
  programmes: Programme[],
  profile: OnboardingData | null,
): PathwayRecommendation[] {
  return programmes
    .map((programme) => buildPathwayRecommendation(programme, profile))
    .sort(
      (a, b) =>
        b.confidenceScore - a.confidenceScore ||
        a.programme.annualTuition - b.programme.annualTuition,
    );
}

function getPriority(score: number): PathwayPriority {
  if (score >= 82) {
    return 'high';
  }

  if (score >= 65) {
    return 'medium';
  }

  return 'low';
}

function getPathwayHeadline(programme: Programme, score: number) {
  if (score >= 82) {
    return `Start here: ${programme.name} is a strong practical route.`;
  }

  if (score >= 65) {
    return `Explore ${programme.name} as a realistic pathway option.`;
  }

  return `Keep ${programme.name} in review until fit questions are answered.`;
}

function getStartPhase(
  programme: Programme,
  userPathway: string,
): PathwayRecommendationPhase {
  return {
    type: 'start',
    title: 'Step 1 — Start with the lowest-friction entry point',
    description: `${programme.name} gives the student a concrete ${PROGRAMME_PATHWAY_LABELS[programme.pathway]} starting point while comparing it against ${userPathway}.`,
    actions: [
      programme.nextSteps[0] ?? 'Contact the admissions or programme team.',
      'Confirm application deadline, required documents, and whether the programme is open-access or selective.',
      'Ask what a successful first term looks like for a student with this profile.',
    ],
  };
}

function getBridgePhase(programme: Programme): PathwayRecommendationPhase {
  const transferAction = getBridgeAction(programme);

  return {
    type: 'bridge',
    title: 'Step 2 — Build the bridge before committing',
    description:
      'ScholarScout should not only point to a programme; it should identify the next move that keeps options open.',
    actions: [
      transferAction,
      'Confirm whether credits, credentials, or hours transfer into the next education or career step.',
      'Identify the advisor, counselor, or mentor responsible for helping the student stay on track.',
    ],
  };
}

function getAdvancePhase(programme: Programme): PathwayRecommendationPhase {
  return {
    type: 'advance',
    title: 'Step 3 — Define the outcome route',
    description: getAdvanceDescription(programme),
    actions: [
      'Map the expected credential to a job, transfer, apprenticeship, or degree outcome.',
      'Estimate total cost through completion, not just first-year tuition.',
      'Set a 30/60/90-day follow-up plan after enrollment or acceptance.',
    ],
  };
}

function getVerifyPhase(
  programme: Programme,
  cautions: string[],
): PathwayRecommendationPhase {
  return {
    type: 'verify',
    title: 'Step 4 — Verify the risk items',
    description:
      cautions.length > 0
        ? 'This path has promising signals, but these items should be checked before the student treats it as a primary option.'
        : 'This path has no major matching cautions in the current data, but core facts should still be verified.',
    actions:
      cautions.length > 0
        ? cautions.map((caution) => `Verify: ${caution}`)
        : [
            'Verify tuition, fees, aid, and required materials directly with the institution.',
            'Confirm support services are active and accessible to this student.',
            'Confirm the next available start date.',
          ],
  };
}

function getBridgeAction(programme: Programme) {
  switch (programme.pathway) {
    case '2-year-community-college':
      return 'Ask for a transfer map into a four-year or career-specific programme before enrollment.';
    case 'certificate-program':
      return 'Ask which jobs, certifications, or stackable credentials this certificate leads into.';
    case 'trade-vocational':
      return 'Ask whether the training connects to union, apprenticeship, licensing, or employer placement pathways.';
    case 'apprenticeship':
      return 'Confirm paid hours, mentor structure, credential outcome, and employer commitments.';
    case 'online-degree':
      return 'Confirm pacing, transfer credit, advising access, and technology requirements before committing.';
    case '4-year-university':
    default:
      return 'Ask for a degree map, first-year support plan, and major-change options.';
  }
}

function getAdvanceDescription(programme: Programme) {
  switch (programme.pathway) {
    case '2-year-community-college':
      return 'The route should clarify whether the student is building toward transfer, employment, or a shorter credential.';
    case 'certificate-program':
      return 'The route should clarify the immediate career outcome and whether the certificate stacks into a longer credential.';
    case 'trade-vocational':
      return 'The route should clarify licensing, placement, wage progression, and employer connections.';
    case 'apprenticeship':
      return 'The route should clarify the paid-work pathway and long-term credential value.';
    case 'online-degree':
      return 'The route should clarify pacing, completion supports, and how online study fits the student’s life.';
    case '4-year-university':
    default:
      return 'The route should clarify major fit, first-year retention supports, and career or graduate-school outcomes.';
  }
}
