import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { validateScholarScoutDataImport } from '@/lib/server/data-store';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let snapshot: unknown;

  try {
    snapshot = await request.json();
  } catch {
    return NextResponse.json(
      {
        isValid: false,
        errors: ['Snapshot must be valid JSON.'],
      },
      { status: 400 },
    );
  }

  const validation = validateScholarScoutDataImport(snapshot);

  return NextResponse.json(validation, {
    status: validation.isValid ? 200 : 400,
  });
}
