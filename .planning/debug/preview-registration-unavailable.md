---
status: fixing
trigger: "Preview local-account registration reports: Registration is temporarily unavailable. Please try again."
created: "2026-10-06T23:28:00-04:00"
updated: "2026-10-07T00:06:00-04:00"
---

# Preview Registration Unavailable

## Symptoms

- **Expected behavior:** A user can create a local Preview-only ScholarScout account.
- **Actual behavior:** The Preview sign-up form reports “Registration is temporarily unavailable. Please try again.”
- **Reproduction:** Submit valid local-account details on the `worktree-agent-phase10` Preview deployment.

## Current Focus

- hypothesis: Vercel's documented standard client-IP header is present while the companion Vercel header is absent on the Preview request.
- test: Permit the standard header only when Vercel marks the runtime, retain the companion header as first choice, and add focused tests for both paths.
- expecting: The route obtains a Vercel-controlled client identity and can reach the already-configured atomic rate limiter without accepting client-chosen forwarding headers outside Vercel.
- next_action: Run lint and typecheck, then deploy the header-boundary compatibility repair to Preview and repeat local account registration.

## Evidence

- timestamp: 2026-10-06T23:28:00-04:00; Vercel shows the new Upstash resource connected only to `scholar-scout-web` Preview and supplies `KV_REST_API_URL` plus `KV_REST_API_TOKEN` as sensitive Preview variables.
- timestamp: 2026-10-06T23:28:00-04:00; `apps/web/lib/server/rate-limit.ts` reads only `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`, so it configures no limiter and registration intentionally returns 503 before account creation.
- timestamp: 2026-10-06T23:41:00-04:00; the compatible reader now accepts Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` only as a fallback, while legacy prefixed values remain preferred and incomplete configuration still returns no limiter.
- timestamp: 2026-10-07T00:06:00-04:00; Vercel's current Request Headers documentation states that `x-forwarded-for` is overwritten with the public client IP and that `x-vercel-forwarded-for` is its companion header. The Preview environment confirms both Redis REST variables are present.
- timestamp: 2026-10-07T00:06:00-04:00; focused request-IP, registration, and rate-limit tests pass (37 tests) after adding a Vercel-only fallback for the standard overwritten header.

## Eliminated

- hypothesis: The newly provisioned Preview Redis database is unavailable.
  reason: Vercel reports the database Available and its connected-project list shows only Preview.

## Resolution

- root_cause: The first repair confirmed the managed Redis configuration, but Preview registration still returns 503 before account creation. The remaining guarded dependency is trusted client-IP resolution.
- fix: Added a Vercel-runtime-only fallback from the existing companion header to Vercel's documented overwritten standard client-IP header; non-Vercel forwarded headers remain rejected.
- verification: Focused request-IP, registration, and rate-limit tests (37 tests) pass. Lint, TypeScript, Preview deployment, and account-registration retest remain pending.
- files_changed: `apps/web/lib/server/request-ip.ts`, `apps/web/__tests__/lib/request-ip.test.ts`, and this record, in addition to the prior Redis compatibility fix.
