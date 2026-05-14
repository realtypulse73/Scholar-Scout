import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  getRecommendationsForUser,
  readPlatformData,
  saveSimulationResult,
} from '@/lib/server/platform-store';
import type { SimulationAnswer } from '@/lib/platform';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = searchParams.get('userKey') ?? 'local-student';
  const data = await readPlatformData();

  return NextResponse.json({
    results: (data.simulationResults ?? []).filter(
      (result) => result.userKey === userKey,
    ),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userKey?: string;
    simulationId?: string;
    answers?: SimulationAnswer[];
  };

  if (!body.userKey || !body.simulationId || !Array.isArray(body.answers)) {
    return NextResponse.json(
      { error: 'Missing simulation result fields.' },
      { status: 400 },
    );
  }

  const result = await saveSimulationResult({
    userKey: body.userKey,
    simulationId: body.simulationId,
    answers: body.answers,
  });
  const recommendations = await getRecommendationsForUser(body.userKey);

  await appendAnalyticsEvent({
    area: 'simulation',
    name: 'simulation_completed',
    userKey: body.userKey,
    metadata: {
      simulationId: body.simulationId,
      clarityScore: result.clarityScore,
    },
  });

  return NextResponse.json({ result, recommendations });
}
