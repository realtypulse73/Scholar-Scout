import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { getScholarScoutRestoreBackupPlan } from '@/lib/server/data-store';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const plan = await getScholarScoutRestoreBackupPlan(id);

  if (!plan) {
    return NextResponse.json({ error: 'Backup not found.' }, { status: 404 });
  }

  return NextResponse.json({ plan });
}
