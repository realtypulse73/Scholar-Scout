import { NextResponse } from 'next/server';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { parseJsonRequest } from '@/lib/api-request';
import {
  authorizeContributorMediaDirectUpload,
  issueContributorMediaUpload,
  recordContributorMediaObject,
} from '@/lib/server/contributor-media';
import { resolveStudentActor, type AccountStudentActor } from '@/lib/server/student-actor';

const MAX_UPLOAD_REQUEST_BYTES = 4 * 1024;

export async function POST(request: Request) {
  const actor = await resolveAccountActor();
  if (actor instanceof NextResponse) return actor;
  const body = await parseJsonRequest(request, { maxBytes: MAX_UPLOAD_REQUEST_BYTES, validate: (value) => value });
  if (!body.ok) return NextResponse.json({ error: 'Choose one supported video and poster.' }, { status: body.error === 'body-too-large' ? 413 : 400 });
  if (isBlobUploadBody(body.value)) return handleDirectUpload(request, actor, body.value);
  const result = await issueContributorMediaUpload({ actor, request: body.value });
  if (result.status === 'conflict' || result.value.status === 'conflict') return conflict();
  if (result.value.status === 'forbidden') return NextResponse.json({ error: 'Contributor invitation required.' }, { status: 403 });
  if (result.value.status === 'invalid-programme') return NextResponse.json({ error: 'Choose a current programme before uploading.' }, { status: 400 });
  if (result.value.status !== 'issued') return conflict();
  return NextResponse.json({ capability: result.value.capability });
}

async function handleDirectUpload(
  request: Request,
  actor: AccountStudentActor,
  body: HandleUploadPresignedBody,
) {
  const storeId = process.env.SCHOLARSCOUT_PRIVATE_MEDIA_STORE_ID;
  const webhookPublicKey = process.env.SCHOLARSCOUT_PRIVATE_MEDIA_WEBHOOK_PUBLIC_KEY;
  if (!storeId || !webhookPublicKey) return NextResponse.json({ error: 'Private upload is not available right now.' }, { status: 503 });
  try {
    const response = await handleUploadPresigned({
      request,
      body,
      webhookPublicKey,
      getSignedToken: async (pathname, clientPayload) => {
        const payload = parseUploadPayload(clientPayload);
        if (!payload) {
          throw new Error('Invalid private upload capability.');
        }
        const authorization = await authorizeContributorMediaDirectUpload({ ...payload, actor });
        if (authorization.status !== 'authorized' || pathname !== authorization.pathname) {
          throw new Error('Invalid private upload capability.');
        }
        return {
          token: await issueSignedToken({
            storeId,
            pathname,
            operations: ['put'],
            validUntil: Date.now() + 10 * 60 * 1_000,
            allowedContentTypes: payload.kind === 'video' ? ['video/mp4'] : ['image/jpeg', 'image/png'],
            maximumSizeInBytes: payload.kind === 'video' ? 25 * 1024 * 1024 : 5 * 1024 * 1024,
          }),
          urlOptions: {
            tokenPayload: JSON.stringify({
              uploadId: payload.uploadId,
              kind: payload.kind,
              expectedRevision: authorization.revision,
            }),
          },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseUploadPayload(tokenPayload);
        if (!payload || blob.pathname !== `contributor-media/${payload.uploadId}/${payload.kind}.${payload.kind === 'video' ? 'mp4' : 'png'}`) {
          throw new Error('Invalid private upload completion.');
        }
        await recordContributorMediaObject({
          uploadId: payload.uploadId,
          expectedRevision: payload.expectedRevision,
          kind: payload.kind,
          contentType: blob.contentType,
          size: 1,
        });
      },
    });
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Private upload could not be authorized.' }, { status: 400 });
  }
}

function isBlobUploadBody(value: unknown): value is HandleUploadPresignedBody {
  return value !== null && typeof value === 'object' && 'type' in value;
}

function parseUploadPayload(value: string | null | undefined): {
  uploadId: string;
  kind: 'video' | 'poster';
  expectedRevision: number;
} | null {
  try {
    const payload = JSON.parse(value ?? '') as Record<string, unknown>;
    return /^[a-zA-Z0-9-]{1,160}$/.test(payload.uploadId as string)
      && (payload.kind === 'video' || payload.kind === 'poster')
      && Number.isSafeInteger(payload.expectedRevision) && (payload.expectedRevision as number) > 0
      && Object.keys(payload).length === 3
      ? {
        uploadId: payload.uploadId as string,
        kind: payload.kind,
        expectedRevision: payload.expectedRevision as number,
      }
      : null;
  } catch { return null; }
}

async function resolveAccountActor(): Promise<AccountStudentActor | NextResponse> {
  const actor = await resolveStudentActor({ allowGuest: false });
  return actor?.kind === 'account' ? actor : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function conflict() {
  return NextResponse.json({ error: 'Your contributor record changed. Reload and try again.', category: 'conflict', action: 'reload' }, { status: 409 });
}
