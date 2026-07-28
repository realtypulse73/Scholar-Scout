import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { getScholarScoutRestoreBackups } from '@/lib/server/data-store';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'list-data-backups',
    route: '/api/admin/data/backups',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  return NextResponse.json({ backups: await getScholarScoutRestoreBackups() });
}
