import assert from 'node:assert/strict';
import test from 'node:test';

import {
  attestPreviewDeployment,
  MAX_STATUS_AGE_MS,
} from './preview-deployment-attestation.mjs';

const candidateCommit = 'bb252ef3e9bfc19ef4d8c701babefb8b8722fcc5';
const submittedUrl = 'https://scholar-scout-preview.vercel.app';
const nowUtcMs = Date.parse('2026-09-18T22:00:00Z');
const expectedEnvironment = 'Preview – scholar-scout-rehearsal-baseline';

function deployment(id, overrides = {}) {
  return {
    id,
    sha: candidateCommit,
    environment: expectedEnvironment,
    creator: { login: 'vercel[bot]', type: 'Bot' },
    ...overrides,
  };
}

function status(id, createdAtMs, overrides = {}) {
  return {
    id,
    state: 'success',
    environment: expectedEnvironment,
    environment_url: submittedUrl,
    created_at: new Date(createdAtMs).toISOString(),
    ...overrides,
  };
}

function createFetch(pages) {
  return async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer read-only-token');
    const key = url.toString();
    const body = pages.get(key);
    if (!body) return { ok: false, json: async () => ({ message: 'untrusted provider body' }) };
    return { ok: true, json: async () => body };
  };
}

function deploymentPage(page = 1) {
  return `https://api.github.com/repos/realtypulse73/Scholar-Scout/deployments?per_page=100&page=${page}`;
}

function statusPage(id, page = 1) {
  return `https://api.github.com/repos/realtypulse73/Scholar-Scout/deployments/${id}/statuses?per_page=100&page=${page}`;
}

function attestationOptions(fetchImpl) {
  return {
    owner: 'realtypulse73',
    repo: 'Scholar-Scout',
    candidateCommit,
    submittedUrl,
    expectedEnvironment,
    githubToken: 'read-only-token',
    nowUtcMs,
    fetchImpl,
  };
}

test('selects the newest unique fresh Vercel Preview deployment status', async () => {
  const pages = new Map([
    [deploymentPage(), [deployment(101), deployment(202)]],
    [statusPage(101), [status(1, nowUtcMs - 5000)]],
    [statusPage(202), [status(2, nowUtcMs - 1000)]],
  ]);

  const result = await attestPreviewDeployment(attestationOptions(createFetch(pages)));

  assert.deepEqual(result, {
    environment: 'preview',
    url: submittedUrl,
    commit: candidateCommit,
  });
});

test('rejects equal-newest deployment statuses, stale or malformed timestamps, and wrong deployment identities', async () => {
  const scenarios = [
    new Map([
      [deploymentPage(), [deployment(101), deployment(202)]],
      [statusPage(101), [status(1, nowUtcMs - 1000)]],
      [statusPage(202), [status(2, nowUtcMs - 1000)]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101)]],
      [statusPage(101), [status(1, nowUtcMs - MAX_STATUS_AGE_MS - 1)]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101)]],
      [statusPage(101), [status(1, nowUtcMs - 1, { created_at: 'not-a-time' })]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101, { sha: '0'.repeat(40) })]],
      [statusPage(101), [status(1, nowUtcMs - 1)]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101)]],
      [statusPage(101), [status(1, nowUtcMs - 1, { environment_url: 'https://wrong.example.test' })]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101, { environment: 'Preview' })]],
      [statusPage(101), [status(1, nowUtcMs - 1)]],
    ]),
    new Map([
      [deploymentPage(), [deployment(101)]],
      [statusPage(101), [status(1, nowUtcMs - 1, { environment: 'Preview' })]],
    ]),
  ];

  for (const pages of scenarios) {
    await assert.rejects(
      () => attestPreviewDeployment(attestationOptions(createFetch(pages))),
      /Preview deployment attestation failed\./,
    );
  }
});

test('rejects a broad or unknown environment before contacting GitHub', async () => {
  let requested = false;
  await assert.rejects(
    () => attestPreviewDeployment({
      ...attestationOptions(async () => {
        requested = true;
        return { ok: true, json: async () => [] };
      }),
      expectedEnvironment: 'Preview',
    }),
    /Preview deployment attestation failed\./,
  );
  assert.equal(requested, false);
});

test('paginates deployments and statuses, while allowing older history beside a fresh match', async () => {
  const pages = new Map([
    [deploymentPage(), Array.from({ length: 100 }, (_, index) => deployment(index + 1, { sha: '0'.repeat(40) }))],
    [deploymentPage(2), [deployment(101)]],
    [statusPage(101), Array.from({ length: 100 }, (_, index) => status(index + 1, nowUtcMs - MAX_STATUS_AGE_MS - 1))],
    [statusPage(101, 2), [status(102, nowUtcMs - MAX_STATUS_AGE_MS)]],
  ]);

  const result = await attestPreviewDeployment(attestationOptions(createFetch(pages)));

  assert.equal(result.url, submittedUrl);
});

test('accepts freshness boundary values and scrubs tokens, URLs, and provider bodies from errors', async () => {
  const boundaryPages = new Map([
    [deploymentPage(), [deployment(101)]],
    [statusPage(101), [status(1, nowUtcMs - MAX_STATUS_AGE_MS)]],
  ]);
  const result = await attestPreviewDeployment(attestationOptions(createFetch(boundaryPages)));
  assert.equal(result.commit, candidateCommit);

  const leakingFetch = async () => ({
    ok: false,
    json: async () => ({ secret: 'read-only-token', url: submittedUrl }),
  });
  await assert.rejects(
    () => attestPreviewDeployment(attestationOptions(leakingFetch)),
    (error) => {
      assert.equal(error.message.includes('read-only-token'), false);
      assert.equal(error.message.includes(submittedUrl), false);
      return true;
    },
  );
});
