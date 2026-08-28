import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { readScholarScoutData } from '@/lib/server/data-store';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'list-data-backups',
    route: '/api/admin/data/backups',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const data = await readScholarScoutData();
    const backups = [...(data.restoreBackups ?? [])]
      .sort((left, right) => {
        const timeOrder = Date.parse(right.createdAt) - Date.parse(left.createdAt);
        return timeOrder || right.id.localeCompare(left.id);
      })
      .map(({ data: _snapshot, ...backup }) => backup);

    return NextResponse.json({ backups, empty: backups.length === 0 });
  } catch {
    return NextResponse.json(
      {
        error: 'data-service-unavailable',
        category: 'storage-unavailable',
        incidentId: randomUUID(),
        retryable: true,
      },
      { status: 503 },
    );
  }
}
