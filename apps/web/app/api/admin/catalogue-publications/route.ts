import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import {
  CataloguePublicationConflictError,
  stageCatalogueCandidate,
} from '@/lib/server/catalogue-publications';

const ROUTE = '/api/admin/catalogue-publications';

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'catalogue-publication:stage',
    route: ROUTE,
    capability: 'editor',
  });

  if (!authorization.ok) return authorization.response;

  let body: { action?: unknown; candidate?: unknown };
  try {
    body = await request.json() as { action?: unknown; candidate?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid catalogue publication request.' }, { status: 400 });
  }

  if (body.action !== 'stage') {
    return NextResponse.json({ error: 'Unsupported catalogue publication action.' }, { status: 400 });
  }

  try {
    const result = await stageCatalogueCandidate({
      actor: authorization.actor,
      candidate: body.candidate,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CataloguePublicationConflictError) {
      return NextResponse.json(
        { error: 'This catalogue draft changed before it could be staged. Reload and try again.' },
        { status: 409 },
      );
    }
    throw error;
  }
}
