import assert from 'node:assert/strict';
import test from 'node:test';

import { runFixtureLifecycle } from './e2e-fixture-lifecycle.mjs';

test('runs fixed create, verify, and cleanup lifecycle requests', async () => {
  const requests = [];
  const result = await runFixtureLifecycle({
    baseUrl: 'https://127.0.0.1:4311',
    capability: 'capability',
    request: async (method, path, options) => {
      requests.push({ method, path, options });
      return { ok: true, phase: method === 'DELETE' ? 'cleaned' : 'verified' };
    },
    run: async () => ({ category: 'passed' }),
  });

  assert.deepEqual(result, { category: 'passed' });
  assert.deepEqual(requests.map(({ method }) => method), ['POST', 'GET', 'DELETE']);
  assert.ok(requests.every(({ path }) => path === '/api/internal/e2e-fixture'));
  assert.ok(requests.every(({ options }) => options.body === undefined));
  assert.ok(requests.every(({ options }) => options.headers['content-length'] === '0'));
});

test('cleans once when the browser command rejects', async () => {
  const methods = [];
  await assert.rejects(() => runFixtureLifecycle({
    baseUrl: 'https://127.0.0.1:4311',
    capability: 'capability',
    request: async (method) => {
      methods.push(method);
      return { ok: true, phase: method === 'DELETE' ? 'cleaned' : 'verified' };
    },
    run: async () => {
      throw new Error('test failed');
    },
  }));
  assert.deepEqual(methods, ['POST', 'GET', 'DELETE']);
});
