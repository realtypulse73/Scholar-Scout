import { NextResponse } from 'next/server';
import {
  appendAnalyticsEvent,
} from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import type { AnalyticsArea } from '@/lib/platform';
import { resolveStudentActor } from '@/lib/server/student-actor';

const MAX_ANALYTICS_REQUEST_BYTES = 8 * 1024;
const MAX_ANALYTICS_EVENT_NAME_LENGTH = 64;
const MAX_ANALYTICS_METADATA_ENTRIES = 16;
const MAX_ANALYTICS_METADATA_KEY_LENGTH = 64;
const MAX_ANALYTICS_METADATA_STRING_LENGTH = 256;
const MAX_ANALYTICS_METADATA_NUMBER = 1_000_000_000;
const ANALYTICS_AREAS = new Set<AnalyticsArea>([
  'feed',
  'simulation',
  'recommendation',
  'advisor',
  'creator',
  'referral',
  'share',
  'notification',
  'admin',
]);

interface AnalyticsEventRequest {
  area: AnalyticsArea;
  name: string;
  metadata: Record<string, string | number | boolean>;
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_ANALYTICS_REQUEST_BYTES,
    validate: validateAnalyticsEventRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid analytics event fields.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const event = await appendAnalyticsEvent({
    area: body.value.area,
    name: body.value.name,
    userKey: actor.storageKey,
    metadata: body.value.metadata,
  });

  return NextResponse.json({ event });
}

function validateAnalyticsEventRequest(value: unknown): AnalyticsEventRequest | null {
  if (!isExactObject(value, ['area', 'name', 'metadata'])) {
    return null;
  }

  const area = value.area;
  const name = value.name;

  if (
    typeof area !== 'string' ||
    !ANALYTICS_AREAS.has(area as AnalyticsArea) ||
    typeof name !== 'string' ||
    name.length === 0 ||
    name.length > MAX_ANALYTICS_EVENT_NAME_LENGTH
  ) {
    return null;
  }

  const metadata = validateAnalyticsMetadata(value.metadata);

  return metadata === null
    ? null
    : { area: area as AnalyticsArea, name, metadata };
}

function validateAnalyticsMetadata(
  value: unknown,
): Record<string, string | number | boolean> | null {
  if (value === undefined) {
    return {};
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_ANALYTICS_METADATA_ENTRIES) {
    return null;
  }

  for (const [key, item] of entries) {
    if (
      key.length === 0 ||
      key.length > MAX_ANALYTICS_METADATA_KEY_LENGTH ||
      (typeof item === 'string' && item.length > MAX_ANALYTICS_METADATA_STRING_LENGTH) ||
      (typeof item === 'number' &&
        (!Number.isFinite(item) || Math.abs(item) > MAX_ANALYTICS_METADATA_NUMBER)) ||
      (typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean')
    ) {
      return null;
    }
  }

  return value as Record<string, string | number | boolean>;
}
