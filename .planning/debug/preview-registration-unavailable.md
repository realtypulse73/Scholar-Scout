---
status: fixing
trigger: "Preview local-account registration reports: Registration is temporarily unavailable. Please try again."
created: "2026-10-06T23:28:00-04:00"
updated: "2026-10-07T00:22:00-04:00"
---

# Preview Registration Unavailable

## Symptoms

- **Expected behavior:** A user can create a local Preview-only ScholarScout account.
- **Actual behavior:** The Preview sign-up form reports “Registration is temporarily unavailable. Please try again.”
- **Reproduction:** Submit valid local-account details on the `worktree-agent-phase10` Preview deployment.

## Current Focus

- hypothesis: After Redis credentials and both Vercel client-IP header forms are supported, the remaining Preview 503 must be isolated to one of those two guarded runtime dependencies.
- test: Emit only the stable internal failure category to Vercel Function logs, never an IP, email, account field, or secret.
- expecting: One failed Preview registration attempt identifies the exact remaining dependency so its repair is targeted rather than guessed.
- next_action: Deploy the bounded diagnostic, reproduce the failure once, inspect Vercel Function logs, then remove the diagnostic as part of the permanent fix.

## Evidence

- timestamp: 2026-10-06T23:28:00-04:00; Vercel shows the new Upstash resource connected only to `scholar-scout-web` Preview and supplies `KV_REST_API_URL` plus `KV_REST_API_TOKEN` as sensitive Preview variables.
- timestamp: 2026-10-06T23:28:00-04:00; `apps/web/lib/server/rate-limit.ts` reads only `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`, so it configures no limiter and registration intentionally returns 503 before account creation.
- timestamp: 2026-10-06T23:41:00-04:00; the compatible reader now accepts Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` only as a fallback, while legacy prefixed values remain preferred and incomplete configuration still returns no limiter.
- timestamp: 2026-10-07T00:06:00-04:00; Vercel's current Request Headers documentation states that `x-forwarded-for` is overwritten with the public client IP and that `x-vercel-forwarded-for` is its companion header. The Preview environment confirms both Redis REST variables are present.
- timestamp: 2026-10-07T00:06:00-04:00; focused request-IP, registration, and rate-limit tests pass (37 tests) after adding a Vercel-only fallback for the standard overwritten header.
- timestamp: 2026-10-07T00:22:00-04:00; Vercel dashboard confirms system environment variable access is enabled and Preview has `KV_REST_API_URL` plus `KV_REST_API_TOKEN`; the second Preview deployment still reproduces the generic 503.

## Eliminated

- hypothesis: The newly provisioned Preview Redis database is unavailable.
  reason: Vercel reports the database Available and its connected-project list shows only Preview.

## Resolution

- root_cause: Still under investigation. Configuration presence and both trusted-header compatibility paths are confirmed, but the deployed request still fails closed before account creation.
- fix: A temporary, non-sensitive Vercel Function log distinguishes only `trusted-ip-unavailable` from `rate-limit-unavailable`; it will be removed after the live cause is verified.
- verification: Focused request-IP, registration, and rate-limit tests (37 tests), lint, TypeScript, and `git diff --check` pass. Preview diagnostic deployment and one reproduced request remain pending.
- files_changed: `apps/web/app/api/register/route.ts` and this record, in addition to the prior Redis and request-IP compatibility fixes.
