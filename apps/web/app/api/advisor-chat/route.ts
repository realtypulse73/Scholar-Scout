import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ADVISOR_MAX_BODY_BYTES,
  ADVISOR_QUALIFIED_SUPPORT_HANDOFF,
  ADVISOR_SAFE_FALLBACK,
  isAcuteCrisisMessage,
  parseAdvisorReply,
  parseAdvisorRequest,
  selectAdvisorModel,
} from '@/lib/advisor-contract';
import { buildAdvisorContext } from '@/lib/server/advisor-context';
import {
  appendAnalyticsEvent,
} from '@/lib/server/platform-store';
import { getGuestQuotaBindingForAccount } from '@/lib/server/data-store';
import {
  reserveAdvisorAccount,
  reserveAdvisorGuest,
  type RateLimitReservation,
} from '@/lib/server/rate-limit';
import {
  resolveStudentActor,
  type StudentActor,
} from '@/lib/server/student-actor';

const ADVISOR_INSTRUCTIONS = [
  'You are the Scholar Scout advisor. Give practical, encouraging pathway guidance.',
  'Use only the supplied Scholar Scout context. Mark missing or stale facts as items to verify with an official source.',
  'Do not guarantee admission, aid, employment, salary, programme quality, or personal potential.',
  'Preserve student agency by describing trade-offs and options rather than choosing for the student.',
  'For clinical, disability, crisis, immigration, or complex financial guidance, recommend a qualified human advisor.',
].join(' ');

const ADVISOR_REPLY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

export async function POST(request: Request): Promise<NextResponse> {
  const requestBody = await readAdvisorRequest(request);

  if (!requestBody) {
    return NextResponse.json(
      { error: 'Send one valid advisor message.' },
      { status: 400 },
    );
  }

  if (isAcuteCrisisMessage(requestBody.message)) {
    return NextResponse.json({
      reply: ADVISOR_QUALIFIED_SUPPORT_HANDOFF,
      fallback: false,
      crisis: true,
    });
  }

  let actor: StudentActor | null;
  try {
    actor = await resolveStudentActor({ allowGuest: true });
  } catch {
    return unavailableResponse();
  }

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let reservation: RateLimitReservation;
  try {
    reservation = await reserveAdvisorQuota(actor);
  } catch {
    return unavailableResponse();
  }

  if (reservation.status === 'unavailable') {
    return unavailableResponse();
  }

  if (reservation.status === 'denied') {
    return NextResponse.json(
      {
        error: 'Your daily advisor limit has been reached.',
        resetAt: reservation.resetAt.toISOString(),
        retryAfterSeconds: reservation.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(reservation.retryAfterSeconds),
        },
      },
    );
  }

  const model = selectAdvisorModel(process.env.OPENAI_MODEL);
  const startedAt = Date.now();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    await recordAdvisorOutcome({
      actor,
      outcome: 'fallback',
      model,
      elapsedMilliseconds: Date.now() - startedAt,
      inputLength: requestBody.message.length,
      contextItemCount: 0,
      fallback: true,
      crisis: false,
      providerStatus: 'not_configured',
    });
    return fallbackResponse();
  }

  try {
    const context = await buildAdvisorContext({ storageKey: actor.storageKey });
    const providerResult = await createAdvisorReply({
      message: requestBody.message,
      contextSummary: context.summary,
      safetyIdentifier: createSafetyIdentifier(actor),
      model,
    });
    await recordAdvisorOutcome({
      actor,
      outcome: providerResult.fallback ? 'fallback' : 'success',
      model,
      elapsedMilliseconds: Date.now() - startedAt,
      inputLength: requestBody.message.length,
      contextItemCount: context.recommendations.length,
      fallback: providerResult.fallback,
      crisis: false,
      providerStatus: providerResult.providerStatus,
      providerRequestId: providerResult.providerRequestId,
      outputTokenCount: providerResult.outputTokenCount,
      schemaMismatch: providerResult.schemaMismatch,
    });

    return NextResponse.json({
      reply: providerResult.reply,
      fallback: providerResult.fallback,
      crisis: false,
    });
  } catch {
    await recordAdvisorOutcome({
      actor,
      outcome: 'fallback',
      model,
      elapsedMilliseconds: Date.now() - startedAt,
      inputLength: requestBody.message.length,
      contextItemCount: 0,
      fallback: true,
      crisis: false,
      providerStatus: 'context_error',
    });
    return fallbackResponse();
  }
}

async function readAdvisorRequest(request: Request) {
  const declaredLength = request.headers.get('content-length');
  const contentLength = declaredLength ? Number(declaredLength) : Number.NaN;

  if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > ADVISOR_MAX_BODY_BYTES) {
    return null;
  }

  try {
    const bytes = new Uint8Array(await request.arrayBuffer());

    if (bytes.byteLength !== contentLength || bytes.byteLength > ADVISOR_MAX_BODY_BYTES) {
      return null;
    }

    return parseAdvisorRequest(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

async function reserveAdvisorQuota(actor: StudentActor): Promise<RateLimitReservation> {
  if (actor.kind === 'guest') {
    return reserveAdvisorGuest(actor.guestId);
  }

  const guestWindowId = await getGuestQuotaBindingForAccount(actor.accountId);
  return reserveAdvisorAccount(actor.accountId, { guestWindowId: guestWindowId ?? undefined });
}

async function createAdvisorReply(input: {
  message: string;
  contextSummary: string;
  safetyIdentifier: string;
  model: string;
}): Promise<{
  reply: string;
  fallback: boolean;
  providerStatus: string;
  providerRequestId?: string;
  outputTokenCount?: number;
  schemaMismatch: boolean;
}> {
  let schemaMismatch = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          model: input.model,
          max_output_tokens: 1_000,
          safety_identifier: input.safetyIdentifier,
          instructions: ADVISOR_INSTRUCTIONS,
          input: `Server-selected context:\n${input.contextSummary}\n\nStudent question:\n${input.message}`,
          text: {
            format: {
              type: 'json_schema',
              name: 'advisor_reply',
              strict: true,
              schema: ADVISOR_REPLY_SCHEMA,
            },
          },
        }),
      });
    } catch {
      return providerFallback('network_error', schemaMismatch);
    }

    const providerRequestId = response.headers.get('x-request-id') ?? undefined;
    if (!response.ok) {
      return providerFallback(`http_${response.status}`, schemaMismatch, providerRequestId);
    }

    let providerData: unknown;
    try {
      providerData = await response.json();
    } catch {
      return providerFallback('invalid_json', schemaMismatch, providerRequestId);
    }

    const reply = parseProviderReply(providerData);
    if (reply) {
      return {
        reply: reply.message,
        fallback: false,
        providerStatus: 'ok',
        providerRequestId,
        outputTokenCount: getOutputTokenCount(providerData),
        schemaMismatch,
      };
    }

    schemaMismatch = true;
  }

  return providerFallback('schema_mismatch', true);
}

function parseProviderReply(value: unknown) {
  if (!value || typeof value !== 'object' || !('output_text' in value)) {
    return null;
  }

  const outputText = value.output_text;
  if (typeof outputText !== 'string') {
    return null;
  }

  try {
    return parseAdvisorReply(JSON.parse(outputText));
  } catch {
    return null;
  }
}

function getOutputTokenCount(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || !('usage' in value)) {
    return undefined;
  }

  const usage = value.usage;
  if (!usage || typeof usage !== 'object' || !('output_tokens' in usage)) {
    return undefined;
  }

  return typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined;
}

function providerFallback(
  providerStatus: string,
  schemaMismatch: boolean,
  providerRequestId?: string,
) {
  return {
    reply: ADVISOR_SAFE_FALLBACK,
    fallback: true,
    providerStatus,
    providerRequestId,
    schemaMismatch,
  };
}

function createSafetyIdentifier(actor: StudentActor): string {
  const key = process.env.NEXTAUTH_SECRET?.trim() || 'scholar-scout-advisor-safety-v1';
  return createHmac('sha256', key).update(actor.storageKey).digest('hex');
}

function fallbackResponse(): NextResponse {
  return NextResponse.json({
    reply: ADVISOR_SAFE_FALLBACK,
    fallback: true,
    crisis: false,
  });
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'The advisor is not available right now. Please try again shortly.' },
    { status: 503 },
  );
}

async function recordAdvisorOutcome(input: {
  actor: StudentActor;
  outcome: 'success' | 'fallback';
  model: string;
  elapsedMilliseconds: number;
  inputLength: number;
  contextItemCount: number;
  fallback: boolean;
  crisis: boolean;
  providerStatus: string;
  providerRequestId?: string;
  outputTokenCount?: number;
  schemaMismatch?: boolean;
}): Promise<void> {
  try {
    await appendAnalyticsEvent({
      area: 'advisor',
      name: 'advisor_request',
      userKey: input.actor.storageKey,
      metadata: {
        actorKind: input.actor.kind,
        outcome: input.outcome,
        model: input.model,
        elapsedMilliseconds: input.elapsedMilliseconds,
        inputLengthBucket: input.inputLength <= 500 ? '0-500' : '501-3000',
        contextItemCount: input.contextItemCount,
        fallback: input.fallback,
        crisis: input.crisis,
        providerStatus: input.providerStatus,
        providerRequestId: input.providerRequestId ?? 'none',
        outputTokenCount: input.outputTokenCount ?? 0,
        schemaMismatch: input.schemaMismatch ?? false,
      },
    });
  } catch {
    // Telemetry must never turn a validated response into a provider diagnostic.
  }
}
