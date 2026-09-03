import assert from 'node:assert/strict';
import test from 'node:test';

import { runPreviewReleaseTracer } from './run-preview-release-tracer.mjs';

const candidateCommit = 'a'.repeat(40);
const environment = {
  VERCEL_ENV: 'preview',
  SCHOLARSCOUT_PREVIEW_URL: 'https://scholar-scout-git-release-example.vercel.app',
  SCHOLARSCOUT_PREVIEW_DEPLOYMENT_ID: 'dpl_preview_123',
  SCHOLARSCOUT_PREVIEW_COMMIT_SHA: candidateCommit,
  SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS: 'preview-bypass-secret',
  SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: 'fixture-capability-secret',
};

test('fails before browser creation or traffic when Preview metadata or runner secrets are invalid', async () => {
  for (const invalidEnvironment of [
    { ...environment, VERCEL_ENV: 'production' },
    { ...environment, SCHOLARSCOUT_PREVIEW_COMMIT_SHA: 'b'.repeat(40) },
    { ...environment, SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS: '' },
    { ...environment, SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY: '' },
  ]) {
    let browserCalls = 0;
    let requestCalls = 0;
    await assert.rejects(() => runPreviewReleaseTracer({
      candidateCommit,
      environment: invalidEnvironment,
      browser: { newContext: async () => { browserCalls += 1; } },
      request: async () => { requestCalls += 1; },
      runStudentJourney: async () => {},
    }), /candidate Preview|protection material|fixture capability/i);
    assert.equal(browserCalls, 0);
    assert.equal(requestCalls, 0);
  }
});

test('orders protected lifecycle, context traffic, student journey, and exact cleanup without secret-bearing children', async () => {
  const events = [];
  const requests = [];
  const page = { marker: 'page' };
  const context = {
    newPage: async () => {
      events.push('new-page');
      return page;
    },
    close: async () => { events.push('close-context'); },
  };
  const result = await runPreviewReleaseTracer({
    candidateCommit,
    environment,
    request: async (method, path, options) => {
      events.push(method);
      requests.push({ method, path, options });
      return { ok: true, phase: method === 'DELETE' ? 'cleaned' : 'verified' };
    },
    browser: {
      newContext: async (options) => {
        events.push('new-context');
        assert.equal(options.extraHTTPHeaders['x-vercel-protection-bypass'], 'preview-bypass-secret');
        return context;
      },
    },
    runStudentJourney: async ({ page: receivedPage, context: receivedContext, metadata }) => {
      events.push('journey');
      assert.equal(receivedPage, page);
      assert.equal(receivedContext, context);
      assert.equal(metadata.commitSha, candidateCommit);
    },
  });

  assert.deepEqual(events, ['POST', 'GET', 'new-context', 'new-page', 'journey', 'DELETE', 'close-context']);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(({ options }) => options.headers.authorization === 'Bearer fixture-capability-secret'));
  assert.ok(requests.every(({ options }) => options.headers['x-vercel-protection-bypass'] === 'preview-bypass-secret'));
  assert.deepEqual(result, {
    category: 'passed',
    candidateCommit,
    deploymentId: 'dpl_preview_123',
  });
  assert.equal(JSON.stringify(result).includes('secret'), false);
});

test('delegates cleanup exactly once when the student journey fails', async () => {
  const methods = [];
  let contextClosed = 0;
  await assert.rejects(() => runPreviewReleaseTracer({
    candidateCommit,
    environment,
    request: async (method) => {
      methods.push(method);
      return { ok: true, phase: method === 'DELETE' ? 'cleaned' : 'verified' };
    },
    browser: {
      newContext: async () => ({
        newPage: async () => ({}),
        close: async () => { contextClosed += 1; },
      }),
    },
    runStudentJourney: async () => { throw new Error('journey failed'); },
  }), /student journey failed/i);
  assert.deepEqual(methods, ['POST', 'GET', 'DELETE']);
  assert.equal(contextClosed, 1);
});
