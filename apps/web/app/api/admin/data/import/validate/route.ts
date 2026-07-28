import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { validateScholarScoutDataImport } from '@/lib/server/data-store';

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'validate-data-import',
    route: '/api/admin/data/import/validate',
  });

  if (!authorization.ok) {
    return authorization.response;
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
