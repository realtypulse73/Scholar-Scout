const BYPASS_ENV = 'SCHOLARSCOUT_VERCEL_BYPASS';

/**
 * Validates the independent deployment attestation before any Preview traffic.
 */
export function validatePreviewDeployment(attestation, candidateCommit) {
  if (
    !attestation ||
    attestation.environment !== 'preview' ||
    typeof candidateCommit !== 'string' ||
    candidateCommit.length === 0 ||
    attestation.commit !== candidateCommit ||
    typeof attestation.url !== 'string'
  ) {
    throw new Error('Preview tracer requires an independently attested Preview candidate.');
  }

  let target;
  try {
    target = new URL(attestation.url);
  } catch {
    throw new Error('Preview tracer requires a valid HTTPS Preview URL.');
  }
  if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) {
    throw new Error('Preview tracer requires a clean HTTPS Preview URL.');
  }
  return target.toString().replace(/\/$/, '');
}

/**
 * Returns transient browser/context transport; it never logs or persists the secret.
 */
export function createProtectedPreviewContextOptions({ attestation, candidateCommit, env = process.env }) {
  const baseURL = validatePreviewDeployment(attestation, candidateCommit);
  const bypass = normalizeRunnerHeaderValue(env[BYPASS_ENV]);
  if (!bypass) {
    throw new Error('Preview tracer requires runner-only protection material.');
  }
  return {
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
  };
}

/**
 * Server-side lifecycle requests authenticate directly. They must not request
 * the browser bypass cookie because Vercel responds to that request with a
 * redirect, which the lifecycle transport intentionally rejects.
 */
export function createLifecycleProtectionHeaders(headers) {
  const { 'x-vercel-set-bypass-cookie': _cookieHeader, ...lifecycleHeaders } = headers;
  return lifecycleHeaders;
}

/**
 * GitHub and provider secret CLIs can preserve a final line ending when a
 * runner-only header value is copied from a handoff file. Normalize that
 * boundary whitespace before use, without ever exposing the value.
 */
function normalizeRunnerHeaderValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
