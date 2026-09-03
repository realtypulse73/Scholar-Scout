import { NextResponse } from 'next/server';
import {
  getProgrammeAuditEvents,
  getProgrammeRecords,
} from '@/lib/server/data-store';
import {
  deleteProgrammeRecord,
  ProgrammeRevisionConflictError,
  saveProgrammeRecord,
} from '@/lib/server/programme-records';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  prepareProgrammeDraft,
  validateProgrammeDraft,
} from '@/lib/admin-programmes';
import type { Programme } from '@/lib/programmes';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'programme:read',
    route: '/api/admin/programmes',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  return NextResponse.json({
    records: await getProgrammeRecords(),
    auditEvents: await getProgrammeAuditEvents(),
  });
}

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'programme:write',
    route: '/api/admin/programmes',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const input = (await request.json()) as Programme;
  const errors = validateProgrammeDraft(input);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const programme = prepareProgrammeDraft(input);
  try {
    const record = await saveProgrammeRecord(authorization.actor.id, programme);

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    if (error instanceof ProgrammeRevisionConflictError) {
      return NextResponse.json(
        {
          error:
            'This programme changed after you loaded it. Compare the latest record before saving again.',
          currentRevision: error.currentRevision,
          currentRecord: error.currentRecord,
        },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'programme:delete',
    route: '/api/admin/programmes',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing programme id' }, { status: 400 });
  }

  try {
    await deleteProgrammeRecord(authorization.actor.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProgrammeRevisionConflictError) {
      return NextResponse.json(
        { error: 'This programme changed before it could be deleted.' },
        { status: 409 },
      );
    }
    throw error;
  }
}
