import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFixtureLifecycleFailure,
  createLifecycleRequest,
  runFixtureLifecycle,
} from './e2e-fixture-lifecycle.mjs';

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

test('fails closed before navigation when lifecycle configuration is absent or unsafe', () => {
  assert.throws(() => createLifecycleRequest('http://127.0.0.1:4300', 'capability'));
  assert.throws(() => createLifecycleRequest('https://127.0.0.1:4300', ''));
});

test('normalizes surrounding whitespace from a runner-owned lifecycle capability', async () => {
  const request = createLifecycleRequest(
    'https://preview.example.test',
    '  runner-capability\n',
  );
  const originalFetch = globalThis.fetch;
  let authorization;
  globalThis.fetch = async (_url, options) => {
    authorization = options.headers.Authorization;
    return { ok: true };
  };

  try {
    await request('POST');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(authorization, 'Bearer runner-capability');
});

test('uses manual redirects so protected login pages cannot satisfy the lifecycle', async () => {
  const request = createLifecycleRequest('https://preview.example.test', 'runner-capability');
  const originalFetch = globalThis.fetch;
  let redirect;
  globalThis.fetch = async (_url, options) => {
    redirect = options.redirect;
    return { ok: false, status: 302 };
  };

  try {
    const response = await request('POST');
    assert.equal(response.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(redirect, 'manual');
});

test('does not begin the browser run when create or verify is rejected', async () => {
  const phases = [];
  let ranBrowser = false;

  await assert.rejects(() => runFixtureLifecycle({
    request: async (method) => {
      phases.push(method);
      return { ok: method !== 'POST' };
    },
    run: async () => { ranBrowser = true; },
  }));

  assert.deepEqual(phases, ['POST', 'DELETE']);
  assert.equal(ranBrowser, false);
});

test('classifies lifecycle responses without retaining a raw status or response body', async () => {
  for (const [status, category] of [
    [302, 'fixture-provision-redirected'],
    [403, 'fixture-provision-rejected'],
    [503, 'fixture-provision-server-failed'],
  ]) {
    await assert.rejects(
      () => runFixtureLifecycle({
        request: async (method) => ({ ok: method !== 'POST', status, body: 'sensitive' }),
        run: async () => undefined,
      }),
      (error) => {
        assert.equal(classifyFixtureLifecycleFailure(error), category);
        assert.equal(JSON.stringify(error).includes(String(status)), false);
        assert.equal(JSON.stringify(error).includes('sensitive'), false);
        return true;
      },
    );
  }
});

test('identifies a disabled fixture without recording the protected response body', async () => {
  await assert.rejects(
    () => runFixtureLifecycle({
      request: async (method) => ({
        ok: method !== 'POST',
        status: 403,
        headers: { get: (name) => name === 'x-scholarscout-e2e-fixture-denial' ? 'not-enabled' : null },
        body: 'sensitive',
      }),
      run: async () => undefined,
    }),
    (error) => {
      assert.equal(classifyFixtureLifecycleFailure(error), 'fixture-provision-not-enabled');
      assert.equal(JSON.stringify(error).includes('sensitive'), false);
      return true;
    },
  );
});
