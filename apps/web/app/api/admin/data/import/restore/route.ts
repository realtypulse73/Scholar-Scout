import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  restoreScholarScoutDataFromImport,
  SCHOLARSCOUT_RESTORE_CONFIRMATION,
  ScholarScoutDataRestoreError,
} from '@/lib/server/data-store';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let input: { snapshot?: unknown; confirmation?: unknown; reason?: unknown };

  try {
    input = (await request.json()) as {
      snapshot?: unknown;
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
    const result = await restoreScholarScoutDataFromImport({
      actorUserId: session.user.id,
      snapshot: input.snapshot,
      reason: typeof input.reason === 'string' ? input.reason : undefined,
    });

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
