import 'server-only';

import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitWindow {
  seconds: number;
  duration: '1 d' | '15 m' | '1 h';
  algorithm: 'fixed' | 'sliding';
}

export interface AtomicReservationResponse {
  allowed: boolean;
  resetAt: Date;
  retryAfterSeconds: number;
}

/**
 * External atomic counter boundary. Implementations must reserve before callers
 * perform any credential derivation, context lookup, or provider call.
 */
export interface AtomicReservationLimiter {
  reserve(
    key: string,
    limit: number,
    window: RateLimitWindow,
  ): Promise<AtomicReservationResponse>;
}

export type RateLimitReservation =
  | {
      status: 'allowed';
      allowed: true;
      resetAt: Date;
      retryAfterSeconds: 0;
    }
  | {
      status: 'denied';
      allowed: false;
      resetAt: Date;
      retryAfterSeconds: number;
    }
  | {
      status: 'unavailable';
      allowed: false;
      resetAt: null;
      retryAfterSeconds: null;
    };

interface RateLimitPolicy {
  limit: number;
  prefix: string;
  window: RateLimitWindow;
}

export const ADVISOR_GUEST_POLICY: RateLimitPolicy = {
  limit: 10,
  prefix: 'advisor-guest',
  window: { seconds: 86_400, duration: '1 d', algorithm: 'fixed' },
};

export const ADVISOR_ACCOUNT_POLICY: RateLimitPolicy = {
  limit: 25,
  prefix: 'advisor-account',
  window: { seconds: 86_400, duration: '1 d', algorithm: 'fixed' },
};

export const SIGN_IN_POLICY: RateLimitPolicy = {
  limit: 5,
  prefix: 'sign-in',
  window: { seconds: 900, duration: '15 m', algorithm: 'fixed' },
};

export const REGISTRATION_POLICY: RateLimitPolicy = {
  limit: 5,
  prefix: 'registration',
  window: { seconds: 3_600, duration: '1 h', algorithm: 'fixed' },
};

export const COMMUNITY_SUBMISSION_POLICY: RateLimitPolicy = {
  limit: 5,
  prefix: 'community-submission',
  window: { seconds: 3_600, duration: '1 h', algorithm: 'sliding' },
};

const PROVIDER_KEY_PREFIX = 'scholar-scout:rate-limit';

class UpstashAtomicReservationLimiter implements AtomicReservationLimiter {
  private readonly limiters = new Map<string, Ratelimit>();

  constructor(private readonly redis: Redis) {}

  async reserve(
    key: string,
    limit: number,
    window: RateLimitWindow,
  ): Promise<AtomicReservationResponse> {
    const response = await this.getLimiter(limit, window).limit(key);
    const resetAt = new Date(response.reset);

    return {
      allowed: response.success,
      resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((resetAt.getTime() - Date.now()) / 1_000),
      ),
    };
  }

  private getLimiter(limit: number, window: RateLimitWindow): Ratelimit {
    const limiterKey = createLimiterCacheKey(limit, window);
    const existing = this.limiters.get(limiterKey);

    if (existing) {
      return existing;
    }

    const limiter = new Ratelimit({
      redis: this.redis,
      limiter: window.algorithm === 'sliding'
        ? Ratelimit.slidingWindow(limit, window.duration)
        : Ratelimit.fixedWindow(limit, window.duration),
      prefix: PROVIDER_KEY_PREFIX,
      ephemeralCache: false,
      timeout: 0,
    });
    this.limiters.set(limiterKey, limiter);
    return limiter;
  }
}

export interface RateLimitService {
  reserveAdvisorGuest(guestId: string): Promise<RateLimitReservation>;
  reserveAdvisorAccount(
    accountId: string,
    options?: { guestWindowId?: string },
  ): Promise<RateLimitReservation>;
  reserveSignInAttempt(input: {
    email: string;
    ip: string;
  }): Promise<RateLimitReservation>;
  reserveRegistration(ip: string): Promise<RateLimitReservation>;
  reserveCommunitySubmission(accountId: string): Promise<RateLimitReservation>;
}

export function createRateLimitService(options: {
  limiter?: AtomicReservationLimiter | null;
  now?: () => Date;
}): RateLimitService {
  const now = options.now ?? (() => new Date());

  return {
    reserveAdvisorGuest(guestId) {
      return reserve(options.limiter, ADVISOR_GUEST_POLICY, guestId, now);
    },
    reserveAdvisorAccount(accountId, accountOptions) {
      const guestWindowId = normalizeIdentity(accountOptions?.guestWindowId);

      if (guestWindowId) {
        return reserve(options.limiter, ADVISOR_GUEST_POLICY, guestWindowId, now);
      }

      return reserve(options.limiter, ADVISOR_ACCOUNT_POLICY, accountId, now);
    },
    reserveSignInAttempt({ email, ip }) {
      const normalizedEmail = normalizeIdentity(email)?.toLowerCase();
      const normalizedIp = normalizeIdentity(ip);
      const identity = normalizedEmail && normalizedIp ? `${normalizedEmail}:${normalizedIp}` : '';

      return reserve(options.limiter, SIGN_IN_POLICY, identity, now);
    },
    reserveRegistration(ip) {
      return reserve(options.limiter, REGISTRATION_POLICY, ip, now);
    },
    reserveCommunitySubmission(accountId) {
      return reserve(options.limiter, COMMUNITY_SUBMISSION_POLICY, accountId, now);
    },
  };
}

let activeLimiter: AtomicReservationLimiter | null | undefined;

function getRateLimitService(): RateLimitService {
  return createRateLimitService({ limiter: getAtomicReservationLimiter() });
}

export function reserveAdvisorGuest(guestId: string): Promise<RateLimitReservation> {
  return getRateLimitService().reserveAdvisorGuest(guestId);
}

export function reserveAdvisorAccount(
  accountId: string,
  options?: { guestWindowId?: string },
): Promise<RateLimitReservation> {
  return getRateLimitService().reserveAdvisorAccount(accountId, options);
}

export function reserveSignInAttempt(input: {
  email: string;
  ip: string;
}): Promise<RateLimitReservation> {
  return getRateLimitService().reserveSignInAttempt(input);
}

export function reserveRegistration(ip: string): Promise<RateLimitReservation> {
  return getRateLimitService().reserveRegistration(ip);
}

export function createLimiterCacheKey(limit: number, window: RateLimitWindow): string {
  return `${limit}:${window.duration}:${window.algorithm}`;
}

export function reserveCommunitySubmission(accountId: string): Promise<RateLimitReservation> {
  return getRateLimitService().reserveCommunitySubmission(accountId);
}

export function setAtomicReservationLimiterForTests(
  limiter: AtomicReservationLimiter | null,
): void {
  activeLimiter = limiter;
}

function getAtomicReservationLimiter(): AtomicReservationLimiter | null {
  if (activeLimiter !== undefined) {
    return activeLimiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN?.trim();

  if (!url || !token) {
    activeLimiter = null;
    return activeLimiter;
  }

  activeLimiter = new UpstashAtomicReservationLimiter(new Redis({ url, token }));
  return activeLimiter;
}

async function reserve(
  limiter: AtomicReservationLimiter | null | undefined,
  policy: RateLimitPolicy,
  identity: string,
  now: () => Date,
): Promise<RateLimitReservation> {
  const normalizedIdentity = normalizeIdentity(identity);

  if (!limiter || !normalizedIdentity) {
    return unavailableReservation();
  }

  try {
    const response = await limiter.reserve(
      createProviderKey(policy.prefix, normalizedIdentity),
      policy.limit,
      policy.window,
    );

    if (response.allowed) {
      return {
        status: 'allowed',
        allowed: true,
        resetAt: response.resetAt,
        retryAfterSeconds: 0,
      };
    }

    return {
      status: 'denied',
      allowed: false,
      resetAt: response.resetAt,
      retryAfterSeconds: Math.max(
        1,
        response.retryAfterSeconds,
        Math.ceil((response.resetAt.getTime() - now().getTime()) / 1_000),
      ),
    };
  } catch {
    return unavailableReservation();
  }
}

function createProviderKey(prefix: string, identity: string): string {
  const digest = createHash('sha256').update(identity).digest('hex');
  return `${PROVIDER_KEY_PREFIX}:${prefix}:${digest}`;
}

function normalizeIdentity(identity: string | undefined): string | null {
  const value = identity?.trim();
  return value ? value : null;
}

function unavailableReservation(): RateLimitReservation {
  return {
    status: 'unavailable',
    allowed: false,
    resetAt: null,
    retryAfterSeconds: null,
  };
}
