import { NextResponse } from 'next/server';
import { assignVariant } from '@/lib/platform';
import { appendAnalyticsEvent } from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_ASSIGNMENT_REQUEST_BYTES = 1024;
const SUPPORTED_EXPERIMENT_IDS = new Set(['feed-layout']);

interface AssignmentRequest {
  experimentId: string;
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_ASSIGNMENT_REQUEST_BYTES,
    validate: validateAssignmentRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid experiment assignment.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const assignment = assignVariant(actor.storageKey, body.value.experimentId);

  await appendAnalyticsEvent({
    area: 'admin',
    name: 'ab_variant_assigned',
    userKey: actor.storageKey,
    metadata: {
      experimentId: assignment.experimentId,
      variant: assignment.variant,
    },
  });

  return NextResponse.json({ assignment });
}

function validateAssignmentRequest(value: unknown): AssignmentRequest | null {
  if (!isExactObject(value, ['experimentId'])) {
    return null;
  }

  const experimentId = value.experimentId;

  return typeof experimentId === 'string' && SUPPORTED_EXPERIMENT_IDS.has(experimentId)
    ? { experimentId }
    : null;
}
