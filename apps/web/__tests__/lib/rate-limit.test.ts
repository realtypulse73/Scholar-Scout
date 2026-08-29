jest.mock('@upstash/redis', () => ({
  Redis: class Redis {},
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class Ratelimit {},
}));

import {
  COMMUNITY_SUBMISSION_POLICY,
  createRateLimitService,
  type AtomicReservationLimiter,
  type RateLimitWindow,
} from '@/lib/server/rate-limit';

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
      window: { seconds: 3_600, duration: '1 h' },
      algorithm: 'sliding',
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
});
