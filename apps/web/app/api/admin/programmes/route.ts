import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import {
  deleteProgrammeRecord,
  getProgrammeAuditEvents,
  getProgrammeRecords,
  ProgrammeRevisionConflictError,
  saveProgrammeRecord,
} from '@/lib/server/data-store';
import {
  prepareProgrammeDraft,
  validateProgrammeDraft,
} from '@/lib/admin-programmes';
import type { Programme } from '@/lib/programmes';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    records: await getProgrammeRecords(),
    auditEvents: await getProgrammeAuditEvents(),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const input = (await request.json()) as Programme;
  const errors = validateProgrammeDraft(input);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const programme = prepareProgrammeDraft(input);
  try {
    const record = await saveProgrammeRecord(session.user.id, programme);

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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing programme id' }, { status: 400 });
  }

  await deleteProgrammeRecord(session.user.id, id);

  return NextResponse.json({ ok: true });
}
