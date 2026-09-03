jest.mock('@upstash/redis', () => ({
  Redis: class Redis {},
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class Ratelimit {
    static fixedWindow = jest.fn();
    static slidingWindow = jest.fn();
    static limit = jest.fn();
    static options: unknown[] = [];

    constructor(options: unknown) {
      Ratelimit.options.push(options);
    }

    limit = Ratelimit.limit;
  },
}));

import type { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  COMMUNITY_SUBMISSION_POLICY,
  createLimiterCacheKey,
  createRateLimitService,
  createUpstashAtomicReservationLimiter,
  isPreviewCommunityOutageEnabled,
  REGISTRATION_POLICY,
  reserveCommunitySubmission,
  reserveSignInAttempt,
  setAtomicReservationLimiterForTests,
  type AtomicReservationLimiter,
  type RateLimitWindow,
} from '@/lib/server/rate-limit';

const MockedRatelimit = Ratelimit as unknown as {
  fixedWindow: jest.Mock;
  slidingWindow: jest.Mock;
  limit: jest.Mock;
  options: unknown[];
};

class InMemoryAtomicReservationLimiter implements AtomicReservationLimiter {
  private readonly reservations = new Map<string, { count: number; resetAt: Date }>();

  constructor(private readonly now: () => Date) {}

  async reserve(key: string, limit: number, window: RateLimitWindow) {
    const now = this.now();
    const existing = this.reservations.get(key);
    const resetAt = getWindowReset(now, window.seconds);
    const active = existing && existing.resetAt > now ? existing : { count: 0, resetAt };
    active.count += 1;
    this.reservations.set(key, active);

    return {
      allowed: active.count <= limit,
      resetAt: active.resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((active.resetAt.getTime() - now.getTime()) / 1_000),
      ),
    };
  }
}

function getWindowReset(now: Date, seconds: number): Date {
  const windowMilliseconds = seconds * 1_000;
  return new Date(Math.floor(now.getTime() / windowMilliseconds + 1) * windowMilliseconds);
}

describe('rate-limit policies', () => {
  let now: Date;
  let limiter: InMemoryAtomicReservationLimiter;

  beforeEach(() => {
    now = new Date('2026-07-27T13:00:00.000Z');
    limiter = new InMemoryAtomicReservationLimiter(() => now);
    MockedRatelimit.fixedWindow.mockReset();
    MockedRatelimit.slidingWindow.mockReset();
    MockedRatelimit.limit.mockReset();
    MockedRatelimit.options.length = 0;
  });

  it('allows ten guest advisor reservations per UTC day and denies the eleventh', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    for (let index = 0; index < 10; index += 1) {
      await expect(service.reserveAdvisorGuest('guest-1')).resolves.toMatchObject({
        status: 'allowed',
        retryAfterSeconds: 0,
      });
    }

    await expect(service.reserveAdvisorGuest('guest-1')).resolves.toMatchObject({
      status: 'denied',
      allowed: false,
      resetAt: new Date('2026-07-28T00:00:00.000Z'),
      retryAfterSeconds: 39_600,
    });
  });

  it('allows twenty-five account advisor reservations per UTC day and denies the twenty-sixth', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    for (let index = 0; index < 25; index += 1) {
      await expect(service.reserveAdvisorAccount('account-1')).resolves.toMatchObject({
        status: 'allowed',
      });
    }

    await expect(service.reserveAdvisorAccount('account-1')).resolves.toMatchObject({
      status: 'denied',
      retryAfterSeconds: 39_600,
    });
  });

  it('keeps a migrated guest advisor binding through its current UTC-day reset', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    for (let index = 0; index < 10; index += 1) {
      await service.reserveAdvisorGuest('guest-1');
    }

    await expect(
      service.reserveAdvisorAccount('account-1', { guestWindowId: 'guest-1' }),
    ).resolves.toMatchObject({
      status: 'denied',
      resetAt: new Date('2026-07-28T00:00:00.000Z'),
    });

    now = new Date('2026-07-28T00:00:00.000Z');

    await expect(
      service.reserveAdvisorAccount('account-1', { guestWindowId: 'guest-1' }),
    ).resolves.toMatchObject({ status: 'allowed' });
  });

  it('limits sign-in attempts by the combined normalized email and trusted IP', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    for (let index = 0; index < 5; index += 1) {
      await expect(
        service.reserveSignInAttempt({
          email: 'Student@Example.org',
          ip: '203.0.113.10',
        }),
      ).resolves.toMatchObject({ status: 'allowed' });
    }

    await expect(
      service.reserveSignInAttempt({
        email: 'student@example.org',
        ip: '203.0.113.10',
      }),
    ).resolves.toMatchObject({
      status: 'denied',
      retryAfterSeconds: 900,
    });
  });

  it('limits registrations by trusted IP for one hour', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    for (let index = 0; index < 5; index += 1) {
      await service.reserveRegistration('203.0.113.10');
    }

    await expect(service.reserveRegistration('203.0.113.10')).resolves.toMatchObject({
      status: 'denied',
      retryAfterSeconds: 3_600,
    });
  });

  it('uses a rolling one-hour community policy and denies the sixth shared reservation', async () => {
    const service = createRateLimitService({ limiter, now: () => now });

    expect(COMMUNITY_SUBMISSION_POLICY).toMatchObject({
      limit: 5,
      window: { seconds: 3_600, duration: '1 h', algorithm: 'sliding' },
    });

    for (let index = 0; index < 5; index += 1) {
      await expect(service.reserveCommunitySubmission('student-1')).resolves.toMatchObject({
        status: 'allowed',
      });
    }

    await expect(service.reserveCommunitySubmission('student-1')).resolves.toMatchObject({
      status: 'denied',
      allowed: false,
    });
  });

  it('keeps the rolling community limiter separate from fixed-window caches at a boundary', async () => {
    const observedWindows: RateLimitWindow[] = [];
    const rollingLimiter: AtomicReservationLimiter = {
      reserve: async (_key, _limit, window) => {
        observedWindows.push(window);
        return {
          allowed: true,
          resetAt: new Date('2026-07-27T14:00:00.000Z'),
          retryAfterSeconds: 1,
        };
      },
    };
    const service = createRateLimitService({ limiter: rollingLimiter, now: () => now });

    now = new Date('2026-07-27T13:59:59.000Z');
    await service.reserveCommunitySubmission('student-1');
    now = new Date('2026-07-27T14:00:01.000Z');
    await service.reserveCommunitySubmission('student-1');

    expect(observedWindows).toEqual([
      COMMUNITY_SUBMISSION_POLICY.window,
      COMMUNITY_SUBMISSION_POLICY.window,
    ]);
    expect(createLimiterCacheKey(5, COMMUNITY_SUBMISSION_POLICY.window)).toBe('5:1 h:sliding');
    expect(createLimiterCacheKey(5, REGISTRATION_POLICY.window)).toBe('5:1 h:fixed');
  });

  it('constructs the production community limiter with Upstash slidingWindow', async () => {
    const slidingWindow = { algorithm: 'sliding-window' };
    MockedRatelimit.slidingWindow.mockReturnValue(slidingWindow);
    MockedRatelimit.limit.mockResolvedValue({
      success: true,
      reset: new Date('2026-07-27T14:00:00.000Z').getTime(),
    });
    const productionLimiter = createUpstashAtomicReservationLimiter({} as Redis);

    await expect(
      productionLimiter.reserve('student-1', COMMUNITY_SUBMISSION_POLICY.limit, COMMUNITY_SUBMISSION_POLICY.window),
    ).resolves.toMatchObject({ allowed: true });

    expect(MockedRatelimit.slidingWindow).toHaveBeenCalledWith(5, '1 h');
    expect(MockedRatelimit.fixedWindow).not.toHaveBeenCalled();
    expect(MockedRatelimit.options).toEqual([
      expect.objectContaining({ limiter: slidingWindow, prefix: 'scholar-scout:rate-limit' }),
    ]);
  });

  it('fails closed when the external limiter cannot reserve a key', async () => {
    const unavailableLimiter: AtomicReservationLimiter = {
      reserve: jest.fn(async () => {
        throw new Error('Redis is unavailable');
      }),
    };
    const service = createRateLimitService({ limiter: unavailableLimiter, now: () => now });

    await expect(service.reserveAdvisorGuest('guest-1')).resolves.toEqual({
      status: 'unavailable',
      allowed: false,
      resetAt: null,
      retryAfterSeconds: null,
    });
  });

  it('fails closed when no atomic limiter is configured', async () => {
    const service = createRateLimitService({ limiter: null, now: () => now });

    await expect(service.reserveRegistration('203.0.113.10')).resolves.toEqual({
      status: 'unavailable',
      allowed: false,
      resetAt: null,
      retryAfterSeconds: null,
    });
  });

  it('enables the outage harness only for an explicit Vercel Preview deployment', () => {
    expect(isPreviewCommunityOutageEnabled({
      VERCEL_ENV: 'preview',
      SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE: '1',
    })).toBe(true);
    expect(isPreviewCommunityOutageEnabled({
      VERCEL_ENV: 'production',
      SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE: '1',
    })).toBe(false);
    expect(isPreviewCommunityOutageEnabled({
      VERCEL_ENV: 'preview',
      SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE: '0',
    })).toBe(false);
  });

  it('fails only community submissions closed in Preview without consuming the provider or blocking sign-in', async () => {
    const originalVercelEnv = process.env.VERCEL_ENV;
    const originalOutageFlag = process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE;
    const limiter: AtomicReservationLimiter = {
      reserve: jest.fn(async () => ({
        allowed: true,
        resetAt: new Date('2026-07-27T14:00:00.000Z'),
        retryAfterSeconds: 1,
      })),
    };

    process.env.VERCEL_ENV = 'preview';
    process.env.SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE = '1';
    setAtomicReservationLimiterForTests(limiter);

    try {
      await expect(reserveCommunitySubmission('student-1')).resolves.toEqual({
        status: 'unavailable',
        allowed: false,
        resetAt: null,
        retryAfterSeconds: null,
      });
      expect(limiter.reserve).not.toHaveBeenCalled();

      await expect(reserveSignInAttempt({
        email: 'student@example.org',
        ip: '203.0.113.10',
      })).resolves.toMatchObject({ status: 'allowed' });
      expect(limiter.reserve).toHaveBeenCalledTimes(1);
    } finally {
      setAtomicReservationLimiterForTests(null);
      restoreEnvironmentVariable('VERCEL_ENV', originalVercelEnv);
      restoreEnvironmentVariable(
        'SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE',
        originalOutageFlag,
      );
    }
  });
});

function restoreEnvironmentVariable(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
