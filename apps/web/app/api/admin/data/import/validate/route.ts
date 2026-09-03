import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';
import { parseJsonRequest } from '@/lib/api-request';
import { readScholarScoutData } from '@/lib/server/data-store';
import {
  issueRecoveryPlan,
  RECOVERY_ENVELOPE_MAX_BYTES,
} from '@/lib/server/data-recovery';

export async function POST(request: Request) {
  const authorization = await requireActiveStaff({
    action: 'validate-data-import',
    route: '/api/admin/data/import/validate',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsed = await parseJsonRequest(request, {
    maxBytes: RECOVERY_ENVELOPE_MAX_BYTES,
    validate: (value) => value,
  });

  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error === 'body-too-large' ? 'recovery-envelope-too-large' : 'invalid-recovery-envelope' },
      { status: parsed.error === 'body-too-large' ? 413 : 400 },
    );
  }

  try {
    const currentData = await readScholarScoutData();
    const { preview, token } = issueRecoveryPlan({
      actorId: authorization.actor.id,
      envelope: parsed.value,
      currentData,
    });
    const encodedEnvelope = Buffer.from(JSON.stringify(parsed.value), 'utf8').toString('base64url');

    return NextResponse.json({
      plan: preview,
      planToken: { recoveryToken: token, encodedEnvelope },
    });
  } catch (error) {
    const category = error instanceof Error ? error.message : 'recovery-failed';
    if (category === 'recovery-envelope-too-large') {
      return NextResponse.json({ error: category }, { status: 413 });
    }
    if (
      category.startsWith('invalid-') ||
      category.startsWith('expired-') ||
      category.startsWith('unknown-recovery-key')
    ) {
      return NextResponse.json({ error: 'invalid-recovery-envelope' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'data-service-unavailable', retryable: true },
      { status: 503 },
    );
  }
}
