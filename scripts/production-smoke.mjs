#!/usr/bin/env node

import { loadEnvFileFromArgs } from './env-file.mjs';

loadEnvFileFromArgs(process.argv.slice(2));

const baseUrl = normalizeBaseUrl(
  process.env.SCHOLARSCOUT_SMOKE_BASE_URL ?? process.env.NEXTAUTH_URL,
);
const staffCookie = process.env.SCHOLARSCOUT_SMOKE_STAFF_COOKIE;
const healthToken = process.env.SCHOLARSCOUT_SMOKE_HEALTH_TOKEN;
const expectedAdapter = process.env.SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER;
const expectedProviders = splitList(
  process.env.SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS,
);
const maxHealthAgeMinutes = Number(
  process.env.SCHOLARSCOUT_SMOKE_MAX_HEALTH_AGE_MINUTES ?? 5,
);
const requestTimeoutMs = Number(
  process.env.SCHOLARSCOUT_SMOKE_TIMEOUT_MS ?? 10000,
);
const requestRetries = Number(process.env.SCHOLARSCOUT_SMOKE_RETRIES ?? 1);
const maxLatencyMs = Number(process.env.SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS ?? 0);
const outputJson = process.argv.includes('--json');

if (!baseUrl) {
  fail(
    'Set SCHOLARSCOUT_SMOKE_BASE_URL or NEXTAUTH_URL to the deployed ScholarScout URL.',
  );
}

const checks = [];

await checkStatus('home page', '/', 200);
await checkStatus('programmes listing', '/programmes', 200);
await checkStatus('sign-in page', '/auth/sign-in', 200);
const providersResponse = await checkStatus('auth providers', '/api/auth/providers', 200);
await checkExpectedProviders(providersResponse);
await checkStatus('signed-out admin data status', '/api/admin/data/status', 403);
await checkStatusOneOf('signed-out data health', '/api/admin/data/health', [
  403,
  503,
]);
await checkStatus(
  'signed-out backup restore',
  '/api/admin/data/backups/smoke/restore',
  403,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  },
);

if (healthToken) {
  await checkDataHealth();
} else if (staffCookie) {
  await checkStaffDataStatus();
} else {
  checks.push({
    name: 'authenticated data health checks',
    status: 'skipped',
    detail:
      'Set SCHOLARSCOUT_SMOKE_HEALTH_TOKEN or SCHOLARSCOUT_SMOKE_STAFF_COOKIE.',
  });
}

if (staffCookie) {
  await checkStatus('staff data export', '/api/admin/data/export', 200, {
    headers: staffHeaders(),
  });
} else {
  checks.push({
    name: 'staff data export',
    status: 'skipped',
    detail: 'Set SCHOLARSCOUT_SMOKE_STAFF_COOKIE after signing in as staff.',
  });
}

const failed = checks.filter((check) => check.status === 'failed');
const skipped = checks.filter((check) => check.status === 'skipped');
const summary = {
  passed: checks.length - failed.length - skipped.length,
  skipped: skipped.length,
  failed: failed.length,
};

if (outputJson) {
  console.log(JSON.stringify({ summary, checks }, null, 2));
} else {
  checks.forEach((check) => {
    const marker =
      check.status === 'passed'
        ? 'PASS'
        : check.status === 'skipped'
          ? 'SKIP'
          : 'FAIL';
    console.log(
      `${marker} ${check.name}${check.detail ? ` - ${check.detail}` : ''}`,
    );
  });

  console.log(
    `Summary: ${summary.passed} passed, ${summary.skipped} skipped, ${summary.failed} failed.`,
  );
}

if (failed.length > 0) {
  process.exitCode = 1;
}

function normalizeBaseUrl(value) {
  if (!value) {
    return '';
  }

  return value.replace(/\/+$/, '');
}

async function checkStatus(name, pathname, expectedStatus, init = {}) {
  const response = await request(pathname, init);

  if (response.error) {
    checks.push({
      name,
      status: 'failed',
      detail: response.error,
    });
    return response;
  }

  if (response.status === expectedStatus) {
    checks.push({
      name,
      status: 'passed',
      detail: responseDetail(response),
    });
    checkLatency(name, response);
    return response;
  }

  checks.push({
    name,
    status: 'failed',
    detail: `expected ${expectedStatus}, received ${response.status}`,
  });
  return response;
}

async function checkStatusOneOf(name, pathname, expectedStatuses, init = {}) {
  const response = await request(pathname, init);

  if (response.error) {
    checks.push({
      name,
      status: 'failed',
      detail: response.error,
    });
    return response;
  }

  if (expectedStatuses.includes(response.status)) {
    checks.push({
      name,
      status: 'passed',
      detail: responseDetail(response),
    });
    checkLatency(name, response);
    return response;
  }

  checks.push({
    name,
    status: 'failed',
    detail: `expected ${expectedStatuses.join(' or ')}, received ${response.status}`,
  });
  return response;
}

async function checkStaffDataStatus() {
  const response = await checkStatus('staff data status', '/api/admin/data/status', 200, {
    headers: staffHeaders(),
  });

  if (!response.ok) {
    return;
  }

  await checkDataStatusBody(response);
}

async function checkDataHealth() {
  const response = await checkStatus('service-token data health', '/api/admin/data/health', 200, {
    headers: healthHeaders(),
  });

  if (!response.ok) {
    return;
  }

  await checkDataStatusBody(response);
}

async function checkDataStatusBody(response) {
  const body = await response.json();

  if (!body.isDurable) {
    checks.push({
      name: 'durable data adapter',
      status: 'failed',
      detail: `adapter ${body.adapter ?? 'unknown'} is not durable`,
    });
  } else {
    checks.push({
      name: 'durable data adapter',
      status: 'passed',
      detail: body.adapter,
    });
  }

  if (expectedAdapter && body.adapter !== expectedAdapter) {
    checks.push({
      name: 'expected data adapter',
      status: 'failed',
      detail: `expected ${expectedAdapter}, received ${body.adapter ?? 'unknown'}`,
    });
  } else if (expectedAdapter) {
    checks.push({
      name: 'expected data adapter',
      status: 'passed',
      detail: expectedAdapter,
    });
  }

  if (body.backupRetention?.isWithinPolicy) {
    checks.push({
      name: 'backup retention policy',
      status: 'passed',
      detail: `${body.backupRetention.retainedBackups}/${body.backupRetention.maxRetainedBackups}`,
    });
  } else {
    checks.push({
      name: 'backup retention policy',
      status: 'failed',
      detail:
        body.backupRetention?.issues?.[0] ??
        'backup retention status missing from data status response',
    });
  }

  if (Array.isArray(body.issues) && body.issues.length > 0) {
    checks.push({
      name: 'data status issues',
      status: 'failed',
      detail: body.issues[0],
    });
  } else {
    checks.push({
      name: 'data status issues',
      status: 'passed',
      detail: 'none',
    });
  }

  if ('checkedAt' in body) {
    checkHealthFreshness(body.checkedAt);
  }
}

async function checkExpectedProviders(response) {
  if (expectedProviders.length === 0) {
    checks.push({
      name: 'expected auth providers',
      status: 'skipped',
      detail: 'Set SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS to verify OAuth provider discovery.',
    });
    return;
  }

  if (!response.ok) {
    return;
  }

  const body = await response.json();
  const providerIds = Object.keys(body);
  const missing = expectedProviders.filter(
    (provider) => !providerIds.includes(provider),
  );

  if (missing.length === 0) {
    checks.push({
      name: 'expected auth providers',
      status: 'passed',
      detail: expectedProviders.join(', '),
    });
    return;
  }

  checks.push({
    name: 'expected auth providers',
    status: 'failed',
    detail: `missing ${missing.join(', ')}`,
  });
}

function checkHealthFreshness(checkedAt) {
  const timestamp = Date.parse(checkedAt);

  if (!Number.isFinite(timestamp)) {
    checks.push({
      name: 'data health freshness',
      status: 'failed',
      detail: 'checkedAt is not a valid timestamp',
    });
    return;
  }

  const ageMinutes = Math.round((Date.now() - timestamp) / 60000);

  if (ageMinutes <= maxHealthAgeMinutes) {
    checks.push({
      name: 'data health freshness',
      status: 'passed',
      detail: `${ageMinutes}m old`,
    });
    return;
  }

  checks.push({
    name: 'data health freshness',
    status: 'failed',
    detail: `${ageMinutes}m old; expected <= ${maxHealthAgeMinutes}m`,
  });
}

async function request(pathname, init = {}) {
  const attempts = Math.max(1, requestRetries + 1);
  let lastError = '';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(`${baseUrl}${pathname}`, {
        redirect: 'manual',
        ...init,
        signal: controller.signal,
      });
      response.durationMs = Date.now() - startedAt;
      response.attempts = attempt;
      return response;
    } catch (error) {
      lastError =
        error?.name === 'AbortError'
          ? `request timed out after ${requestTimeoutMs}ms`
          : `request failed: ${error?.message ?? 'unknown error'}`;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: false,
    status: 0,
    durationMs: 0,
    attempts,
    error:
      attempts > 1
        ? `${lastError} after ${attempts} attempts`
        : lastError,
    json: async () => ({}),
  };
}

function responseDetail(response) {
  const duration = Number.isFinite(response.durationMs)
    ? ` in ${response.durationMs}ms`
    : '';
  const attempts = response.attempts > 1 ? ` after ${response.attempts} attempts` : '';

  return `${response.status}${duration}${attempts}`;
}

function checkLatency(name, response) {
  if (!maxLatencyMs || !Number.isFinite(response.durationMs)) {
    return;
  }

  if (response.durationMs <= maxLatencyMs) {
    return;
  }

  checks.push({
    name: `${name} latency`,
    status: 'failed',
    detail: `${response.durationMs}ms exceeded ${maxLatencyMs}ms`,
  });
}

function staffHeaders() {
  return {
    Cookie: staffCookie,
  };
}

function healthHeaders() {
  return {
    Authorization: `Bearer ${healthToken}`,
  };
}

function splitList(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function fail(message) {
  console.error(`FAIL production smoke setup - ${message}`);
  process.exit(1);
}
