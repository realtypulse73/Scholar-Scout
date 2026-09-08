import assert from 'node:assert/strict';
import test from 'node:test';

import { runFixtureLifecycle } from './e2e-fixture-lifecycle.mjs';

test('creates, verifies, and cleans a fixture with no request body', async () => {
  const phases = [];
  await runFixtureLifecycle({
    request: async (method, options) => {
      phases.push({ method, options });
      return { ok: true };
    },
    run: async () => undefined,
  });
  assert.deepEqual(phases.map(({ method }) => method), ['POST', 'GET', 'DELETE']);
  assert.ok(phases.every(({ options }) => options.body === undefined));
});

test('cleans exactly once after a failing browser run', async () => {
  const phases = [];
  await assert.rejects(() => runFixtureLifecycle({
    request: async (method) => {
      phases.push(method);
      return { ok: true };
    },
    run: async () => { throw new Error('test failed'); },
  }));
  assert.deepEqual(phases, ['POST', 'GET', 'DELETE']);
});

test('exposes the same awaited cleanup for a child crash or signal handler', async () => {
  const phases = [];
  let cleanup;
  await runFixtureLifecycle({
    request: async (method) => {
      phases.push(method);
      return { ok: true };
    },
    onCleanupReady: (value) => { cleanup = value; },
    run: async () => cleanup(),
  });
  assert.deepEqual(phases, ['POST', 'GET', 'DELETE']);
});
