import crypto from 'node:crypto';
import http from 'node:http';

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
const SUPPORTED_ISSUE_ACTIONS = new Set(['opened', 'labeled']);
const APPROVED_LABELS = new Set(['codex', 'automation']);

export function createCodexWebhookRunner({
  webhookSecret,
  githubToken,
  codexAgentEndpoint,
  repository,
  fetchImpl = fetch,
  logger = console,
} = {}) {
  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      return respondJson(response, 200, {
        ok: true,
        service: 'codex-webhook-runner',
      });
    }

    if (request.method !== 'POST' || request.url !== '/github/webhook') {
      return respondJson(response, 404, {
        error: 'Not found',
      });
    }

    if (!webhookSecret) {
      return respondJson(response, 503, {
        error: 'Webhook delivery unavailable',
      });
    }

    let bodyBuffer;

    try {
      bodyBuffer = await readRequestBody(request, MAX_WEBHOOK_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return respondJson(response, 413, {
          error: 'Webhook payload too large',
        });
      }

      logger.warn('Unable to read webhook request body');
      return respondJson(response, 400, {
        error: 'Invalid webhook request',
      });
    }

    if (!verifySignature(bodyBuffer, request.headers['x-hub-signature-256'], webhookSecret)) {
      return respondJson(response, 503, {
        error: 'Webhook delivery unavailable',
      });
    }

    let payload;

    try {
      payload = JSON.parse(bodyBuffer.toString('utf8'));
    } catch {
      return respondJson(response, 400, {
        error: 'Invalid webhook payload',
      });
    }

    const qualification = qualifyIssueWebhook({
      event: request.headers['x-github-event'],
      payload,
      repository,
    });

    if (!qualification.qualified) {
      return respondJson(response, 200, {
        ignored: true,
        reason: qualification.reason,
      });
    }

    const jobPacket = createCodexJobPacket(payload);

    try {
      if (githubToken) {
        await postIssueComment({
          fetchImpl,
          githubToken,
          payload,
          jobPacket,
        });
      }

      if (codexAgentEndpoint) {
        await dispatchToAgent({
          fetchImpl,
          endpoint: codexAgentEndpoint,
          jobPacket,
        });
      }
    } catch {
      logger.warn('Webhook external delivery failed');
      return respondJson(response, 502, {
        error: 'Webhook delivery failed',
      });
    }

    return respondJson(response, 200, {
      ok: true,
      dispatched: Boolean(codexAgentEndpoint),
    });
  });
}

function qualifyIssueWebhook({ event, payload, repository }) {
  if (event !== 'issues') {
    return { qualified: false, reason: 'Unsupported event' };
  }

  if (!repository || !isIssuePayload(payload)) {
    return { qualified: false, reason: 'Unsupported repository' };
  }

  if (payload.repository.full_name !== repository) {
    return { qualified: false, reason: 'Unsupported repository' };
  }

  if (!SUPPORTED_ISSUE_ACTIONS.has(payload.action)) {
    return { qualified: false, reason: 'Unsupported issue action' };
  }

  const labels = payload.issue.labels.map((label) => label.name.toLowerCase());

  if (!labels.some((label) => APPROVED_LABELS.has(label))) {
    return { qualified: false, reason: 'Issue missing codex/automation label' };
  }

  return { qualified: true };
}

function isIssuePayload(payload) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      typeof payload.action === 'string' &&
      payload.repository &&
      typeof payload.repository.full_name === 'string' &&
      payload.issue &&
      Number.isInteger(payload.issue.number) &&
      typeof payload.issue.title === 'string' &&
      Array.isArray(payload.issue.labels) &&
      payload.issue.labels.every((label) => (
        label && typeof label.name === 'string'
      )),
  );
}

function createCodexJobPacket(payload) {
  const repo = payload.repository.full_name;
  const issueNumber = payload.issue.number;
  const branchSlug = slugify(payload.issue.title);

  return {
    repository: repo,
    issueNumber,
    branch: `feature/${issueNumber}-${branchSlug}`,
    prompt: [
      `Repository: ${repo}`,
      `Implement GitHub issue #${issueNumber}`,
      'Follow docs/chatgpt-codex-github-sync.md',
      'Create a feature branch and open a PR into main.',
      'Run typecheck, lint, tests, and build before PR creation.',
    ].join('\n'),
    issueTitle: payload.issue.title,
    issueBody: payload.issue.body || '',
  };
}

async function postIssueComment({ fetchImpl, githubToken, payload, jobPacket }) {
  await fetchImpl(payload.issue.comments_url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: [
        '## Codex Job Packet',
        '',
        `Branch: \`${jobPacket.branch}\``,
        '',
        '```text',
        jobPacket.prompt,
        '```',
      ].join('\n'),
    }),
  });
}

async function dispatchToAgent({ fetchImpl, endpoint, jobPacket }) {
  await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobPacket),
  });
}

function verifySignature(body, signatureHeader, secret) {
  if (typeof signatureHeader !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest();
  const provided = Buffer.from(signatureHeader.slice('sha256='.length), 'hex');

  return provided.length === expected.length && crypto.timingSafeEqual(expected, provided);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function readRequestBody(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on('data', (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > maximumBytes) {
        reject(new RequestBodyTooLargeError());
        request.resume();
        return;
      }

      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

class RequestBodyTooLargeError extends Error {}

function respondJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });

  response.end(JSON.stringify(payload));
}

const server = createCodexWebhookRunner({
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  githubToken: process.env.GITHUB_TOKEN,
  codexAgentEndpoint: process.env.CODEX_AGENT_ENDPOINT,
  repository: process.env.SCHOLARSCOUT_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY,
});

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = process.env.PORT || 8787;

  server.listen(port, () => {
    console.log(`Codex webhook runner listening on ${port}`);
  });
}
