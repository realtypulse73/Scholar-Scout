import { NextResponse } from 'next/server';
import { getScholarScoutDataStoreStatus } from '@/lib/server/data-store';

export async function GET(request: Request) {
  const token = process.env.SCHOLARSCOUT_HEALTH_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'SCHOLARSCOUT_HEALTH_TOKEN is not configured.' },
      { status: 503 },
    );
  }

  if (request.headers.get('Authorization') !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = await getScholarScoutDataStoreStatus();

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ...status,
  });
}
