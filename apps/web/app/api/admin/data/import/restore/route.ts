import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import {
  applyRecoveryPlan,
  RECOVERY_CONFIRMATION_PHRASE,
  RECOVERY_ENVELOPE_MAX_BYTES,
} from '@/lib/server/data-recovery';

const IMPORT_APPLY_MAX_BYTES = Math.ceil(RECOVERY_ENVELOPE_MAX_BYTES * 4 / 3) + 64 * 1024;

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'restore-data-import',
    route: '/api/admin/data/import/restore',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJsonRequest(request, {
    maxBytes: IMPORT_APPLY_MAX_BYTES,
    validate(value) {
      if (
        !isExactObject(value, ['planToken', 'reason', 'confirmation']) ||
        !isExactObject(value.planToken, ['recoveryToken', 'encodedEnvelope']) ||
        !('recoveryToken' in value.planToken) ||
        typeof value.planToken.encodedEnvelope !== 'string' ||
        typeof value.reason !== 'string' ||
        typeof value.confirmation !== 'string'
      ) {
        return null;
      }
      return {
        recoveryToken: value.planToken.recoveryToken,
        encodedEnvelope: value.planToken.encodedEnvelope,
        reason: value.reason,
        confirmation: value.confirmation,
      };
    },
  });

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.error === 'body-too-large' ? 413 : 400 },
    );
  }

  if (parsed.value.confirmation !== RECOVERY_CONFIRMATION_PHRASE) {
    return NextResponse.json(
      { ok: false, error: 'invalid-recovery-confirmation' },
      { status: 400 },
    );
  }

  try {
    const envelopeBytes = Buffer.from(parsed.value.encodedEnvelope, 'base64url');
    if (envelopeBytes.byteLength > RECOVERY_ENVELOPE_MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'recovery-envelope-too-large' }, { status: 413 });
    }
    const envelope = JSON.parse(envelopeBytes.toString('utf8')) as unknown;
    const result = await applyRecoveryPlan({
      actorId: authorization.actor.id,
      envelope,
      token: parsed.value.recoveryToken,
      reason: parsed.value.reason,
      confirmation: parsed.value.confirmation,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const category = error instanceof Error ? error.message : 'recovery-failed';
    if (category === 'recovery-state-changed') {
      return NextResponse.json({ ok: false, error: category }, { status: 409 });
    }
    if (category === 'recovery-plan-expired' || category === 'recovery-plan-replayed') {
      return NextResponse.json({ ok: false, error: category }, { status: 410 });
    }
    if (category === 'recovery-envelope-too-large') {
      return NextResponse.json({ ok: false, error: category }, { status: 413 });
    }
    if (
      category === 'Unexpected end of JSON input' ||
      category.startsWith('invalid-') ||
      category.startsWith('recovery-plan-mismatch') ||
      category.startsWith('unknown-recovery-key')
    ) {
      return NextResponse.json({ ok: false, error: 'invalid-recovery-plan' }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: 'data-service-unavailable', retryable: true },
      { status: 503 },
    );
  }
}
