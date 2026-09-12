const PROTOCOL = 'lifecycle-v1';

const METHOD_STAGES = {
  POST: 'provision',
  GET: 'verification',
  DELETE: 'cleanup',
};

export class FixtureLifecycleError extends Error {
  constructor(stage, responseClass) {
    super(`E2E fixture ${stage} lifecycle request failed.`);
    this.name = 'FixtureLifecycleError';
    this.stage = stage;
    this.responseClass = responseClass;
  }
}

/**
 * Maps fixture lifecycle faults to the only categories permitted in releasable records.
 */
export function classifyFixtureLifecycleFailure(error) {
  if (!(error instanceof FixtureLifecycleError)) {
    return 'fixture-lifecycle-transport-failed';
  }

  if (error.responseClass) {
    return `fixture-${error.stage}-${error.responseClass}`;
  }

  return {
    provision: 'fixture-provision-failed',
    verification: 'fixture-verification-failed',
    cleanup: 'fixture-cleanup-failed',
    transport: 'fixture-lifecycle-transport-failed',
  }[error.stage] ?? 'fixture-lifecycle-transport-failed';
}

function classifyLifecycleResponse(response) {
  const denial = response?.headers?.get?.('x-scholarscout-e2e-fixture-denial');
  if (['not-enabled', 'body-present', 'content-length', 'content-metadata', 'browser-metadata'].includes(denial)) {
    return denial;
  }

  const status = response?.status;
  if (status >= 300 && status < 400) return 'redirected';
  if (status >= 400 && status < 500) return 'rejected';
  if (status >= 500 && status < 600) return 'server-failed';
  return undefined;
}

export async function runFixtureLifecycle({ request, run, onCleanupReady }) {
  let cleanupStarted = false;
  const lifecycleRequest = async (method) => {
    const stage = METHOD_STAGES[method] ?? 'transport';
    let response;
    try {
      response = await request(method, { body: undefined });
    } catch {
      throw new FixtureLifecycleError('transport');
    }
    if (!response?.ok) {
      throw new FixtureLifecycleError(stage, classifyLifecycleResponse(response));
    }
    return response;
  };
  const cleanup = async () => {
    if (cleanupStarted) return;
    cleanupStarted = true;
    await lifecycleRequest('DELETE');
  };
  onCleanupReady?.(cleanup);
  let lifecycleFailed = false;
  try {
    await lifecycleRequest('POST');
    await lifecycleRequest('GET');
    return await run();
  } catch (error) {
    lifecycleFailed = true;
    throw error;
  } finally {
    try {
      await cleanup();
    } catch (error) {
      if (!lifecycleFailed) throw error;
    }
  }
}

export function createLifecycleRequest(baseUrl, capability, protectionHeaders = {}) {
  const endpoint = new URL('/api/internal/e2e-fixture', baseUrl);
  const normalizedCapability = typeof capability === 'string' ? capability.trim() : '';
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.search ||
    endpoint.hash ||
    !normalizedCapability
  ) {
    throw new Error('E2E fixture lifecycle requires an HTTPS URL and runner capability.');
  }

  return async (method) => fetch(endpoint, {
    method,
    // A protected Preview must answer from the lifecycle endpoint directly.
    // Following a Vercel login redirect could otherwise make an unrelated 2xx
    // page look like a successful fixture lifecycle response.
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${normalizedCapability}`,
      'x-scholarscout-e2e-fixture-protocol': PROTOCOL,
      ...protectionHeaders,
    },
  });
}
