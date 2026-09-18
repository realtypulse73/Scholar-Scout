import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPreviewOutageMetadata,
  runPreviewOutageRehearsal,
} from './run-preview-outage-rehearsal.mjs';

const metadata = {
  environment: 'preview',
  url: 'https://scholar-scout-outage.vercel.app',
  commit: 'candidate-commit',
};

test('builds candidate-bound metadata from a non-secret outage Preview URL input', () => {
  assert.deepEqual(
    createPreviewOutageMetadata(' https://scholar-scout-outage.vercel.app/ ', 'candidate-commit'),
    metadata,
  );
  assert.throws(
    () => createPreviewOutageMetadata('', 'candidate-commit'),
    /outage Preview URL workflow input/,
  );
});

test('proves the Preview outage before input processing and cleans its lifecycle', async () => {
  const phases = [];
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'capability-value',
    },
    createLifecycle: (url, capability, headers) => {
      assert.equal(url, metadata.url);
      assert.equal(capability, 'capability-value');
      assert.deepEqual(headers, { 'x-vercel-protection-bypass': 'bypass-value' });
      return async (method) => {
        phases.push(method);
        return { ok: true };
      };
    },
    fetchImpl: async (url, options) => {
      assert.equal(url.toString(), 'https://scholar-scout-outage.vercel.app/api/campus-notes');
      assert.equal(options.method, 'POST');
      assert.equal(options.body, undefined);
      assert.deepEqual(options.headers, { 'x-vercel-protection-bypass': 'bypass-value' });
      return { status: 503, text: async () => JSON.stringify({ error: 'Community submissions are not available right now.' }) };
    },
  });

  assert.deepEqual(phases, ['HEAD', 'POST', 'GET', 'DELETE']);
  assert.deepEqual(result, {
    candidateCommit: 'candidate-commit',
    target: metadata.url,
    outcome: 'passed',
  });
});

test('records a scrubbed transport failure instead of dropping the outage record', async () => {
  let attestationTraffic = false;
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'sensitive-capability',
    },
    attestPreviewDeployment: async () => metadata,
    createLifecycle: () => async () => ({ ok: true }),
    fetchImpl: async () => { throw new Error('sensitive-bypass sensitive-capability'); },
  });

  assert.deepEqual(result, {
    candidateCommit: 'candidate-commit',
    target: metadata.url,
    outcome: 'failed',
    errorCategory: 'outage-transport-failed',
  });
  assert.equal(JSON.stringify(result).includes('sensitive-bypass'), false);
  assert.equal(JSON.stringify(result).includes('sensitive-capability'), false);

  const failedAttestation = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'sensitive-bypass',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'sensitive-capability',
    },
    attestPreviewDeployment: async () => { throw new Error('deployment lookup failed'); },
    createLifecycle: () => {
      attestationTraffic = true;
      return async () => ({ ok: true });
    },
    fetchImpl: async () => { attestationTraffic = true; },
  });

  assert.deepEqual(failedAttestation, {
    candidateCommit: 'candidate-commit',
    outcome: 'failed',
    errorCategory: 'preview-attestation-failed',
  });
  assert.equal(attestationTraffic, false);
});

test('fails closed when the outage result discloses sensitive material', async () => {
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'capability-value',
    },
    createLifecycle: () => async () => ({ ok: true }),
    fetchImpl: async () => ({ status: 503, text: async () => 'fixture should never be exposed' }),
  });

  assert.equal(result.outcome, 'failed');
  assert.equal(result.errorCategory, 'outage-proof-failed');
});

test('records a scrubbed lifecycle failure when outage cleanup is denied', async () => {
  const phases = [];
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    attestPreviewDeployment: async () => metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'capability-value',
    },
    createLifecycle: () => async (method) => {
      phases.push(method);
      return { ok: method !== 'DELETE' };
    },
    fetchImpl: async () => ({
      status: 503,
      text: async () => JSON.stringify({ error: 'Community submissions are unavailable.' }),
    }),
  });

  assert.deepEqual(phases, ['HEAD', 'POST', 'GET', 'DELETE']);
  assert.deepEqual(result, {
    candidateCommit: 'candidate-commit',
    target: metadata.url,
    outcome: 'failed',
    errorCategory: 'fixture-cleanup-failed',
  });
  assert.equal(JSON.stringify(result).includes('bypass-value'), false);
  assert.equal(JSON.stringify(result).includes('capability-value'), false);
});

test('stops before the outage POST when the isolated fixture preflight is denied', async () => {
  const phases = [];
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    previewUrl: metadata.url,
    env: {
      SCHOLARSCOUT_GITHUB_DEPLOYMENTS_TOKEN: 'deployment-read-token',
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_OUTAGE_FIXTURE_CAPABILITY: 'capability-value',
    },
    attestPreviewDeployment: async ({ githubToken, submittedUrl }) => {
      phases.push('attestation');
      assert.equal(githubToken, 'deployment-read-token');
      assert.equal(submittedUrl, metadata.url);
      return metadata;
    },
    createLifecycle: () => async (method) => {
      phases.push(`fixture-${method}`);
      return { ok: false };
    },
    fetchImpl: async () => { phases.push('outage-post'); },
  });

  assert.deepEqual(phases, ['attestation', 'fixture-HEAD']);
  assert.equal(phases.includes('fixture-POST'), false);
  assert.equal(phases.includes('outage-post'), false);
  assert.equal(result.errorCategory, 'fixture-preflight-failed');
  assert.equal(JSON.stringify(result).includes('deployment-read-token'), false);
});
