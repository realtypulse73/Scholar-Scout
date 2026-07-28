import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { getScholarScoutDataStoreStatus } from '@/lib/server/data-store';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'view-data-status',
    route: '/api/admin/data/status',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  return NextResponse.json(await getScholarScoutDataStoreStatus());
}
