const LIFECYCLE_PATH = '/api/internal/e2e-fixture';
const LIFECYCLE_PROTOCOL = 'lifecycle-v1';

/**
 * Runs the fixed server-owned fixture lifecycle. The browser command receives
 * neither the capability nor any fixture-selection input.
 */
export async function runFixtureLifecycle({ baseUrl, capability, request, run, onCleanup }) {
  let cleaned = false;
  const lifecycleRequest = (method) => request(method, LIFECYCLE_PATH, {
    body: undefined,
    headers: {
      authorization: `Bearer ${capability}`,
      'content-length': '0',
      'x-scholarscout-e2e-fixture-protocol': LIFECYCLE_PROTOCOL,
    },
  });

  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    const response = await lifecycleRequest('DELETE');
    if (!response?.ok || response.phase !== 'cleaned') {
      throw new Error('Fixture cleanup was not acknowledged.');
    }
  };
  onCleanup?.(cleanup);

  try {
    const created = await lifecycleRequest('POST');
    if (!created?.ok || created.phase !== 'verified') {
      throw new Error('Fixture creation was not verified.');
    }
    const verified = await lifecycleRequest('GET');
    if (!verified?.ok || verified.phase !== 'verified') {
      throw new Error('Fixture verification was not acknowledged.');
    }
    return await run();
  } finally {
    await cleanup();
  }
}

export { LIFECYCLE_PATH, LIFECYCLE_PROTOCOL };
