import assert from 'node:assert/strict';
import test from 'node:test';

import { runPreviewOutageRehearsal } from './run-preview-outage-rehearsal.mjs';

const metadata = {
  environment: 'preview',
  url: 'https://scholar-scout-outage.vercel.app',
  commit: 'candidate-commit',
};

test('proves the Preview outage before input processing and cleans its lifecycle', async () => {
  const phases = [];
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability-value',
    },
    createLifecycle: () => async (method) => {
      phases.push(method);
      return { ok: true };
    },
    fetchImpl: async (url, options) => {
      assert.equal(url.toString(), 'https://scholar-scout-outage.vercel.app/api/campus-notes');
      assert.equal(options.method, 'POST');
      assert.equal(options.body, undefined);
      return { status: 503, text: async () => JSON.stringify({ error: 'Community submissions are not available right now.' }) };
    },
  });

  assert.deepEqual(phases, ['POST', 'GET', 'DELETE']);
  assert.deepEqual(result, {
    candidateCommit: 'candidate-commit',
    target: metadata.url,
    outcome: 'passed',
  });
});

test('fails closed when the outage result discloses sensitive material', async () => {
  const result = await runPreviewOutageRehearsal({
    candidateCommit: 'candidate-commit',
    metadata,
    env: {
      SCHOLARSCOUT_VERCEL_BYPASS: 'bypass-value',
      SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'capability-value',
    },
    createLifecycle: () => async () => ({ ok: true }),
    fetchImpl: async () => ({ status: 503, text: async () => 'fixture should never be exposed' }),
  });

  assert.equal(result.outcome, 'failed');
  assert.equal(result.errorCategory, 'outage-proof-failed');
});
