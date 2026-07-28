import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  restoreScholarScoutDataFromBackup,
  SCHOLARSCOUT_RESTORE_CONFIRMATION,
  ScholarScoutDataRestoreError,
} from '@/lib/server/data-store';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authorization = await requireActiveStaff({
    action: 'restore-backup',
    route: `/api/admin/data/backups/${id}/restore`,
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  let input: { confirmation?: unknown; reason?: unknown };

  try {
    input = (await request.json()) as {
      confirmation?: unknown;
      reason?: unknown;
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Restore request must be valid JSON.' },
      { status: 400 },
    );
  }

  if (input.confirmation !== SCHOLARSCOUT_RESTORE_CONFIRMATION) {
    return NextResponse.json(
      {
        ok: false,
        error: `Type ${SCHOLARSCOUT_RESTORE_CONFIRMATION} to confirm this restore.`,
      },
      { status: 400 },
    );
  }

  try {
    const result = await restoreScholarScoutDataFromBackup({
      actorUserId: authorization.actor.id,
      backupId: id,
      reason: typeof input.reason === 'string' ? input.reason : undefined,
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: 'Backup not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ScholarScoutDataRestoreError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          validation: error.validation,
        },
        { status: 400 },
      );
    }

    throw error;
  }
}
