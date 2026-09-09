const PROTOCOL = 'lifecycle-v1';

export async function runFixtureLifecycle({ request, run, onCleanupReady }) {
  let cleanupStarted = false;
  const lifecycleRequest = async (method) => {
    const response = await request(method, { body: undefined });
    if (!response?.ok) {
      throw new Error(`E2E fixture ${method} lifecycle request was denied.`);
    }
    return response;
  };
  const cleanup = async () => {
    if (cleanupStarted) return;
    cleanupStarted = true;
    await lifecycleRequest('DELETE');
  };
  onCleanupReady?.(cleanup);
  try {
    await lifecycleRequest('POST');
    await lifecycleRequest('GET');
    return await run();
  } finally {
    await cleanup();
  }
}

export function createLifecycleRequest(baseUrl, capability) {
  const endpoint = new URL('/api/internal/e2e-fixture', baseUrl);
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.search ||
    endpoint.hash ||
    typeof capability !== 'string' ||
    capability.length === 0
  ) {
    throw new Error('E2E fixture lifecycle requires an HTTPS URL and runner capability.');
  }

  return async (method) => fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${capability}`,
      'x-scholarscout-e2e-fixture-protocol': PROTOCOL,
    },
  });
}
