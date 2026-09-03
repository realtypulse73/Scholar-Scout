import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPreviewContextOptions,
  createPreviewSteadyStateHeaders,
  getVerifiedPreviewMetadata,
  scrubPreviewTracerOutcome,
} from './preview-deployment-protection.mjs';

const candidateCommit = 'a'.repeat(40);
const previewMetadata = {
  environment: 'preview',
  url: 'https://scholar-scout-git-release-example.vercel.app',
  deploymentId: 'dpl_preview_123',
  commitSha: candidateCommit,
};

test('accepts only the exact candidate Preview metadata', () => {
  assert.deepEqual(getVerifiedPreviewMetadata({
    SCHOLARSCOUT_PREVIEW_URL: previewMetadata.url,
    SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: previewMetadata.deploymentId,
    SCHOLARSCOUT_PREVIEW_COMMIT_SHA: candidateCommit,
    VERCEL_ENV: 'preview',
  }, candidateCommit), previewMetadata);

  assert.throws(() => getVerifiedPreviewMetadata({
    SCHOLARSCOUT_PREVIEW_URL: previewMetadata.url,
    SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: previewMetadata.deploymentId,
    SCHOLARSCOUT_PREVIEW_COMMIT_SHA: candidateCommit,
    VERCEL_ENV: 'production',
  }, candidateCommit), /candidate Preview/i);
  assert.throws(() => getVerifiedPreviewMetadata({
    SCHOLARSCOUT_PREVIEW_URL: 'https://scholar-scout.vercel.app',
    SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: previewMetadata.deploymentId,
    SCHOLARSCOUT_PREVIEW_COMMIT_SHA: candidateCommit,
    VERCEL_ENV: 'preview',
  }, candidateCommit), /candidate Preview/i);
  assert.throws(() => getVerifiedPreviewMetadata({
    SCHOLARSCOUT_PREVIEW_URL: previewMetadata.url,
    SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: previewMetadata.deploymentId,
    SCHOLARSCOUT_PREVIEW_COMMIT_SHA: 'b'.repeat(40),
    VERCEL_ENV: 'preview',
  }, candidateCommit), /candidate Preview/i);
});

test('keeps the Vercel bypass only in in-memory context headers', () => {
  const bypass = 'preview-bypass-secret';
  const options = createPreviewContextOptions(previewMetadata, {
    SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS: bypass,
  });

  assert.deepEqual(options, {
    baseURL: previewMetadata.url,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
    ignoreHTTPSErrors: false,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  });
  assert.throws(
    () => createPreviewContextOptions(previewMetadata, {}),
    /protection material/i,
  );
  assert.deepEqual(createPreviewSteadyStateHeaders(options), {
    'x-vercel-protection-bypass': bypass,
  });
});

test('scrubs secrets, cookies, URLs, fixture values, and error details from outcomes', () => {
  const outcome = scrubPreviewTracerOutcome({
    category: 'passed',
    metadata: previewMetadata,
    error: new Error('preview-bypass-secret session=super-secret'),
    fixtureId: 'fixture-private',
    cookie: 'session=super-secret',
  });

  assert.deepEqual(outcome, {
    category: 'passed',
    candidateCommit,
    deploymentId: previewMetadata.deploymentId,
  });
  assert.equal(JSON.stringify(outcome).includes('secret'), false);
  assert.equal(JSON.stringify(outcome).includes('vercel.app'), false);
  assert.equal(JSON.stringify(outcome).includes('fixture'), false);
});
