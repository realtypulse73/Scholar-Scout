import assert from 'node:assert/strict';
import test from 'node:test';

import { runPreviewOutageTracer } from './run-preview-outage-tracer.mjs';

const candidateCommit = 'a'.repeat(40);
const environment = {
  VERCEL_ENV: 'preview',
  SCHOLARSCOUT_PREVIEW_CANDIDATE_COMMIT: candidateCommit,
  SCHOLARSCOUT_PREVIEW_COMMIT_SHA: candidateCommit,
  SCHOLARSCOUT_PREVIEW_URL: 'https://scholar-scout-git-release-example.vercel.app',
  SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: 'dpl_outage_123',
  SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS: 'preview-bypass-secret',
  SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'fixture-capability-secret',
  SCHOLARSCOUT_E2E_FIXTURE_ID: 'generated-outage',
  SCHOLARSCOUT_E2E_STUDENT_EMAIL: 'generated@example.test',
  SCHOLARSCOUT_E2E_STUDENT_PASSWORD: 'generated-password',
};

test('proves authenticated safe outage responses, no writes, and exact cleanup', async () => {
  const events = [];
  const page = {
    goto: async (value) => events.push(`goto:${value}`),
    getByLabel: (name) => ({
      fill: async () => events.push(`fill:${name}`),
    }),
    getByRole: () => ({ click: async () => events.push('sign-in') }),
    request: {
      post: async (requestPath) => ({
        status: () => 503,
        json: async () => ({
          error: requestPath === '/api/campus-notes'
            ? 'Community submissions are temporarily unavailable.'
            : 'Inbox requests are temporarily unavailable. Please try again later.',
        }),
      }),
    },
  };
  const context = {
    newPage: async () => page,
    setExtraHTTPHeaders: async () => events.push('steady-headers'),
    close: async () => events.push('close'),
  };
  const methods = [];

  const outcome = await runPreviewOutageTracer({
    environment,
    browser: { newContext: async () => context },
    expect: () => ({ toHaveURL: async () => events.push('profile') }),
    request: async (_baseUrl, method) => {
      methods.push(method);
      return {
        ok: true,
        phase: method === 'POST'
          ? 'verified'
          : method === 'PUT'
            ? 'no-write'
            : 'cleaned',
      };
    },
  });

  assert.deepEqual(methods, ['POST', 'PUT', 'DELETE']);
  assert.deepEqual(outcome, {
    category: 'passed',
    candidateCommit,
    deploymentId: 'dpl_outage_123',
    cleanup: 'passed',
  });
  assert.equal(JSON.stringify(outcome).includes('secret'), false);
  assert.equal(events.at(-1), 'close');
});

test('fails before traffic when runner-only credentials are absent', async () => {
  let requests = 0;
  await assert.rejects(
    runPreviewOutageTracer({
      environment: { ...environment, SCHOLARSCOUT_E2E_STUDENT_PASSWORD: '' },
      browser: { newContext: async () => assert.fail('browser must not start') },
      expect: () => ({}),
      request: async () => { requests += 1; },
    }),
    /configuration is unavailable/i,
  );
  assert.equal(requests, 0);
});
