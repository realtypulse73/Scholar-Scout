---
status: fixing
trigger: "Preview local-account registration reports: Registration is temporarily unavailable. Please try again."
created: "2026-10-06T23:28:00-04:00"
updated: "2026-10-07T00:31:00-04:00"
---

# Preview Registration Unavailable

## Symptoms

- **Expected behavior:** A user can create a local Preview-only ScholarScout account.
- **Actual behavior:** The Preview sign-up form reports “Registration is temporarily unavailable. Please try again.”
- **Reproduction:** Submit valid local-account details on the `worktree-agent-phase10` Preview deployment.

## Current Focus

- hypothesis: The Vercel runtime has reached the atomic reservation call, so the remaining failure is an Upstash authentication, network, response, or unexpected provider error.
- test: Classify the caught provider error into one stable category in Vercel Function logs, never log the raw error, endpoint, token, IP, email, or account data.
- expecting: One failed Preview registration attempt identifies the specific provider-repair path.
- next_action: Deploy the bounded provider classifier, reproduce the failure once, inspect Vercel Function logs, then remove all temporary diagnostics as part of the permanent fix.

## Evidence

- timestamp: 2026-10-06T23:28:00-04:00; Vercel shows the new Upstash resource connected only to `scholar-scout-web` Preview and supplies `KV_REST_API_URL` plus `KV_REST_API_TOKEN` as sensitive Preview variables.
- timestamp: 2026-10-06T23:28:00-04:00; `apps/web/lib/server/rate-limit.ts` reads only `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`, so it configures no limiter and registration intentionally returns 503 before account creation.
- timestamp: 2026-10-06T23:41:00-04:00; the compatible reader now accepts Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` only as a fallback, while legacy prefixed values remain preferred and incomplete configuration still returns no limiter.
- timestamp: 2026-10-07T00:06:00-04:00; Vercel's current Request Headers documentation states that `x-forwarded-for` is overwritten with the public client IP and that `x-vercel-forwarded-for` is its companion header. The Preview environment confirms both Redis REST variables are present.
- timestamp: 2026-10-07T00:06:00-04:00; focused request-IP, registration, and rate-limit tests pass (37 tests) after adding a Vercel-only fallback for the standard overwritten header.
- timestamp: 2026-10-07T00:22:00-04:00; Vercel dashboard confirms system environment variable access is enabled and Preview has `KV_REST_API_URL` plus `KV_REST_API_TOKEN`; the second Preview deployment still reproduces the generic 503.
- timestamp: 2026-10-07T00:29:00-04:00; a reproduced Preview request reached rate limiting and emitted `rate-limit-unavailable`, ruling out trusted client-IP resolution.

## Eliminated

- hypothesis: The newly provisioned Preview Redis database is unavailable.
  reason: Vercel reports the database Available and its connected-project list shows only Preview.

## Resolution

- root_cause: The trusted-IP boundary is healthy. The external atomic reservation call fails despite the managed Preview variables being present.
- fix: The rate-limit boundary now emits a one-word, secret-free provider-failure classification to Vercel logs; all temporary diagnostics will be removed after repair.
- verification: The earlier focused checks pass; the provider-classifier test, lint, TypeScript, Preview deployment, and one reproduced request remain pending.
- files_changed: `apps/web/lib/server/rate-limit.ts`, `apps/web/__tests__/lib/rate-limit.test.ts`, and this record, in addition to prior fixes.
