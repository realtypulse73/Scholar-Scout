import type { Programme } from '@/lib/programmes';
import type { RankedProgrammeMatch } from '@/lib/preference-matching';
import type { SimulationRecommendationSignal } from '@/lib/simulation-recommendation-signals';

export type AdvisorTone = 'encouraging' | 'caution' | 'action' | 'insight';

export interface AdvisorMessage {
  tone: AdvisorTone;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface AdvisorRecommendationInput {
  topProgramme?: Programme;
  topMatch?: RankedProgrammeMatch;
  simulationSignal?: SimulationRecommendationSignal;
  clarityScore?: number;
  verificationCount?: number;
  simulationDrivenCount?: number;
}

export function buildAdvisorMessages({
  topProgramme,
  topMatch,
  simulationSignal,
  clarityScore = 0,
  verificationCount = 0,
  simulationDrivenCount = 0,
}: AdvisorRecommendationInput): AdvisorMessage[] {
  const messages: AdvisorMessage[] = [];

  if (!topProgramme || !topMatch) {
    return [
      {
        tone: 'action',
        title: 'Let’s build your first recommendation.',
        body:
          'Complete onboarding and try at least one simulation so ScholarScout can compare what you say you want with what you actually respond to.',
        actionLabel: 'Start onboarding',
        actionHref: '/onboarding',
      },
    ];
  }

  messages.push({
    tone: 'insight',
    title: `I’m seeing ${topProgramme.name} as your strongest next move.`,
    body: `${topProgramme.school} is rising because it fits your profile and currently scores ${topMatch.fit.score}% before any simulation adjustment.`,
    actionLabel: 'View programme',
    actionHref: `/programmes/${topProgramme.id}`,
  });

  if (simulationSignal && simulationSignal.boost > 0) {
    messages.push({
      tone: 'encouraging',
      title: 'Your simulation behavior changed the recommendation.',
      body:
        simulationSignal.reasons[0] ??
        `This option received a ${simulationSignal.boost}-point boost because it lines up with what you tested in a career simulation.`,
      actionLabel: 'Try another simulation',
      actionHref: '/explore',
    });
  } else {
    messages.push({
      tone: 'action',
      title: 'Try a simulation to sharpen this recommendation.',
      body:
        'Right now I’m ranking mostly from your onboarding answers. A career simulation can show whether the environment actually feels right.',
      actionLabel: 'Explore careers',
      actionHref: '/explore',
    });
  }

  if (topMatch.fit.cautions.length > 0 || verificationCount > 0) {
    messages.push({
      tone: 'caution',
      title: 'Don’t decide until you verify the risk items.',
      body:
        topMatch.fit.cautions[0] ??
        `There are ${verificationCount} items to verify across the pathway before treating this as ready.`,
      actionLabel: 'Compare shortlist',
      actionHref: '/shortlist',
    });
  } else {
    messages.push({
      tone: 'encouraging',
      title: 'This path looks clean enough to explore seriously.',
      body:
        'I’m not seeing a major warning from the current data. Your next move is to compare cost, support, and timing before applying.',
      actionLabel: 'Compare shortlist',
      actionHref: '/shortlist',
    });
  }

  if (clarityScore > 0) {
    messages.push({
      tone: clarityScore >= 80 ? 'encouraging' : 'insight',
      title: `Your clarity score is ${clarityScore}%.`,
      body:
        clarityScore >= 80
          ? 'That means your simulation results are giving strong signals. You can move from browsing into comparing specific pathways.'
          : 'That means you have useful signals, but trying another environment may make the next recommendation more confident.',
      actionLabel: clarityScore >= 80 ? 'See recommendations' : 'Try another simulation',
      actionHref: clarityScore >= 80 ? '/recommendations' : '/explore',
    });
  }

  if (simulationDrivenCount > 1) {
    messages.push({
      tone: 'insight',
      title: `${simulationDrivenCount} recommendations are now simulation-driven.`,
      body:
        'That tells me your career exploration is starting to shape the ranking. Focus on the options that moved up for reasons you understand.',
    });
  }

  return messages.slice(0, 5);
}
