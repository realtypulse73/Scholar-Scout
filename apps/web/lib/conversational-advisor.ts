import type { Programme } from '@/lib/programmes';

export type AdvisorChatRole = 'advisor' | 'student';

export interface AdvisorChatMessage {
  id: string;
  role: AdvisorChatRole;
  content: string;
}

export interface AdvisorContext {
  topProgramme?: Programme;
  finalScore?: number;
  simulationBoost?: number;
  clarityScore?: number;
  cautions?: string[];
  simulationReasons?: string[];
}

export function getInitialAdvisorMessages(context: AdvisorContext): AdvisorChatMessage[] {
  const topName = context.topProgramme?.name ?? 'your strongest pathway';
  const score = context.finalScore ? `${context.finalScore}%` : 'a strong';

  return [
    {
      id: 'advisor-welcome',
      role: 'advisor',
      content: `I’m your ScholarScout advisor. Right now, I’m seeing ${topName} as ${score} fit. Ask me why, what to verify, or what your next move should be.`,
    },
  ];
}

export function answerAdvisorQuestion(
  question: string,
  context: AdvisorContext,
): AdvisorChatMessage {
  const normalized = question.toLowerCase();
  const topName = context.topProgramme?.name ?? 'this option';

  if (normalized.includes('why') || normalized.includes('best')) {
    return advisorReply(
      `${topName} is ranking highly because it lines up with your profile signals${context.simulationBoost ? ` and received a ${context.simulationBoost}-point simulation boost` : ''}. ${context.simulationReasons?.[0] ?? 'It is a practical option to compare against your goals, cost tolerance, and support needs.'}`,
    );
  }

  if (normalized.includes('risk') || normalized.includes('verify') || normalized.includes('wrong')) {
    return advisorReply(
      context.cautions?.[0]
        ? `Before you commit, verify this: ${context.cautions[0]}`
        : 'I do not see a major warning from the current data, but you should still verify total cost, admissions requirements, support services, and start dates.',
    );
  }

  if (normalized.includes('next') || normalized.includes('do')) {
    return advisorReply(
      `Your next move is to open ${topName}, compare it against one backup option, and shortlist the pathway if the cost and support services check out.`,
    );
  }

  if (normalized.includes('simulation') || normalized.includes('career')) {
    return advisorReply(
      context.simulationBoost
        ? `Your simulation results are already shaping the ranking. They suggest that the environment you tested connects to ${topName}.`
        : 'Try one simulation next. It will help me compare what you say you want with what you actually respond to inside a career environment.',
    );
  }

  if (normalized.includes('college') || normalized.includes('trade') || normalized.includes('degree')) {
    return advisorReply(
      'Think in pathways, not labels. The best route may be a trade, certificate, two-year, online, apprenticeship, or four-year path depending on cost, access, support, and what kind of environment you respond to.',
    );
  }

  return advisorReply(
    `I would start by asking three questions: Can you afford ${topName}? Can you realistically enter it? And does the environment fit how you like to work? If those are yes, it belongs on your shortlist.`,
  );
}

function advisorReply(content: string): AdvisorChatMessage {
  return {
    id: `advisor-${Date.now()}`,
    role: 'advisor',
    content,
  };
}
