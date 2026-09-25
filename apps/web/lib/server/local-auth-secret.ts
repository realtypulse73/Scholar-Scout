import 'server-only';

import { randomBytes } from 'node:crypto';
import { isLocalDevelopmentAuthenticationEnvironment } from './request-ip';

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

const LOCAL_AUTH_SECRET_KEY = Symbol.for('scholar-scout.local-auth-secret');

/**
 * Uses configured credentials in every deployed environment. A random, process-local
 * secret exists only for plain `next dev` so a disposable local browser journey does
 * not require a tracked environment file.
 */
export function resolveNextAuthSecret(
  env: RuntimeEnvironment = process.env,
): string | undefined {
  const configuredSecret = env.NEXTAUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (!isLocalDevelopmentAuthenticationEnvironment(env)) {
    return undefined;
  }

  const processGlobal = globalThis as typeof globalThis & {
    [key: symbol]: unknown;
  };
  const existing = processGlobal[LOCAL_AUTH_SECRET_KEY];

  if (typeof existing === 'string' && existing) {
    return existing;
  }

  const generatedSecret = randomBytes(32).toString('base64url');
  processGlobal[LOCAL_AUTH_SECRET_KEY] = generatedSecret;
  return generatedSecret;
}
