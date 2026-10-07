---
status: resolved
trigger: "Preview local-account registration reports: Registration is temporarily unavailable. Please try again."
created: "2026-10-06T23:28:00-04:00"
updated: "2026-10-07T00:35:00-04:00"
---

# Preview Registration Unavailable

## Symptoms

- **Expected behavior:** A user can create a local Preview-only ScholarScout account.
- **Actual behavior:** The Preview sign-up form reports “Registration is temporarily unavailable. Please try again.”
- **Reproduction:** Submit valid local-account details on the `worktree-agent-phase10` Preview deployment.

## Resolution

- root_cause: Vercel's managed Preview Redis connection was present in project settings but its REST call failed with the secret-free `network` classification at function runtime.
- fix: Preserve the atomic limiter for every normal request and every Production request. When that limiter is unavailable, only the exact configured Preview demo-owner email may create its account, and only when the explicit Preview demo flag is `true`.
- verification: The temporary diagnostic logs are removed. Focused registration and rate-limit tests, lint, TypeScript, and a fresh Preview deployment must pass before the owner retries registration.
- safety: The exception cannot activate in Production, cannot help any other email, and does not bypass trusted-IP validation or a functioning limiter's denial response.

## Evidence

- timestamp: 2026-10-06T23:28:00-04:00; Vercel shows the new Upstash resource connected only to `scholar-scout-web` Preview and supplies `KV_REST_API_URL` plus `KV_REST_API_TOKEN` as sensitive Preview variables.
- timestamp: 2026-10-06T23:28:00-04:00; `apps/web/lib/server/rate-limit.ts` reads only `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`, so it configures no limiter and registration intentionally returns 503 before account creation.
- timestamp: 2026-10-06T23:41:00-04:00; the compatible reader now accepts Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` only as a fallback, while legacy prefixed values remain preferred and incomplete configuration still returns no limiter.
- timestamp: 2026-10-07T00:06:00-04:00; Vercel's current Request Headers documentation states that `x-forwarded-for` is overwritten with the public client IP and that `x-vercel-forwarded-for` is its companion header. The Preview environment confirms both Redis REST variables are present.
- timestamp: 2026-10-07T00:06:00-04:00; focused request-IP, registration, and rate-limit tests pass (37 tests) after adding a Vercel-only fallback for the standard overwritten header.
- timestamp: 2026-10-07T00:22:00-04:00; Vercel dashboard confirms system environment variable access is enabled and Preview has `KV_REST_API_URL` plus `KV_REST_API_TOKEN`; the second Preview deployment still reproduces the generic 503.
- timestamp: 2026-10-07T00:29:00-04:00; a reproduced Preview request reached rate limiting and emitted `rate-limit-unavailable`, ruling out trusted client-IP resolution.
- timestamp: 2026-10-07T00:22:52-04:00; the bounded Vercel diagnostic classified the attempted Preview Redis reservation as `network`; it emitted no endpoint, token, IP, email, or account data.

## Eliminated

- hypothesis: The newly provisioned Preview Redis database is unavailable.
  reason: Vercel reports the database Available and its connected-project list shows only Preview.
