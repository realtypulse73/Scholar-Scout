import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { isExactObject, parseJsonRequest } from '@/lib/api-request';
import { releaseRecoveryIncidentHold } from '@/lib/server/data-recovery';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface HoldReleaseInput {
  incidentId: string;
  reason: string;
}

export async function POST(request: Request, context: RouteContext) {
  const authorization = await requireActiveStaff({
    action: 'release-incident-hold',
    route: '/api/admin/data/backups/[id]/hold/release',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJsonRequest<HoldReleaseInput>(request, {
    maxBytes: 2 * 1024,
    validate(value) {
      if (
        !isExactObject(value, ['incidentId', 'reason']) ||
        typeof value.incidentId !== 'string' ||
        typeof value.reason !== 'string'
      ) {
        return null;
      }
      const incidentId = value.incidentId.trim();
      const reason = value.reason.trim();
      if (!incidentId || incidentId.length > 128 || !reason || reason.length > 500) {
        return null;
      }
      return { incidentId, reason };
    },
  });

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.error === 'body-too-large' ? 413 : 400 },
    );
  }

  const { id } = await context.params;
  try {
    const result = await releaseRecoveryIncidentHold({
      actorId: authorization.actor.id,
      authorized: true,
      backupId: id,
      incidentId: parsed.value.incidentId,
      reason: parsed.value.reason,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const category = error instanceof Error ? error.message : 'release-failed';
    console.warn('ScholarScout incident hold release failed', {
      actorId: authorization.actor.id,
      action: 'release-incident-hold',
      category,
      incidentId: parsed.value.incidentId,
      timestamp: new Date().toISOString(),
      outcome: 'failed-no-write',
    });
    if (category === 'recovery-backup-not-found') {
      return NextResponse.json({ ok: false, error: category }, { status: 404 });
    }
    if (
      category === 'recovery-incident-hold-mismatch' ||
      category === 'recovery-incident-hold-changed'
    ) {
      return NextResponse.json({ ok: false, error: category }, { status: 409 });
    }
    if (category.startsWith('invalid-')) {
      return NextResponse.json({ ok: false, error: category }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: 'data-service-unavailable', retryable: true },
      { status: 503 },
    );
  }
}
