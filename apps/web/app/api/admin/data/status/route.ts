import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  DataRecoveryUnavailableError,
  readAdminDataCapabilities,
} from '@/lib/server/data-recovery';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'view-data-status',
    route: '/api/admin/data/status',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const capabilities = await readAdminDataCapabilities({
      actorId: authorization.actor.id,
    });

    return NextResponse.json({
      health: capabilities.health,
      adapter: capabilities.adapter,
      checkedAt: capabilities.lastVerifiedAt,
      counts: capabilities.counts,
    });
  } catch (error) {
    if (error instanceof DataRecoveryUnavailableError) {
      return NextResponse.json(
        { error: 'data-service-unavailable', ...error.failure },
        { status: 503 },
      );
    }

    throw error;
  }
}
