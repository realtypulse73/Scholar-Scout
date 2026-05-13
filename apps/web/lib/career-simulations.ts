import type { Interest, PathwayPreference, SupportNeed } from '@/lib/onboarding-types';
import type { ProgrammePathway } from '@/lib/programmes';

export type SimulationEnvironment =
  | 'job-site'
  | 'security-operations-center'
  | 'healthcare-floor';

export type SimulationDecisionTrait =
  | 'hands-on'
  | 'analytical'
  | 'collaborative'
  | 'service-oriented'
  | 'pressure-ready'
  | 'detail-focused'
  | 'safety-minded'
  | 'communication';

export interface SimulationChoice {
  id: string;
  label: string;
  outcome: string;
  traitSignals: SimulationDecisionTrait[];
  points: number;
}

export interface SimulationStep {
  id: string;
  title: string;
  scene: string;
  prompt: string;
  choices: SimulationChoice[];
}

export interface CareerSimulation {
  id: string;
  title: string;
  careerTitle: string;
  environment: SimulationEnvironment;
  summary: string;
  imagePrompt: string;
  relatedInterests: Interest[];
  relatedPathways: ProgrammePathway[];
  recommendedSupports: SupportNeed[];
  steps: SimulationStep[];
}

export interface SimulationRunResult {
  simulationId: string;
  score: number;
  clarityScore: number;
  dominantTraits: SimulationDecisionTrait[];
  insights: string[];
  recommendedInterests: Interest[];
  recommendedPathways: PathwayPreference[];
  nextActions: string[];
}

export type SimulationAnswerMap = Record<string, string>;

export const CAREER_SIMULATIONS: CareerSimulation[] = [
  {
    id: 'electrician-job-site',
    title: 'Power Problem on a Job Site',
    careerTitle: 'Electrician / Electrical Technician',
    environment: 'job-site',
    summary:
      'Step into a construction site where a wing of a building has lost power and the crew needs a safe, practical fix.',
    imagePrompt:
      'A realistic construction job site with an apprentice electrician, tool belt, electrical panel, safety gear, and a supervisor reviewing plans.',
    relatedInterests: ['trades', 'stem', 'technology'],
    relatedPathways: ['trade-vocational', 'apprenticeship', 'certificate-program'],
    recommendedSupports: ['career-counseling', 'financial-aid', 'tutoring'],
    steps: [
      {
        id: 'site-arrival',
        title: 'Arrive and assess the scene',
        scene:
          'You arrive at 7:30 AM. The site is loud, the supervisor is waiting, and a section of temporary lighting is out.',
        prompt: 'What do you do first?',
        choices: [
          {
            id: 'check-panel',
            label: 'Inspect the labeled electrical panel and lockout area first.',
            outcome:
              'You slow the moment down, protect the crew, and start with safety before touching anything live.',
            traitSignals: ['safety-minded', 'detail-focused', 'hands-on'],
            points: 10,
          },
          {
            id: 'ask-supervisor',
            label: 'Ask the supervisor what changed since yesterday.',
            outcome:
              'You gather context quickly and learn another crew moved equipment near the affected circuit.',
            traitSignals: ['communication', 'collaborative'],
            points: 8,
          },
          {
            id: 'start-reset',
            label: 'Reset the breaker immediately to save time.',
            outcome:
              'The crew moves faster, but you risk missing a safety issue that caused the breaker to trip.',
            traitSignals: ['pressure-ready', 'hands-on'],
            points: 3,
          },
        ],
      },
      {
        id: 'find-cause',
        title: 'Find the cause',
        scene:
          'You trace the line and find a damaged extension near a high-traffic area. The crew wants the lights back on fast.',
        prompt: 'How do you handle it?',
        choices: [
          {
            id: 'remove-cord',
            label: 'Remove the damaged cord, tag it out, and route a safer temporary line.',
            outcome:
              'You solve the immediate problem and reduce the chance of a repeat incident.',
            traitSignals: ['safety-minded', 'hands-on', 'detail-focused'],
            points: 10,
          },
          {
            id: 'notify-team',
            label: 'Call the team together and explain the hazard before rerouting power.',
            outcome:
              'The fix takes longer, but everyone understands the risk and avoids the area.',
            traitSignals: ['communication', 'collaborative', 'safety-minded'],
            points: 9,
          },
          {
            id: 'quick-tape',
            label: 'Tape the damaged section and keep working until lunch.',
            outcome:
              'The lights come back quickly, but the hazard remains and could hurt someone.',
            traitSignals: ['pressure-ready'],
            points: 1,
          },
        ],
      },
      {
        id: 'career-fit',
        title: 'Decide if the work fits you',
        scene:
          'At the end of the morning, your supervisor asks if you could see yourself learning this trade full time.',
        prompt: 'What part of the work appealed to you most?',
        choices: [
          {
            id: 'solving-real-problems',
            label: 'Solving real physical problems with tools and skill.',
            outcome:
              'Hands-on technical work may be a strong fit for you.',
            traitSignals: ['hands-on', 'analytical'],
            points: 10,
          },
          {
            id: 'crew-teamwork',
            label: 'Working with a crew where everyone depends on each other.',
            outcome:
              'Team-based trade environments may keep you engaged.',
            traitSignals: ['collaborative', 'communication'],
            points: 8,
          },
          {
            id: 'not-sure-noise',
            label: 'I liked the problem-solving, but the noise and pace were a lot.',
            outcome:
              'A technical path may fit, but you may prefer a more controlled environment.',
            traitSignals: ['analytical', 'detail-focused'],
            points: 6,
          },
        ],
      },
    ],
  },
  {
    id: 'cybersecurity-incident',
    title: 'Suspicious Login Alert',
    careerTitle: 'Cybersecurity Analyst',
    environment: 'security-operations-center',
    summary:
      'Join a security operations team responding to suspicious login activity before it becomes a major breach.',
    imagePrompt:
      'A modern security operations center with analysts viewing dashboards, alert panels, code, and network maps on large monitors.',
    relatedInterests: ['technology', 'stem', 'business'],
    relatedPathways: ['certificate-program', 'online-degree', '2-year-community-college'],
    recommendedSupports: ['career-counseling', 'tutoring', 'language-support'],
    steps: [
      {
        id: 'alert-review',
        title: 'Review the alert',
        scene:
          'A dashboard flags multiple login attempts from a country where the company has no employees.',
        prompt: 'What is your first move?',
        choices: [
          {
            id: 'check-logs',
            label: 'Review logs, affected account history, and device fingerprints.',
            outcome:
              'You gather evidence before escalating and avoid overreacting to a false positive.',
            traitSignals: ['analytical', 'detail-focused'],
            points: 10,
          },
          {
            id: 'disable-account',
            label: 'Immediately disable the account and notify the user.',
            outcome:
              'You contain potential damage fast, but may disrupt work if the signal is incomplete.',
            traitSignals: ['pressure-ready', 'safety-minded'],
            points: 8,
          },
          {
            id: 'ignore-alert',
            label: 'Wait to see if the alert repeats.',
            outcome:
              'You avoid extra work now, but a real threat could spread while you wait.',
            traitSignals: ['pressure-ready'],
            points: 2,
          },
        ],
      },
      {
        id: 'team-response',
        title: 'Coordinate response',
        scene:
          'The logs show a likely compromise. Your manager asks for a clear summary for the response team.',
        prompt: 'How do you communicate the issue?',
        choices: [
          {
            id: 'brief-summary',
            label: 'Write a concise incident summary with evidence, risk, and recommended action.',
            outcome:
              'The team can act quickly because your communication is clear and evidence-based.',
            traitSignals: ['communication', 'analytical', 'detail-focused'],
            points: 10,
          },
          {
            id: 'technical-dump',
            label: 'Send all raw logs so the team can inspect everything.',
            outcome:
              'The information is complete, but the team loses time finding what matters.',
            traitSignals: ['detail-focused'],
            points: 5,
          },
          {
            id: 'verbal-only',
            label: 'Tell the nearest analyst verbally and keep investigating.',
            outcome:
              'You move fast, but key details may not reach everyone who needs them.',
            traitSignals: ['pressure-ready', 'collaborative'],
            points: 6,
          },
        ],
      },
      {
        id: 'fit-reflection',
        title: 'Reflect on the work',
        scene:
          'The incident is contained. You realize the job combined puzzles, pressure, documentation, and teamwork.',
        prompt: 'Which part gave you the most energy?',
        choices: [
          {
            id: 'puzzle',
            label: 'Investigating the puzzle and finding the pattern.',
            outcome:
              'Cybersecurity, IT, and data analysis pathways may fit your problem-solving style.',
            traitSignals: ['analytical', 'detail-focused'],
            points: 10,
          },
          {
            id: 'protecting-people',
            label: 'Protecting people from harm behind the scenes.',
            outcome:
              'Mission-driven technology work may keep you motivated.',
            traitSignals: ['service-oriented', 'safety-minded'],
            points: 8,
          },
          {
            id: 'too-much-screen',
            label: 'I liked the mission, but not sitting at screens all day.',
            outcome:
              'Technology may still fit, but you may prefer field tech, trades, or hybrid roles.',
            traitSignals: ['service-oriented', 'hands-on'],
            points: 6,
          },
        ],
      },
    ],
  },
  {
    id: 'healthcare-floor-shift',
    title: 'Busy Morning on a Healthcare Floor',
    careerTitle: 'Nursing / Patient Care',
    environment: 'healthcare-floor',
    summary:
      'Experience a healthcare floor where patient care, communication, and calm decision-making matter every minute.',
    imagePrompt:
      'A realistic hospital floor with a nurse, patient care assistant, medical chart, vitals monitor, and a diverse care team in motion.',
    relatedInterests: ['healthcare', 'social-sciences', 'stem'],
    relatedPathways: ['2-year-community-college', 'certificate-program', '4-year-university'],
    recommendedSupports: ['tutoring', 'mental-health', 'financial-aid'],
    steps: [
      {
        id: 'patient-call',
        title: 'Respond to a patient call',
        scene:
          'A patient presses the call button and says they feel dizzy. The hallway is busy and another staff member asks for help.',
        prompt: 'What do you do first?',
        choices: [
          {
            id: 'assess-patient',
            label: 'Check the patient, ask symptoms, and call for clinical support.',
            outcome:
              'You prioritize the patient and communicate the concern before it escalates.',
            traitSignals: ['service-oriented', 'communication', 'pressure-ready'],
            points: 10,
          },
          {
            id: 'ask-nurse',
            label: 'Immediately get the nurse before entering the room.',
            outcome:
              'You use the chain of support well, though the patient waits a little longer.',
            traitSignals: ['collaborative', 'safety-minded'],
            points: 8,
          },
          {
            id: 'finish-task',
            label: 'Finish your current task first because it was assigned earlier.',
            outcome:
              'You stay organized, but miss a chance to respond to a potentially urgent need.',
            traitSignals: ['detail-focused'],
            points: 3,
          },
        ],
      },
      {
        id: 'family-question',
        title: 'Talk with family',
        scene:
          'A family member is worried and asks you what is happening. You know some information, but not everything.',
        prompt: 'How do you respond?',
        choices: [
          {
            id: 'clear-boundary',
            label: 'Acknowledge concern, explain what you can, and bring in the nurse for clinical details.',
            outcome:
              'You build trust while staying within your role.',
            traitSignals: ['communication', 'service-oriented', 'safety-minded'],
            points: 10,
          },
          {
            id: 'reassure-only',
            label: 'Say everything is probably fine and keep moving.',
            outcome:
              'You reduce tension briefly, but the family may feel dismissed.',
            traitSignals: ['pressure-ready'],
            points: 4,
          },
          {
            id: 'medical-guess',
            label: 'Guess what might be wrong based on what you observed.',
            outcome:
              'You try to help, but guessing can create confusion and risk.',
            traitSignals: ['service-oriented'],
            points: 2,
          },
        ],
      },
      {
        id: 'fit-reflection',
        title: 'Reflect on the environment',
        scene:
          'The shift slows down. You think about whether direct care, movement, and emotional responsibility fit you.',
        prompt: 'What part of the work felt most meaningful?',
        choices: [
          {
            id: 'helping-patients',
            label: 'Helping people directly when they were vulnerable.',
            outcome:
              'Patient-care pathways may strongly fit your values.',
            traitSignals: ['service-oriented', 'communication'],
            points: 10,
          },
          {
            id: 'team-care',
            label: 'Being part of a care team with defined roles.',
            outcome:
              'Healthcare environments with structured teamwork may fit you.',
            traitSignals: ['collaborative', 'detail-focused'],
            points: 8,
          },
          {
            id: 'too-emotional',
            label: 'I cared, but the emotional pressure felt heavy.',
            outcome:
              'Healthcare may still fit, but you may prefer lab, admin, or technical health roles.',
            traitSignals: ['service-oriented', 'analytical'],
            points: 6,
          },
        ],
      },
    ],
  },
];

export function getCareerSimulationById(id: string) {
  return CAREER_SIMULATIONS.find((simulation) => simulation.id === id) ?? null;
}

export function evaluateSimulation(
  simulation: CareerSimulation,
  answers: SimulationAnswerMap,
): SimulationRunResult {
  const traitCounts = new Map<SimulationDecisionTrait, number>();
  let earnedPoints = 0;
  let possiblePoints = 0;

  simulation.steps.forEach((step) => {
    possiblePoints += Math.max(...step.choices.map((choice) => choice.points));
    const selectedChoice = step.choices.find(
      (choice) => choice.id === answers[step.id],
    );

    if (!selectedChoice) {
      return;
    }

    earnedPoints += selectedChoice.points;
    selectedChoice.traitSignals.forEach((trait) => {
      traitCounts.set(trait, (traitCounts.get(trait) ?? 0) + 1);
    });
  });

  const dominantTraits = Array.from(traitCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trait]) => trait);
  const score = Math.round((earnedPoints / Math.max(possiblePoints, 1)) * 100);

  return {
    simulationId: simulation.id,
    score,
    clarityScore: Math.min(100, 35 + score),
    dominantTraits,
    insights: getSimulationInsights(simulation, dominantTraits, score),
    recommendedInterests: simulation.relatedInterests,
    recommendedPathways: simulation.relatedPathways,
    nextActions: [
      'Compare programmes connected to this environment.',
      'Shortlist one realistic pathway and one stretch pathway.',
      'Ask a counselor or mentor what the first 90 days look like in this field.',
    ],
  };
}

export function getSimulationProgrammes(simulation: CareerSimulation, programmeIds: string[]) {
  const relatedPathwaySet = new Set(simulation.relatedPathways);
  return programmeIds.filter(Boolean).filter(() => relatedPathwaySet.size > 0);
}

function getSimulationInsights(
  simulation: CareerSimulation,
  traits: SimulationDecisionTrait[],
  score: number,
) {
  const insights = [
    `You tested yourself inside a ${simulation.careerTitle} environment instead of only reading about it.`,
  ];

  if (traits.includes('hands-on')) {
    insights.push('You showed interest in practical, hands-on work.');
  }

  if (traits.includes('analytical')) {
    insights.push('You leaned toward investigation, logic, and problem-solving.');
  }

  if (traits.includes('service-oriented')) {
    insights.push('You responded strongly to helping people directly.');
  }

  if (traits.includes('communication')) {
    insights.push('Communication and explaining decisions showed up as a strength.');
  }

  if (score >= 80) {
    insights.push('This environment appears worth deeper exploration.');
  } else if (score >= 60) {
    insights.push('This environment may fit with the right support and expectations.');
  } else {
    insights.push('This may be more useful as a comparison point than a primary direction.');
  }

  return insights;
}
