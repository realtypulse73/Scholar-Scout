import assert from 'node:assert/strict';
import test from 'node:test';

import { runPreviewReleaseTracer } from './run-preview-release-tracer.mjs';

const metadata = {
  environment: 'preview',
  url: 'https://scholar-scout-pr-42.vercel.app',
  commit: 'candidate-commit',
};

test('provisions, verifies, runs with protected page and API transport, and cleans once', async () => {
  const phases = [];
  let browserOptions;
  let closed = false;

  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    createLifecycleRequest: (url, capability) => {
      assert.equal(url, metadata.url);
      assert.equal(capability, 'runner-capability');
      return async (method) => {
        phases.push(method);
        return { ok: true };
      };
    },
    createBrowser: async (options) => {
      browserOptions = options;
      return {
        close: async () => { closed = true; },
      };
    },
    runStudentSpec: async ({ browser, baseURL, childEnv }) => {
      assert.equal(browserOptions, browser);
      assert.equal(baseURL, metadata.url);
      assert.deepEqual(childEnv, {});
    },
  });

  assert.deepEqual(phases, ['POST', 'GET', 'DELETE']);
  assert.equal(closed, true);
  assert.deepEqual(browserOptions, {
    baseURL: metadata.url,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': 'sensitive-bypass',
      'x-vercel-set-bypass-cookie': 'true',
    },
    ignoreHTTPSErrors: false,
  });
  assert.deepEqual(result, {
    outcome: 'passed',
    target: metadata.url,
    candidateCommit: 'candidate-commit',
  });
});

test('fails before lifecycle or browser traffic when a guard is missing or invalid', async () => {
  for (const input of [
    { metadata: { ...metadata, environment: 'production' } },
    { metadata, candidateCommit: 'other-commit' },
    { metadata, env: { SCHOLARSCOUT_VERCEL_BYPASS: 'bypass' } },
    { metadata, env: { SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability' } },
  ]) {
    let traffic = false;
    await assert.rejects(() => runPreviewReleaseTracer({
      candidateCommit: 'candidate-commit',
      env: {
        SCHOLARSCOUT_VERCEL_BYPASS: 'bypass',
        SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability',
        ...input.env,
      },
      createLifecycleRequest: () => { traffic = true; },
      createBrowser: async () => { traffic = true; },
      runStudentSpec: async () => { traffic = true; },
      ...input,
    }));
    assert.equal(traffic, false);
  }
});

test('scrubs sensitive failure details and always delegates lifecycle cleanup', async () => {
  const phases = [];
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    createLifecycleRequest: () => async (method) => {
      phases.push(method);
      return { ok: true };
    },
    createBrowser: async () => ({ close: async () => undefined }),
    runStudentSpec: async () => { throw new Error('sensitive-bypass runner-capability cookie'); },
  });

  assert.deepEqual(phases, ['POST', 'GET', 'DELETE']);
  assert.deepEqual(result, {
    outcome: 'failed',
    target: metadata.url,
    candidateCommit: 'candidate-commit',
    errorCategory: 'student-tracer-failed',
  });
  assert.equal(JSON.stringify(result).includes('sensitive-bypass'), false);
  assert.equal(JSON.stringify(result).includes('runner-capability'), false);
});
