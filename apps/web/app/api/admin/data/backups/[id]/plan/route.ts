import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { getScholarScoutRestoreBackupPlan } from '@/lib/server/data-store';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const authorization = await requireActiveStaff({
    action: 'plan-backup-restore',
    route: `/api/admin/data/backups/${id}/plan`,
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const plan = await getScholarScoutRestoreBackupPlan(id);

  if (!plan) {
    return NextResponse.json({ error: 'Backup not found.' }, { status: 404 });
  }

  return NextResponse.json({ plan });
}
