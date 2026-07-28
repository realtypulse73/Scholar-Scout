import { NextResponse } from 'next/server';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import {
  getShortlist,
  getShortlistPlans,
  saveShortlist,
  saveShortlistPlans,
} from '@/lib/server/data-store';
import { resolveStudentActor } from '@/lib/server/student-actor';
import type {
  ShortlistPlanMap,
  ShortlistPlanStatus,
} from '@/lib/shortlist';

const MAX_SHORTLIST_REQUEST_BYTES = 16 * 1024;
const MAX_SHORTLIST_IDS = 100;
const MAX_PROGRAMME_ID_LENGTH = 128;
const MAX_PLAN_NOTE_LENGTH = 500;
const PLAN_STATUSES = new Set<ShortlistPlanStatus>([
  'considering',
  'contacted',
  'visit-planned',
  'ready-to-apply',
]);
const UNSAFE_PROGRAMME_IDS = new Set(['__proto__', 'constructor', 'prototype']);

interface ShortlistRequest {
  programmeIds: string[];
  plans: ShortlistPlanMap;
}

export async function GET() {
  const actor = await resolveActor();

  if (actor instanceof NextResponse) {
    return actor;
  }

  return NextResponse.json({
    programmeIds: await getShortlist(actor.storageKey),
    plans: await getShortlistPlans(actor.storageKey),
  });
}

export async function POST(request: Request) {
  const actor = await resolveActor();

  if (actor instanceof NextResponse) {
    return actor;
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_SHORTLIST_REQUEST_BYTES,
    validate: validateShortlistRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid shortlist fields.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  await saveShortlist(actor.storageKey, body.value.programmeIds);
  await saveShortlistPlans(actor.storageKey, body.value.plans);

  return NextResponse.json({ ok: true });
}

async function resolveActor() {
  try {
    const actor = await resolveStudentActor({ allowGuest: true });

    return actor ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: 'Student identity is not available right now.' },
      { status: 503 },
    );
  }
}

function validateShortlistRequest(value: unknown): ShortlistRequest | null {
  if (!isExactObject(value, ['programmeIds', 'plans'])) {
    return null;
  }

  const programmeIds = value.programmeIds;

  if (!Array.isArray(programmeIds) || programmeIds.length > MAX_SHORTLIST_IDS) {
    return null;
  }

  if (!programmeIds.every(isValidProgrammeId) || new Set(programmeIds).size !== programmeIds.length) {
    return null;
  }

  const plans = value.plans === undefined ? {} : validatePlans(value.plans, programmeIds);

  return plans === null ? null : { programmeIds, plans };
}

function validatePlans(value: unknown, programmeIds: string[]): ShortlistPlanMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const plans: ShortlistPlanMap = {};
  const shortlistIds = new Set(programmeIds);
  const entries = Object.entries(value);

  if (entries.length > programmeIds.length) {
    return null;
  }

  for (const [programmeId, plan] of entries) {
    if (!shortlistIds.has(programmeId) || !isExactObject(plan, ['status', 'note'])) {
      return null;
    }

    const status = plan.status;
    const note = plan.note;

    if (
      typeof status !== 'string' ||
      !PLAN_STATUSES.has(status as ShortlistPlanStatus) ||
      typeof note !== 'string' ||
      note.length > MAX_PLAN_NOTE_LENGTH
    ) {
      return null;
    }

    plans[programmeId] = {
      status: status as ShortlistPlanStatus,
      note,
    };
  }

  return plans;
}

function isValidProgrammeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_PROGRAMME_ID_LENGTH &&
    !UNSAFE_PROGRAMME_IDS.has(value)
  );
}
