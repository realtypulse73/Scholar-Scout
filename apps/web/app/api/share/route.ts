import { NextResponse } from 'next/server';
import { appendAnalyticsEvent, trackShare } from '@/lib/server/platform-store';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { resolveStudentActor } from '@/lib/server/student-actor';
import type { ShareRecord } from '@/lib/server/platform-store';

const MAX_SHARE_REQUEST_BYTES = 2 * 1024;
const MAX_SHARE_TARGET_ID_LENGTH = 64;
const MAX_LEGACY_IDENTITY_LENGTH = 128;
const SHARE_TARGET_TYPES = new Set<ShareRecord['targetType']>([
  'programme',
  'creator',
  'feed',
]);
const SHARE_TARGET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ShareRequest {
  targetType: ShareRecord['targetType'];
  targetId: string;
}

export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: true });

  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await parseJsonRequest(request, {
    maxBytes: MAX_SHARE_REQUEST_BYTES,
    validate: validateShareRequest,
  });

  if (!body.ok) {
    return NextResponse.json(
      { error: 'Invalid share target.' },
      { status: body.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const share = await trackShare({
    userKey: actor.storageKey,
    targetType: body.value.targetType,
    targetId: body.value.targetId,
  });

  await appendAnalyticsEvent({
    area: 'share',
    name: 'share_created',
    userKey: share.userKey,
    metadata: {
      targetType: share.targetType,
      targetId: share.targetId,
    },
  });

  return NextResponse.json(share);
}

function validateShareRequest(value: unknown): ShareRequest | null {
  if (!isExactObject(value, ['userKey', 'targetType', 'targetId'])) {
    return null;
  }

  const legacyUserKey = value.userKey;
  const targetType = value.targetType;
  const targetId = value.targetId;

  if (
    (legacyUserKey !== undefined &&
      (typeof legacyUserKey !== 'string' || legacyUserKey.length > MAX_LEGACY_IDENTITY_LENGTH)) ||
    typeof targetType !== 'string' ||
    !SHARE_TARGET_TYPES.has(targetType as ShareRecord['targetType']) ||
    typeof targetId !== 'string' ||
    targetId.length === 0 ||
    targetId.length > MAX_SHARE_TARGET_ID_LENGTH ||
    !SHARE_TARGET_ID_PATTERN.test(targetId)
  ) {
    return null;
  }

  return {
    targetType: targetType as ShareRecord['targetType'],
    targetId,
  };
}
