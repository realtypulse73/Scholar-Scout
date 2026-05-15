import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
  getMemory,
  getRecommendationsForUser,
} from '@/lib/server/platform-store';

const fallbackReply =
  'I can help you compare paths. Start by picking one programme to explore, then run the simulation to see whether the work style and support needs fit.';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userKey?: string;
      message?: string;
      question?: string;
      context?: {
        topProgramme?: string;
        fitScore?: number;
        clarityScore?: number;
        score?: number;
        dominantTraits?: string[];
        insights?: string[];
        nextActions?: string[];
        recommendedInterests?: string[];
        recommendedPathways?: string[];
        simulationReasons?: string[];
        cautions?: string[];
      };
    };
    const userKey = body.userKey ?? 'local-student';
    const message = (body.message ?? body.question)?.trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 },
      );
    }

    const memory = await getMemory(userKey);
    const recommendations = await getRecommendationsForUser(userKey);
    const platformContext = recommendations
      .slice(0, 3)
      .map(
        (recommendation) =>
          `${recommendation.programme.name}: ${recommendation.explanation.join(' ')}`,
      )
      .join('\n');
    const providedContext = [
      `Top programme: ${body.context?.topProgramme ?? 'Unknown'}`,
      `Fit score: ${body.context?.fitScore ?? 'Unknown'}`,
      `Simulation score: ${body.context?.score ?? 'Unknown'}`,
      `Clarity score: ${body.context?.clarityScore ?? 'Unknown'}`,
      `Dominant traits: ${(body.context?.dominantTraits ?? []).join(', ') || 'Unknown'}`,
      `Simulation insights: ${(body.context?.insights ?? []).join('; ') || 'Unknown'}`,
      `Recommended interests: ${(body.context?.recommendedInterests ?? []).join(', ') || 'Unknown'}`,
      `Recommended pathways: ${(body.context?.recommendedPathways ?? []).join(', ') || 'Unknown'}`,
      `Next actions: ${(body.context?.nextActions ?? []).join('; ') || 'Unknown'}`,
      `Simulation reasons: ${(body.context?.simulationReasons ?? []).join('; ')}`,
      `Cautions: ${(body.context?.cautions ?? []).join('; ')}`,
    ].join('\n');
    const reply = await createAdvisorReply({
      message,
      memorySummary: memory.summary,
      recommendationContext: `${providedContext}\n\n${platformContext}`,
    });

    await appendAnalyticsEvent({
      area: 'advisor',
      name: 'advisor_message',
      userKey,
      metadata: { stage: memory.stage },
    });

    return NextResponse.json({
      reply,
      fallback: !process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Advisor request failed.',
      },
      { status: 500 },
    );
  }
}

async function createAdvisorReply(input: {
  message: string;
  memorySummary: string;
  recommendationContext: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `${fallbackReply} Current memory: ${input.memorySummary}`;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      max_output_tokens: 220,
      instructions:
        [
          'You are the ScholarScout AI advisor.',
          'Give grounded, practical, encouraging guidance about pathways, career fit, risk, cost, support, and next steps.',
          'Use only the provided ScholarScout context. If the context is missing, say what to check next instead of inventing facts.',
          'Do not guarantee admission, scholarships, jobs, salary, or outcomes.',
          'Keep the response under 90 words and include one concrete next step.',
        ].join(' '),
      input: [
        `Student memory: ${input.memorySummary}`,
        `Current recommendation context:\n${input.recommendationContext}`,
        `Student question: ${input.message}`,
      ].join('\n\n'),
    }),
  });

  if (!response.ok) {
    return fallbackReply;
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ text?: string }>;
    }>;
  };

  return (
    trimAdvisorReply(
      data.output_text ??
    data.output?.flatMap((item) => item.content ?? []).find((item) => item.text)
      ?.text ??
    fallbackReply,
    )
  );
}

function trimAdvisorReply(reply: string) {
  const normalized = reply.trim().replace(/\s+/g, ' ');

  if (normalized.length <= 700) {
    return normalized;
  }

  return `${normalized.slice(0, 697).trim()}...`;
}
