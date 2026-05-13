import crypto from 'node:crypto';
import http from 'node:http';

const PORT = process.env.PORT || 8787;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CODEX_AGENT_ENDPOINT = process.env.CODEX_AGENT_ENDPOINT;

const server = http.createServer(async (request, response) => {
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

  const bodyBuffer = await readRequestBody(request);

  if (!verifySignature(bodyBuffer, request.headers['x-hub-signature-256'])) {
    return respondJson(response, 401, {
      error: 'Invalid webhook signature',
    });
  }

  const event = request.headers['x-github-event'];
  const payload = JSON.parse(bodyBuffer.toString('utf8'));

  if (event !== 'issues') {
    return respondJson(response, 200, {
      ignored: true,
      reason: 'Unsupported event',
    });
  }

  if (!['opened', 'labeled'].includes(payload.action)) {
    return respondJson(response, 200, {
      ignored: true,
      reason: 'Unsupported issue action',
    });
  }

  const labels = payload.issue.labels.map((label) => label.name.toLowerCase());

  if (!labels.includes('codex') && !labels.includes('automation')) {
    return respondJson(response, 200, {
      ignored: true,
      reason: 'Issue missing codex/automation label',
    });
  }

  const jobPacket = createCodexJobPacket(payload);

  if (GITHUB_TOKEN) {
    await postIssueComment(payload, jobPacket);
  }

  if (CODEX_AGENT_ENDPOINT) {
    await dispatchToAgent(jobPacket);
  }

  return respondJson(response, 200, {
    ok: true,
    dispatched: Boolean(CODEX_AGENT_ENDPOINT),
  });
});

server.listen(PORT, () => {
  console.log(`Codex webhook runner listening on ${PORT}`);
});

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

async function postIssueComment(payload, jobPacket) {
  const url = payload.issue.comments_url;

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
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

async function dispatchToAgent(jobPacket) {
  await fetch(CODEX_AGENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobPacket),
  });
}

function verifySignature(body, signatureHeader) {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('Missing GITHUB_WEBHOOK_SECRET; signature validation disabled.');
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function respondJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });

  response.end(JSON.stringify(payload));
}
