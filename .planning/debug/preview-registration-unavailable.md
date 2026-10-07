---
status: verifying
trigger: "Preview local-account registration reports: Registration is temporarily unavailable. Please try again."
created: "2026-10-06T23:28:00-04:00"
updated: "2026-10-06T23:41:00-04:00"
---

# Preview Registration Unavailable

## Symptoms

- **Expected behavior:** A user can create a local Preview-only ScholarScout account.
- **Actual behavior:** The Preview sign-up form reports “Registration is temporarily unavailable. Please try again.”
- **Reproduction:** Submit valid local-account details on the `worktree-agent-phase10` Preview deployment.

## Current Focus

- hypothesis: The new Vercel-managed Upstash connection exposes the current `KV_REST_API_*` variable names while the app only reads a legacy prefixed name.
- test: Compare the connected Preview variable names with the rate-limit configuration reader.
- expecting: Supporting the Vercel-managed aliases, with the existing canonical names taking precedence, restores atomic registration reservations without a fail-open path.
- next_action: Commit and deploy the compatible server-only environment-variable reader to Preview, then repeat local account registration.

## Evidence

- timestamp: 2026-10-06T23:28:00-04:00; Vercel shows the new Upstash resource connected only to `scholar-scout-web` Preview and supplies `KV_REST_API_URL` plus `KV_REST_API_TOKEN` as sensitive Preview variables.
- timestamp: 2026-10-06T23:28:00-04:00; `apps/web/lib/server/rate-limit.ts` reads only `UPSTASH_REDIS_REST_KV_REST_API_URL` and `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`, so it configures no limiter and registration intentionally returns 503 before account creation.
- timestamp: 2026-10-06T23:41:00-04:00; the compatible reader now accepts Vercel's `KV_REST_API_URL` and `KV_REST_API_TOKEN` only as a fallback, while legacy prefixed values remain preferred and incomplete configuration still returns no limiter.

## Eliminated

- hypothesis: The newly provisioned Preview Redis database is unavailable.
  reason: Vercel reports the database Available and its connected-project list shows only Preview.

## Resolution

- root_cause: The Vercel-managed Preview Upstash integration used `KV_REST_API_*` variables that the server-side rate limiter did not recognize.
- fix: Added a server-only configuration reader that prefers the existing prefixed credentials and falls back to Vercel's managed names without introducing a fail-open path.
- verification: Focused rate-limit and registration tests (24 assertions), web lint, TypeScript typecheck, and `git diff --check` pass locally. Preview deployment and account-registration retest remain pending.
- files_changed: `apps/web/lib/server/rate-limit.ts`, `apps/web/__tests__/lib/rate-limit.test.ts`, and this record.
