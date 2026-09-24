---
quick_id: 260924-ftn
status: complete
completed: 2026-09-24
commit: 82c8b4e
---

# Quick Task 260924-ftn Summary

Added a server-derived local-development registration exception that works only for a plain `NODE_ENV=development` process, while all Vercel Preview and production registration requests retain the trusted-IP, atomic-reservation, and fail-closed controls.

## Changes

- Added a server-only registration environment predicate that requires development mode and empty Vercel markers; it never evaluates request headers.
- Preserved the deployed registration order: bounded payload validation, Vercel-only IP parsing, atomic reservation, then account creation with the server-derived role.
- Added safe client mappings for known registration rate-limit and unavailable responses, without rendering arbitrary API detail text.
- Extended focused route, IP-parser, and AuthForm tests for local behavior, Vercel failure closure, forged forwarding headers, role rejection, and hostile-error redaction.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/request-ip.test.ts __tests__/api/register.test.ts __tests__/components/auth/AuthForm.test.tsx` — 32/32 passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.

## Decisions

- The local exception is determined exclusively from server runtime environment and requires both Vercel markers to be absent or empty.
- Vercel deployments never treat client forwarding headers as a local-development signal and continue to reserve the trusted IP before creating an account.
- The browser renders only fixed messages for recognized registration failures and discards server-provided detail fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test typing] Corrected test fixture environment and malformed-response types**
- **Found during:** Focused verification
- **Issue:** New test fixtures did not satisfy the project’s strict `ProcessEnv` and `Response` types.
- **Fix:** Narrowed test environment literals and marked the intentionally partial malformed response as an explicit test double.
- **Verification:** TypeScript check and the full focused suite passed.
- **Committed in:** `82c8b4e`

---

**Total deviations:** 1 auto-fixed (test typing).
**Impact on task:** No production behavior change beyond the planned registration safety boundary.

## Commit

- `82c8b4e` — `feat(260924-ftn): allow safe local development registration`

