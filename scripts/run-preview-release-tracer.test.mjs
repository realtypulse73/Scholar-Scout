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
  let studentBrowser;
  let closed = false;

  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    createLifecycleRequest: (url, capability, headers) => {
      assert.equal(url, metadata.url);
      assert.equal(capability, 'runner-capability');
      assert.deepEqual(headers, {
        'x-vercel-protection-bypass': 'sensitive-bypass',
      });
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
    runStudentSpec: async ({ browser, baseURL, childEnv, diagnostics }) => {
      studentBrowser = browser;
      assert.equal(baseURL, metadata.url);
      assert.deepEqual(childEnv, {});
      assert.deepEqual(diagnostics, {
        trace: 'off',
        screenshot: 'off',
        video: 'off',
      });
    },
  });

  assert.deepEqual(phases, ['HEAD', 'POST', 'GET', 'DELETE']);
  assert.equal(closed, true);
  assert.equal(studentBrowser.close instanceof Function, true);
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

test('fails before lifecycle or browser traffic when the attested target or runner guards are invalid', async () => {
  for (const input of [
    { attestation: { ...metadata, environment: 'production' } },
    { candidateCommit: 'other-commit' },
    { env: { SCHOLARSCOUT_VERCEL_BYPASS: 'bypass' } },
    { env: { SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability' } },
  ]) {
    let traffic = false;
    await assert.rejects(() => runPreviewReleaseTracer({
      candidateCommit: 'candidate-commit',
      previewUrl: metadata.url,
      attestPreviewDeployment: async () => input.attestation ?? metadata,
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
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
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

  assert.deepEqual(phases, ['HEAD', 'POST', 'GET', 'DELETE']);
  assert.deepEqual(result, {
    outcome: 'failed',
    target: metadata.url,
    candidateCommit: 'candidate-commit',
    errorCategory: 'student-tracer-failed',
  });
  assert.equal(JSON.stringify(result).includes('sensitive-bypass'), false);
  assert.equal(JSON.stringify(result).includes('runner-capability'), false);
});

test('records a scrubbed lifecycle failure when Preview fixture preflight is denied', async () => {
  let browserStarted = false;
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    createLifecycleRequest: () => async () => ({ ok: false }),
    createBrowser: async () => { browserStarted = true; },
  });

  assert.equal(browserStarted, false);
  assert.deepEqual(result, {
    outcome: 'failed',
    target: metadata.url,
    candidateCommit: 'candidate-commit',
    errorCategory: 'fixture-preflight-failed',
  });
  assert.equal(JSON.stringify(result).includes('sensitive-bypass'), false);
  assert.equal(JSON.stringify(result).includes('runner-capability'), false);
});

test('requires independent attestation before it creates any Preview lifecycle or browser traffic', async () => {
  const phases = [];
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN: 'deployment-read-token',
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    attestPreviewDeployment: async ({ githubToken, submittedUrl }) => {
      phases.push('attestation');
      assert.equal(githubToken, 'deployment-read-token');
      assert.equal(submittedUrl, metadata.url);
      return metadata;
    },
    createLifecycleRequest: () => {
      phases.push('lifecycle');
      return async () => ({ ok: false });
    },
    createBrowser: async () => { phases.push('browser'); },
  });

  assert.equal(phases[0], 'attestation');
  assert.equal(result.errorCategory, 'fixture-preflight-failed');
  assert.equal(JSON.stringify(result).includes('deployment-read-token'), false);
});
