import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  CatalogueCandidateImportError,
  CatalogueCandidateOwnershipError,
  CatalogueCandidateRevisionConflictError,
  CataloguePublicationConflictError,
  importCatalogueCandidates,
} from '@/lib/server/catalogue-publications';

const ROUTE = '/api/admin/catalogue-publications/import';

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'catalogue-publication:import',
    route: ROUTE,
    capability: 'editor',
  });
  if (!authorization.ok) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue import request.' }, { status: 400 });
  }

  try {
    const result = await importCatalogueCandidates({
      actor: authorization.actor,
      envelope: body,
    });
    if (result.status === 'stale') {
      return NextResponse.json(
        {
          error: 'This catalogue candidate changed. Compare values before resolving.',
          conflict: result.conflict,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CatalogueCandidateImportError) {
      return NextResponse.json(
        { error: 'Catalogue import needs correction.', correctionCodes: ['invalid-import'] },
        { status: 400 },
      );
    }
    if (error instanceof CatalogueCandidateRevisionConflictError
      || error instanceof CataloguePublicationConflictError) {
      return NextResponse.json(
        { error: 'This catalogue candidate changed. Reload and try again.' },
        { status: 409 },
      );
    }
    if (error instanceof CatalogueCandidateOwnershipError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    throw error;
  }
}
