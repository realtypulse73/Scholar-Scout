import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLifecycleProtectionHeaders,
  createProtectedPreviewContextOptions,
  validatePreviewDeployment,
} from './preview-deployment-protection.mjs';

const metadata = {
  environment: 'preview',
  url: 'https://scholar-scout-pr-42.vercel.app',
  commit: 'candidate-commit',
};

test('creates in-memory protection options only for the verified candidate Preview', () => {
  const options = createProtectedPreviewContextOptions({
    metadata,
    candidateCommit: 'candidate-commit',
    env: { SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass' },
  });

  assert.deepEqual(options, {
    baseURL: metadata.url,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': 'sensitive-bypass',
      'x-vercel-set-bypass-cookie': 'true',
    },
  });
});

test('rejects non-Preview or candidate-mismatched metadata before browser traffic', () => {
  assert.throws(() => validatePreviewDeployment({ ...metadata, environment: 'production' }, 'candidate-commit'));
  assert.throws(() => validatePreviewDeployment({ ...metadata, commit: 'other-commit' }, 'candidate-commit'));
  assert.throws(() => validatePreviewDeployment({ ...metadata, url: 'http://preview.test' }, 'candidate-commit'));
});

test('fails closed without runner-only bypass material', () => {
  assert.throws(() => createProtectedPreviewContextOptions({
    metadata,
    candidateCommit: 'candidate-commit',
    env: {},
  }));
});

test('normalizes only surrounding whitespace from runner-owned bypass material', () => {
  const options = createProtectedPreviewContextOptions({
    metadata,
    candidateCommit: 'candidate-commit',
    env: { SCHOLARSCOUT_VERCEL_BYPASS: '  sensitive-bypass\n' },
  });

  assert.equal(options.extraHTTPHeaders['x-vercel-protection-bypass'], 'sensitive-bypass');
});

test('omits browser cookie setup from direct lifecycle transport', () => {
  assert.deepEqual(createLifecycleProtectionHeaders({
    'x-vercel-protection-bypass': 'sensitive-bypass',
    'x-vercel-set-bypass-cookie': 'true',
  }), {
    'x-vercel-protection-bypass': 'sensitive-bypass',
  });
});
