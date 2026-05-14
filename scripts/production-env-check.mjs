#!/usr/bin/env node

import { loadEnvFileFromArgs } from './env-file.mjs';

loadEnvFileFromArgs(process.argv.slice(2));

const outputJson = process.argv.includes('--json');

const checks = [
  requireProductionUrl(
    'NEXTAUTH_URL',
    'Auth.js needs the canonical production URL.',
  ),
  requireSecret(
    'NEXTAUTH_SECRET',
    32,
    'Auth.js needs a strong session-signing secret.',
  ),
  requireList(
    'SCHOLARSCOUT_STAFF_EMAILS',
    'At least one staff email should be allowlisted before admin launch.',
  ),
  requireSecret(
    'SCHOLARSCOUT_HEALTH_TOKEN',
    16,
    'Scheduled monitoring needs the bearer-token data health endpoint.',
  ),
  ...oauthProviderChecks(),
  ...dataAdapterChecks(),
  ...monitoringChecks(),
];

const failures = checks.filter((check) => check.status === 'fail');
const warnings = checks.filter((check) => check.status === 'warn');

const summary = {
  passed: checks.length - failures.length - warnings.length,
  warnings: warnings.length,
  failures: failures.length,
};

if (outputJson) {
  console.log(JSON.stringify({ summary, checks }, null, 2));
} else {
  checks.forEach((check) => {
    console.log(
      `${check.status.toUpperCase()} ${check.name} - ${check.detail}`,
    );
  });

  console.log(
    `Summary: ${summary.passed} passed, ${summary.warnings} warnings, ${summary.failures} failures.`,
  );
}

if (failures.length > 0) {
  process.exitCode = 1;
}

function oauthProviderChecks() {
  const expectedProviders = splitList(
    process.env.SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS,
  );
  const providers = [
    {
      name: 'Google OAuth',
      providerId: 'google',
      id: 'GOOGLE_CLIENT_ID',
      secret: 'GOOGLE_CLIENT_SECRET',
    },
    {
      name: 'GitHub OAuth',
      providerId: 'github',
      id: 'GITHUB_CLIENT_ID',
      secret: 'GITHUB_CLIENT_SECRET',
    },
  ];
  const results = providers.map((provider) => {
    const hasId = hasValue(provider.id);
    const hasSecret = hasValue(provider.secret);
    const expected =
      expectedProviders.length === 0 ||
      expectedProviders.includes(provider.providerId);

    if (hasId && hasSecret) {
      return pass(provider.name, `${provider.id} and ${provider.secret} are set.`);
    }

    if (!expected && !hasId && !hasSecret) {
      return pass(
        provider.name,
        `${provider.providerId} is not expected for this launch and will remain disabled.`,
      );
    }

    if (!hasId && !hasSecret) {
      if (expectedProviders.length > 0) {
        return fail(
          provider.name,
          `${provider.id} and ${provider.secret} are required because ${provider.providerId} is listed in SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS.`,
        );
      }

      return warn(provider.name, `${provider.id} and ${provider.secret} are not set; this provider will be disabled.`);
    }

    return fail(
      provider.name,
      `${provider.id} and ${provider.secret} must be configured together.`,
    );
  });

  if (
    results.every((result) => result.status === 'warn') &&
    !truthy(process.env.SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION)
  ) {
    results.push(
      fail(
        'Production OAuth coverage',
        'Configure Google or GitHub OAuth, or set SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION=true intentionally.',
      ),
    );
  } else if (results.every((result) => result.status === 'warn')) {
    results.push(
      warn(
        'Production OAuth coverage',
        'Credentials-only production sign-in was explicitly allowed.',
      ),
    );
  } else {
    results.push(pass('Production OAuth coverage', 'At least one OAuth provider is configured.'));
  }

  return results;
}

function splitList(value) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function dataAdapterChecks() {
  const adapter = process.env.SCHOLARSCOUT_DATA_ADAPTER ?? 'json';

  if (adapter === 'vercel-blob') {
    return [
      pass('Data adapter', 'Vercel Blob is selected.'),
      requireSecretEither(
        ['SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN', 'BLOB_READ_WRITE_TOKEN'],
        16,
        'Vercel Blob needs a read-write token.',
      ),
      optionalValue(
        'SCHOLARSCOUT_BLOB_DATA_PATH',
        'Default blob path scholarscout/data.json will be used.',
      ),
    ];
  }

  if (adapter === 'http') {
    return [
      pass('Data adapter', 'HTTP service adapter is selected.'),
      requireUrl(
        'SCHOLARSCOUT_DATA_SERVICE_URL',
        'HTTP adapter needs a production service URL.',
      ),
      optionalSecret(
        'SCHOLARSCOUT_DATA_SERVICE_TOKEN',
        12,
        'HTTP adapter will run without bearer-token protection unless the service requires another trust boundary.',
      ),
    ];
  }

  if (adapter === 'json') {
    return [
      fail(
        'Data adapter',
        'JSON storage is for local development; set SCHOLARSCOUT_DATA_ADAPTER=vercel-blob or http for production.',
      ),
    ];
  }

  return [fail('Data adapter', `Unsupported adapter "${adapter}".`)];
}

function monitoringChecks() {
  return [
    optionalUrl(
      'SCHOLARSCOUT_SMOKE_BASE_URL',
      'Scheduled smoke checks can fall back to NEXTAUTH_URL when run in deployment context.',
    ),
    optionalValue(
      'SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER',
      'Smoke checks will skip expected-adapter verification.',
    ),
  ];
}

function requireUrl(name, detail) {
  if (!hasValue(name)) {
    return fail(name, detail);
  }

  return isHttpUrl(process.env[name])
    ? pass(name, 'Set to an HTTP(S) URL.')
    : fail(name, 'Must be an HTTP(S) URL.');
}

function requireProductionUrl(name, detail) {
  if (!hasValue(name)) {
    return fail(name, detail);
  }

  const value = process.env[name];

  if (!isHttpUrl(value)) {
    return fail(name, 'Must be an HTTP(S) URL.');
  }

  const url = new URL(value);

  if (url.protocol !== 'https:' && !isLocalHost(url.hostname)) {
    return fail(name, 'Production URLs should use HTTPS unless they are localhost.');
  }

  if (url.protocol === 'http:' && isLocalHost(url.hostname)) {
    return pass(name, 'Set to a local HTTP URL for rehearsal.');
  }

  return pass(name, 'Set to an HTTPS production URL.');
}

function optionalUrl(name, detail) {
  if (!hasValue(name)) {
    return warn(name, detail);
  }

  return isHttpUrl(process.env[name])
    ? pass(name, 'Set to an HTTP(S) URL.')
    : fail(name, 'Must be an HTTP(S) URL when provided.');
}

function requireSecret(name, minimumLength, detail) {
  if (!hasValue(name)) {
    return fail(name, detail);
  }

  return process.env[name].trim().length >= minimumLength
    ? pass(name, 'Set and long enough for production use.')
    : fail(name, `Should be at least ${minimumLength} characters.`);
}

function requireSecretEither(names, minimumLength, detail) {
  const configured = names.find((name) => hasValue(name));

  if (!configured) {
    return fail(names.join(' or '), detail);
  }

  return process.env[configured].trim().length >= minimumLength
    ? pass(names.join(' or '), `${configured} is set and long enough for production use.`)
    : fail(configured, `Should be at least ${minimumLength} characters.`);
}

function optionalSecret(name, minimumLength, detail) {
  if (!hasValue(name)) {
    return warn(name, detail);
  }

  return process.env[name].trim().length >= minimumLength
    ? pass(name, 'Set and long enough for production use.')
    : fail(name, `Should be at least ${minimumLength} characters when provided.`);
}

function requireList(name, detail) {
  if (!hasValue(name)) {
    return fail(name, detail);
  }

  return splitList(process.env[name]).length > 0
    ? pass(name, 'Contains at least one entry.')
    : fail(name, detail);
}

function optionalValue(name, detail) {
  return hasValue(name) ? pass(name, 'Set.') : warn(name, detail);
}

function hasValue(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim() !== '';
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function truthy(value) {
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
}

function pass(name, detail) {
  return { name, detail, status: 'pass' };
}

function warn(name, detail) {
  return { name, detail, status: 'warn' };
}

function fail(name, detail) {
  return { name, detail, status: 'fail' };
}
