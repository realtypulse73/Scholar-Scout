import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { afterEach, describe, it } from 'node:test';

import { createCodexWebhookRunner } from '../src/server.mjs';

const WEBHOOK_SECRET = 'test-webhook-secret';
const CONFIGURED_REPOSITORY = 'scholar-scout/scholar-scout';
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

describe('Codex webhook runner', () => {
  const servers = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(closeServer));
  });

  it('keeps health observable but rejects webhooks when the signature secret is missing', async () => {
    const fetchCalls = [];
    const server = createCodexWebhookRunner({
      repository: CONFIGURED_REPOSITORY,
      fetchImpl: createFetchRecorder(fetchCalls),
    });
    const baseUrl = await listen(server, servers);

    const healthResponse = await fetch(`${baseUrl}/health`);
    const webhookResponse = await postWebhook(baseUrl, createIssuePayload(), {
      secret: WEBHOOK_SECRET,
    });

    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).service, 'codex-webhook-runner');
    assert.equal(webhookResponse.status, 503);
    assert.equal(fetchCalls.length, 0);
  });

  it('rejects invalid signatures before parsing or creating external side effects', async () => {
    const fetchCalls = [];
    const server = createCodexWebhookRunner({
      webhookSecret: WEBHOOK_SECRET,
      repository: CONFIGURED_REPOSITORY,
      githubToken: 'github-token',
      codexAgentEndpoint: 'https://agent.example/jobs',
      codexAgentBearerToken: 'agent-token',
      fetchImpl: createFetchRecorder(fetchCalls),
    });
    const baseUrl = await listen(server, servers);

    const response = await fetch(`${baseUrl}/github/webhook`, {
      method: 'POST',
      headers: {
        'x-github-event': 'issues',
        'x-hub-signature-256': 'sha256=not-a-valid-signature',
      },
      body: '{this is intentionally not json',
    });

    assert.equal(response.status, 503);
    assert.equal(fetchCalls.length, 0);
  });

  it('ignores a valid webhook for another repository without external side effects', async () => {
    const fetchCalls = [];
    const server = createCodexWebhookRunner({
      webhookSecret: WEBHOOK_SECRET,
      repository: CONFIGURED_REPOSITORY,
      githubToken: 'github-token',
      codexAgentEndpoint: 'https://agent.example/jobs',
      codexAgentBearerToken: 'agent-token',
      fetchImpl: createFetchRecorder(fetchCalls),
    });
    const baseUrl = await listen(server, servers);

    const response = await postWebhook(baseUrl, createIssuePayload({
      repository: 'someone-else/other-repository',
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ignored: true,
      reason: 'Unsupported repository',
    });
    assert.equal(fetchCalls.length, 0);
  });

  it('accepts only configured repository issue opened or labeled events with approved labels', async () => {
    const fetchCalls = [];
    const server = createCodexWebhookRunner({
      webhookSecret: WEBHOOK_SECRET,
      repository: CONFIGURED_REPOSITORY,
      fetchImpl: createFetchRecorder(fetchCalls),
    });
    const baseUrl = await listen(server, servers);

    const acceptedResponse = await postWebhook(baseUrl, createIssuePayload({
      action: 'labeled',
      labels: ['automation'],
    }));
    const rejectedResponse = await postWebhook(baseUrl, createIssuePayload({
      action: 'closed',
      labels: ['automation'],
    }));

    assert.equal(acceptedResponse.status, 200);
    assert.deepEqual(await acceptedResponse.json(), {
      ok: true,
      dispatched: false,
    });
    assert.equal(rejectedResponse.status, 200);
    assert.deepEqual(await rejectedResponse.json(), {
      ignored: true,
      reason: 'Unsupported issue action',
    });
    assert.equal(fetchCalls.length, 0);
  });

  it('rejects a streamed body larger than 64KiB before parsing or external calls', async () => {
    const fetchCalls = [];
    const server = createCodexWebhookRunner({
      webhookSecret: WEBHOOK_SECRET,
      repository: CONFIGURED_REPOSITORY,
      fetchImpl: createFetchRecorder(fetchCalls),
    });
    const baseUrl = await listen(server, servers);
    const oversizedBody = Buffer.alloc(MAX_WEBHOOK_BODY_BYTES + 1, 'a');

    const response = await fetch(`${baseUrl}/github/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'issues',
        'x-hub-signature-256': createSignature(oversizedBody),
      },
      body: oversizedBody,
    });

    assert.equal(response.status, 413);
    assert.equal(fetchCalls.length, 0);
  });
});

function createIssuePayload({
  action = 'opened',
  labels = ['codex'],
  repository = CONFIGURED_REPOSITORY,
} = {}) {
  return {
    action,
    repository: {
      full_name: repository,
    },
    issue: {
      body: 'Please update the webhook runner.',
      comments_url: 'https://api.github.example/issues/42/comments',
      labels: labels.map((name) => ({ name })),
      number: 42,
      title: 'Harden webhook runner',
    },
  };
}

function createFetchRecorder(calls) {
  return async (...args) => {
    calls.push(args);
    return new Response(null, { status: 204 });
  };
}

function createSignature(body) {
  return `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')}`;
}

async function listen(server, servers) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postWebhook(baseUrl, payload, { secret = WEBHOOK_SECRET } = {}) {
  const body = Buffer.from(JSON.stringify(payload));

  return fetch(`${baseUrl}/github/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'issues',
      'x-hub-signature-256': `sha256=${crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')}`,
    },
    body,
  });
}
