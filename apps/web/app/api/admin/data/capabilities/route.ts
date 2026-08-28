import { NextResponse } from 'next/server';
import {
  DataRecoveryUnavailableError,
  readAdminDataCapabilities,
} from '@/lib/server/data-recovery';
import { requireActiveStaff } from '@/lib/server/active-staff';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'view-data-capabilities',
    route: '/api/admin/data/capabilities',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    return NextResponse.json(
      await readAdminDataCapabilities({ actorId: authorization.actor.id }),
    );
  } catch (error) {
    if (error instanceof DataRecoveryUnavailableError) {
      return NextResponse.json(
        {
          error: 'data-service-unavailable',
          ...error.failure,
        },
        { status: 503 },
      );
    }

    throw error;
  }
}
