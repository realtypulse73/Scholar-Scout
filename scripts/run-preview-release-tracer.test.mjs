import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPreviewMetadata,
  runPreviewReleaseTracer,
} from './run-preview-release-tracer.mjs';

const metadata = {
  environment: 'preview',
  url: 'https://scholar-scout-pr-42.vercel.app',
  commit: 'candidate-commit',
};

test('builds candidate-bound metadata from a non-secret Preview URL input', () => {
  assert.deepEqual(
    createPreviewMetadata(' https://scholar-scout-pr-42.vercel.app/ ', 'candidate-commit'),
    metadata,
  );
  assert.throws(
    () => createPreviewMetadata('', 'candidate-commit'),
    /Preview URL workflow input/,
  );
});

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
    runStudentSpec: async ({ browser, baseURL, childEnv, diagnostics, timeoutMs }) => {
      studentBrowser = browser;
      assert.equal(baseURL, metadata.url);
      assert.deepEqual(childEnv, {});
      assert.deepEqual(diagnostics, {
        trace: 'off',
        screenshot: 'off',
        video: 'off',
      });
      assert.equal(timeoutMs, 60_000);
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
    {
      attestation: { ...metadata, environment: 'production' },
      candidateCommit: 'candidate-commit',
      env: { SCHOLARSCOUT_VERCEL_BYPASS: 'bypass', SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability' },
    },
    {
      candidateCommit: 'other-commit',
      env: { SCHOLARSCOUT_VERCEL_BYPASS: 'bypass', SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability' },
    },
    {
      candidateCommit: 'candidate-commit',
      env: { SCHOLARSCOUT_VERCEL_BYPASS: 'bypass' },
    },
  ]) {
    let traffic = false;
    await assert.rejects(() => runPreviewReleaseTracer({
      candidateCommit: input.candidateCommit,
      previewUrl: metadata.url,
      attestPreviewDeployment: async () => input.attestation ?? metadata,
      env: input.env,
      createLifecycleRequest: () => { traffic = true; },
      createBrowser: async () => { traffic = true; },
      runStudentSpec: async () => { traffic = true; },
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

test('records a safe programme-visibility category without browser diagnostics', async () => {
  let attestationTraffic = false;
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    attestPreviewDeployment: async () => metadata,
    createLifecycleRequest: () => async () => ({ ok: true }),
    createBrowser: async () => ({ close: async () => undefined }),
    runStudentSpec: async () => {
      throw new Error('Student release fixture did not expose the governed programme.');
    },
  });

  assert.equal(result.errorCategory, 'student-programme-not-visible');
  assert.equal(JSON.stringify(result).includes('programme.'), false);

  const failedAttestation = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    attestPreviewDeployment: async () => { throw new Error('deployment lookup failed'); },
    createLifecycleRequest: () => {
      attestationTraffic = true;
      return async () => ({ ok: true });
    },
    createBrowser: async () => { attestationTraffic = true; },
    runStudentSpec: async () => { attestationTraffic = true; },
  });

  assert.deepEqual(failedAttestation, {
    candidateCommit: 'candidate-commit',
    outcome: 'failed',
    target: undefined,
    errorCategory: 'preview-attestation-failed',
  });
  assert.equal(attestationTraffic, false);
});

test('uses the workflow GitHub token for deployment attestation when no dedicated token is configured', async () => {
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      GITHUB_TOKEN: 'workflow-read-token',
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    attestPreviewDeployment: async ({ githubToken, expectedEnvironment }) => {
      assert.equal(githubToken, 'workflow-read-token');
      assert.equal(expectedEnvironment, 'Preview – scholar-scout-rehearsal-baseline');
      return metadata;
    },
    createLifecycleRequest: () => async () => ({ ok: true }),
    createBrowser: async () => ({ close: async () => undefined }),
    runStudentSpec: async () => undefined,
  });

  assert.equal(result.outcome, 'passed');
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

test('stops before the browser or fixture POST when the isolated fixture preflight is denied', async () => {
  const phases = [];
  const result = await runPreviewReleaseTracer({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN: 'deployment-read-token',
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'runner-capability',
    },
    attestPreviewDeployment: async ({ githubToken, submittedUrl, expectedEnvironment }) => {
      phases.push('attestation');
      assert.equal(githubToken, 'deployment-read-token');
      assert.equal(submittedUrl, metadata.url);
      assert.equal(expectedEnvironment, 'Preview – scholar-scout-rehearsal-baseline');
      return metadata;
    },
    createLifecycleRequest: () => async (method) => {
      phases.push(`fixture-${method}`);
      return { ok: false };
    },
    createBrowser: async () => { phases.push('browser'); },
  });

  assert.deepEqual(phases, ['attestation', 'fixture-HEAD']);
  assert.equal(phases.includes('fixture-POST'), false);
  assert.equal(phases.includes('browser'), false);
  assert.equal(result.errorCategory, 'fixture-preflight-failed');
  assert.equal(JSON.stringify(result).includes('deployment-read-token'), false);
});
