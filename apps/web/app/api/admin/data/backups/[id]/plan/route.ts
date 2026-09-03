import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { readScholarScoutData } from '@/lib/server/data-store';
import {
  createSignedRecoveryEnvelope,
  issueRecoveryPlan,
} from '@/lib/server/data-recovery';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const authorization = await requireActiveStaff({
    action: 'plan-backup-restore',
    route: '/api/admin/data/backups/[id]/plan',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await context.params;

  try {
    const currentData = await readScholarScoutData();
    const backup = (currentData.restoreBackups ?? []).find((item) => item.id === id);

    if (!backup) {
      return NextResponse.json({ error: 'backup-not-found' }, { status: 404 });
    }

    const envelope = createSignedRecoveryEnvelope({
      data: backup.data,
      sourceId: backup.id,
    });
    const { preview, token } = issueRecoveryPlan({
      actorId: authorization.actor.id,
      envelope,
      currentData,
    });

    return NextResponse.json({ plan: preview, planToken: token });
  } catch {
    return NextResponse.json(
      {
        error: 'data-service-unavailable',
        category: 'storage-unavailable',
        incidentId: randomUUID(),
        retryable: true,
      },
      { status: 503 },
    );
  }
}
