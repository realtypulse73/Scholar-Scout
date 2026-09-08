const PROTOCOL = 'lifecycle-v1';

export async function runFixtureLifecycle({ request, run, onCleanupReady }) {
  let cleanupStarted = false;
  const lifecycleRequest = async (method) => request(method, { body: undefined });
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
  return async (method) => fetch(`${baseUrl}/api/internal/e2e-fixture`, {
    method,
    headers: {
      Authorization: `Bearer ${capability}`,
      'x-scholarscout-e2e-fixture-protocol': PROTOCOL,
    },
  });
}
