import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import {
  readScholarScoutData,
} from '@/lib/server/data-store';
import {
  applyRecoveryPlan,
  createSignedRecoveryEnvelope,
  RECOVERY_CONFIRMATION_PHRASE,
} from '@/lib/server/data-recovery';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = await requireActiveStaff({
    action: 'restore-backup',
    route: '/api/admin/data/backups/[id]/restore',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJsonRequest(request, {
    maxBytes: 16 * 1024,
    validate(value) {
      if (
        !isExactObject(value, ['planToken', 'reason', 'confirmation']) ||
        !('planToken' in value) ||
        typeof value.reason !== 'string' ||
        typeof value.confirmation !== 'string'
      ) {
        return null;
      }

      return {
        planToken: value.planToken,
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

  const input = parsed.value;
  if (input.confirmation !== RECOVERY_CONFIRMATION_PHRASE) {
    return NextResponse.json(
      { ok: false, error: 'invalid-recovery-confirmation' },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const currentData = await readScholarScoutData();
    const backup = (currentData.restoreBackups ?? []).find((item) => item.id === id);
    if (!backup) {
      return NextResponse.json({ ok: false, error: 'backup-not-found' }, { status: 404 });
    }
    const envelope = createSignedRecoveryEnvelope({
      data: backup.data,
      sourceId: backup.id,
    });
    const result = await applyRecoveryPlan({
      actorId: authorization.actor.id,
      envelope,
      token: input.planToken,
      reason: input.reason,
      confirmation: input.confirmation,
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
    if (
      category.startsWith('invalid-') ||
      category.startsWith('recovery-plan-mismatch') ||
      category.startsWith('unknown-recovery-key')
    ) {
      return NextResponse.json({ ok: false, error: category }, { status: 400 });
    }
    if (category === 'recovery-envelope-too-large') {
      return NextResponse.json({ ok: false, error: category }, { status: 413 });
    }

    return NextResponse.json(
      { ok: false, error: 'data-service-unavailable', retryable: true },
      { status: 503 },
    );
  }
}
