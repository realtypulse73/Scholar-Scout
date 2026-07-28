import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  getRecommendationsForUser,
  readPlatformData,
  saveSimulationResult,
} from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { simulations, type SimulationAnswer } from '@/lib/platform';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_SIMULATION_REQUEST_BYTES = 8 * 1024;

interface SimulationResultRequest {
  simulationId: string;
  answers: SimulationAnswer[];
}

export async function GET() {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await readPlatformData();

  return NextResponse.json({
    results: (data.simulationResults ?? []).filter(
      (result) => result.userKey === actor.storageKey,
    ),
  });
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_SIMULATION_REQUEST_BYTES,
    validate: validateSimulationResultRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid simulation result fields.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const result = await saveSimulationResult({
    userKey: actor.storageKey,
    simulationId: body.value.simulationId,
    answers: body.value.answers,
  });
  const recommendations = await getRecommendationsForUser(actor.storageKey);

  await appendAnalyticsEvent({
    area: 'simulation',
    name: 'simulation_completed',
    userKey: actor.storageKey,
    metadata: {
      simulationId: body.value.simulationId,
      clarityScore: result.clarityScore,
    },
  });

  return NextResponse.json({ result, recommendations });
}

function validateSimulationResultRequest(
  value: unknown,
): SimulationResultRequest | null {
  if (!isExactObject(value, ['simulationId', 'answers'])) {
    return null;
  }

  const simulationId = value.simulationId;
  const answers = value.answers;

  if (
    typeof simulationId !== 'string' ||
    simulationId.length === 0 ||
    simulationId.length > 64 ||
    !Array.isArray(answers)
  ) {
    return null;
  }

  const simulation = simulations.find((item) => item.id === simulationId);

  if (!simulation || answers.length === 0 || answers.length > simulation.scenarios.length) {
    return null;
  }

  const seenScenarioIds = new Set<string>();
  const normalizedAnswers: SimulationAnswer[] = [];

  for (const answer of answers) {
    if (!isExactObject(answer, ['scenarioId', 'choiceId'])) {
      return null;
    }

    const scenarioId = answer.scenarioId;
    const choiceId = answer.choiceId;

    if (
      typeof scenarioId !== 'string' ||
      typeof choiceId !== 'string' ||
      scenarioId.length === 0 ||
      scenarioId.length > 64 ||
      choiceId.length === 0 ||
      choiceId.length > 64 ||
      seenScenarioIds.has(scenarioId)
    ) {
      return null;
    }

    const scenario = simulation.scenarios.find((item) => item.id === scenarioId);

    if (!scenario || !scenario.choices.some((choice) => choice.id === choiceId)) {
      return null;
    }

    seenScenarioIds.add(scenarioId);
    normalizedAnswers.push({ scenarioId, choiceId });
  }

  return { simulationId, answers: normalizedAnswers };
}
