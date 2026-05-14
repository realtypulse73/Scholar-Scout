import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      context?: {
        topProgramme?: string;
        fitScore?: number;
        clarityScore?: number;
        simulationReasons?: string[];
        cautions?: string[];
      };
    };

    if (!body.question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 },
      );
    }

    if (!client) {
      return NextResponse.json({
        reply:
          'The live AI advisor is not configured yet. Add OPENAI_API_KEY to enable real-time coaching responses.',
        fallback: true,
      });
    }

    const response = await client.responses.create({
      model: 'gpt-5.2',
      input: [
        {
          role: 'system',
          content:
            'You are the ScholarScout AI advisor. Give grounded, practical, encouraging guidance about pathways, career fit, risk, cost, support, and next steps. Avoid overpromising outcomes. Keep responses concise but useful.',
        },
        {
          role: 'user',
          content: `Student question: ${body.question}\n\nCurrent recommendation context:\nTop programme: ${body.context?.topProgramme ?? 'Unknown'}\nFit score: ${body.context?.fitScore ?? 'Unknown'}\nClarity score: ${body.context?.clarityScore ?? 'Unknown'}\nSimulation reasons: ${(body.context?.simulationReasons ?? []).join('; ')}\nCautions: ${(body.context?.cautions ?? []).join('; ')}`,
        },
      ],
    });

    return NextResponse.json({
      reply: response.output_text,
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
