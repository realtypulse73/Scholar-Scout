import type { Programme } from '@/lib/programmes';
import type { OnboardingData, Interest, SupportNeed } from '@/lib/onboarding-types';
import { INTEREST_LABELS, SUPPORT_NEED_LABELS } from '@/lib/onboarding-types';
import { getRankedProgrammeMatches } from '@/lib/preference-matching';
import { predictProgrammeDecisions } from '@/lib/predictive-decisions';
import type { ShortlistPlanMap } from '@/lib/shortlist';

export type InstitutionalOpportunityType =
  | 'student-demand'
  | 'support-gap'
  | 'affordability-gap'
  | 'access-opportunity'
  | 'pathway-growth';

export type InstitutionalPriority = 'high' | 'medium' | 'low';

export interface InstitutionalCohortInput {
  profile: OnboardingData | null;
  shortlistIds: string[];
  plans: ShortlistPlanMap;
}

export interface InstitutionalSignal {
  label: string;
  value: string;
  priority: InstitutionalPriority;
}

export interface InstitutionalOpportunity {
  type: InstitutionalOpportunityType;
  title: string;
  priority: InstitutionalPriority;
  description: string;
  recommendedActions: string[];
}

export interface ProgrammeInstitutionalInsight {
  programme: Programme;
  demandScore: number;
  predictedChoiceShare: number;
  supportFitScore: number;
  affordabilityFit: InstitutionalPriority;
  accessFit: InstitutionalPriority;
  signals: InstitutionalSignal[];
}

export interface InstitutionalIntelligenceReport {
  totalProfiles: number;
  activeDemandAreas: InstitutionalSignal[];
  supportNeeds: InstitutionalSignal[];
  programmeInsights: ProgrammeInstitutionalInsight[];
  opportunities: InstitutionalOpportunity[];
}

export function buildInstitutionalIntelligenceReport(
  programmes: Programme[],
  cohorts: InstitutionalCohortInput[],
): InstitutionalIntelligenceReport {
  const usableCohorts = cohorts.filter((cohort) => cohort.profile);
  const programmeInsights = programmes
    .map((programme) => getProgrammeInstitutionalInsight(programme, programmes, usableCohorts))
    .sort((a, b) => b.demandScore - a.demandScore || b.predictedChoiceShare - a.predictedChoiceShare);

  return {
    totalProfiles: usableCohorts.length,
    activeDemandAreas: getDemandSignals(usableCohorts),
    supportNeeds: getSupportSignals(usableCohorts),
    programmeInsights,
    opportunities: getInstitutionalOpportunities(programmes, usableCohorts, programmeInsights),
  };
}

function getProgrammeInstitutionalInsight(
  programme: Programme,
  programmes: Programme[],
  cohorts: InstitutionalCohortInput[],
): ProgrammeInstitutionalInsight {
  if (cohorts.length === 0) {
    return {
      programme,
      demandScore: programme.matchScore,
      predictedChoiceShare: 0,
      supportFitScore: programme.support.length * 10,
      affordabilityFit: getAffordabilityPriority(programme.annualTuition),
      accessFit: getAccessPriority(programme.acceptanceRate),
      signals: [
        {
          label: 'Baseline fit',
          value: `${programme.matchScore}%`,
          priority: programme.matchScore >= 85 ? 'high' : 'medium',
        },
      ],
    };
  }

  let demandScore = 0;
  let predictedChoiceShare = 0;
  let supportFitScore = 0;

  cohorts.forEach((cohort) => {
    if (!cohort.profile) {
      return;
    }

    const ranked = getRankedProgrammeMatches(programmes, cohort.profile);
    const match = ranked.find((item) => item.programme.id === programme.id);
    demandScore += match?.fit.score ?? programme.matchScore;

    const predictions = predictProgrammeDecisions(programmes, cohort);
    const prediction = predictions.find((item) => item.programme.id === programme.id);
    predictedChoiceShare += prediction?.choiceProbability ?? 0;

    const neededSupports = cohort.profile.supportNeeds.filter((support) => support !== 'none');
    const matchedSupports = neededSupports.filter((support) => programme.support.includes(support));
    supportFitScore += neededSupports.length === 0
      ? 70
      : Math.round((matchedSupports.length / neededSupports.length) * 100);
  });

  const normalizedDemandScore = Math.round(demandScore / cohorts.length);
  const normalizedChoiceShare = Math.round(predictedChoiceShare / cohorts.length);
  const normalizedSupportFit = Math.round(supportFitScore / cohorts.length);

  return {
    programme,
    demandScore: normalizedDemandScore,
    predictedChoiceShare: normalizedChoiceShare,
    supportFitScore: normalizedSupportFit,
    affordabilityFit: getAffordabilityPriority(programme.annualTuition),
    accessFit: getAccessPriority(programme.acceptanceRate),
    signals: [
      {
        label: 'Demand score',
        value: `${normalizedDemandScore}%`,
        priority: normalizedDemandScore >= 80 ? 'high' : normalizedDemandScore >= 65 ? 'medium' : 'low',
      },
      {
        label: 'Predicted choice share',
        value: `${normalizedChoiceShare}%`,
        priority: normalizedChoiceShare >= 65 ? 'high' : normalizedChoiceShare >= 45 ? 'medium' : 'low',
      },
      {
        label: 'Support fit',
        value: `${normalizedSupportFit}%`,
        priority: normalizedSupportFit >= 80 ? 'high' : normalizedSupportFit >= 55 ? 'medium' : 'low',
      },
    ],
  };
}

function getDemandSignals(cohorts: InstitutionalCohortInput[]): InstitutionalSignal[] {
  const counts = new Map<Interest, number>();

  cohorts.forEach((cohort) => {
    cohort.profile?.interests.forEach((interest) => {
      if (interest !== 'undecided') {
        counts.set(interest, (counts.get(interest) ?? 0) + 1);
      }
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([interest, count]) => ({
      label: INTEREST_LABELS[interest],
      value: `${count} interested profile${count === 1 ? '' : 's'}`,
      priority: count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low',
    }));
}

function getSupportSignals(cohorts: InstitutionalCohortInput[]): InstitutionalSignal[] {
  const counts = new Map<SupportNeed, number>();

  cohorts.forEach((cohort) => {
    cohort.profile?.supportNeeds.forEach((support) => {
      if (support !== 'none') {
        counts.set(support, (counts.get(support) ?? 0) + 1);
      }
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([support, count]) => ({
      label: SUPPORT_NEED_LABELS[support],
      value: `${count} profile${count === 1 ? '' : 's'}`,
      priority: count >= 5 ? 'high' : count >= 2 ? 'medium' : 'low',
    }));
}

function getInstitutionalOpportunities(
  programmes: Programme[],
  cohorts: InstitutionalCohortInput[],
  programmeInsights: ProgrammeInstitutionalInsight[],
): InstitutionalOpportunity[] {
  const opportunities: InstitutionalOpportunity[] = [];
  const topDemand = getDemandSignals(cohorts)[0];
  const topSupport = getSupportSignals(cohorts)[0];
  const highDemandLowSupport = programmeInsights.find(
    (insight) => insight.demandScore >= 70 && insight.supportFitScore < 60,
  );
  const highDemandHighCost = programmeInsights.find(
    (insight) => insight.demandScore >= 70 && insight.programme.annualTuition > 9000,
  );
  const openAccessProgrammes = programmes.filter((programme) => programme.acceptanceRate >= 90);

  if (topDemand) {
    opportunities.push({
      type: 'student-demand',
      title: `Demand signal: ${topDemand.label}`,
      priority: topDemand.priority,
      description: `${topDemand.value} are showing interest in this area. Institutions should treat this as a recruiting and content opportunity.`,
      recommendedActions: [
        'Create student-facing pathway content for this interest area.',
        'Promote low-friction entry points and support services connected to this demand.',
        'Invite counselors or programme staff to explain next steps in plain language.',
      ],
    });
  }

  if (topSupport) {
    opportunities.push({
      type: 'support-gap',
      title: `Support need signal: ${topSupport.label}`,
      priority: topSupport.priority,
      description: `${topSupport.value} show this need. Institutions with credible support should surface it earlier in the decision journey.`,
      recommendedActions: [
        'Add proof of support availability to programme pages.',
        'Offer direct counselor contact before application.',
        'Track whether this support need correlates with shortlist conversion.',
      ],
    });
  }

  if (highDemandLowSupport) {
    opportunities.push({
      type: 'support-gap',
      title: `${highDemandLowSupport.programme.name} has demand but weak support fit`,
      priority: 'high',
      description: 'Student interest exists, but support alignment may block conversion or persistence.',
      recommendedActions: [
        'Confirm which support services are actually available for this programme.',
        'Add missing support partnerships or advising workflows.',
        'Flag this programme for staff review before scaling promotion.',
      ],
    });
  }

  if (highDemandHighCost) {
    opportunities.push({
      type: 'affordability-gap',
      title: `${highDemandHighCost.programme.name} may need an affordability bridge`,
      priority: 'medium',
      description: 'Demand is strong, but cost may reduce conversion without scholarship, aid, or payment-plan clarity.',
      recommendedActions: [
        'Surface net-price, aid, and scholarship details earlier.',
        'Offer a financial-aid checklist before application.',
        'Compare this pathway against lower-cost alternatives.',
      ],
    });
  }

  if (openAccessProgrammes.length > 0) {
    opportunities.push({
      type: 'access-opportunity',
      title: 'Open-access programmes can anchor rejection-free discovery',
      priority: 'high',
      description: `${openAccessProgrammes.length} programme${openAccessProgrammes.length === 1 ? '' : 's'} currently show high entry flexibility.`,
      recommendedActions: [
        'Position open-access routes as confidence-building first steps.',
        'Pair open-access options with transfer, certificate, or career outcomes.',
        'Use these routes for students with uncertain GPA or prior academic barriers.',
      ],
    });
  }

  return opportunities.slice(0, 6);
}

function getAffordabilityPriority(annualTuition: number): InstitutionalPriority {
  if (annualTuition <= 5000) {
    return 'high';
  }

  if (annualTuition <= 9000) {
    return 'medium';
  }

  return 'low';
}

function getAccessPriority(acceptanceRate: number): InstitutionalPriority {
  if (acceptanceRate >= 90) {
    return 'high';
  }

  if (acceptanceRate >= 70) {
    return 'medium';
  }

  return 'low';
}
