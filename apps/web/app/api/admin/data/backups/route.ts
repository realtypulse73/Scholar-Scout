import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { getScholarScoutRestoreBackups } from '@/lib/server/data-store';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ backups: await getScholarScoutRestoreBackups() });
}
