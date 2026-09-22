---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 10
subsystem: authentication
tags: [next-auth, credentials, rate-limit, scrypt, oauth, guest-migration]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Fail-closed atomic sign-in reservations, trusted Vercel IP resolution, and session-bound guest migration."
provides:
  - "Trusted-IP, pre-KDF credentials exchange with reset-aware atomic limits."
  - "Asynchronous password derivation and opaque, single-use server grants for NextAuth credentials."
  - "One-time authenticated session migration trigger with recoverable UI failure feedback."
affects: [02-11-registration-and-credential-client-flow, account-authentication]
tech-stack:
  added: []
  patterns:
    - "Reserve a trusted identity/IP rate-limit key before account lookup or password derivation."
    - "Exchange raw credentials for a server-only, short-lived grant before invoking NextAuth."
    - "Run idempotent guest migration beneath SessionProvider without client-owned identity or role logic."
key-files:
  created:
    - apps/web/app/api/auth/credentials/route.ts
    - apps/web/__tests__/components/auth/AuthSessionProvider.test.tsx
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/auth.ts
    - apps/web/components/auth/AuthSessionProvider.tsx
    - apps/web/__tests__/api/auth-controls.test.ts
key-decisions:
  - "Use the Vercel-overwritten address and fixed email/IP reservation before lookup or async scrypt."
  - "Restrict the NextAuth Credentials provider to opaque, short-lived grants that are deleted on consumption."
  - "Wait for session-bound guest migration to settle before rendering authenticated dependent UI, retaining a recoverable error."
patterns-established:
  - "Credential route payloads are exact, byte-bounded contracts with only allowlisted public failure codes."
  - "Password derivation uses Node's asynchronous scrypt callback API and timing-safe comparison."
requirements-completed: [SEC-05, SEC-01]
coverage:
  - id: D1
    description: "Credential exchange reserves trusted email/IP attempts before KDF and returns reset-aware safe failures."
    requirement: SEC-05
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/auth-controls.test.ts#credential exchange controls"
        status: pass
    human_judgment: false
  - id: D2
    description: "NextAuth accepts only a single-use credential grant, while password hashing and verification remain asynchronous."
    requirement: SEC-05
    verification:
      - kind: unit
        ref: "apps/web/__tests__/api/auth-controls.test.ts#issues a single-use grant after asynchronous verification"
        status: pass
    human_judgment: false
  - id: D3
    description: "An authenticated OAuth-returned session migrates same-device guest activity once with recoverable failure feedback."
    requirement: SEC-01
    verification:
      - kind: automated_ui
        ref: "apps/web/__tests__/components/auth/AuthSessionProvider.test.tsx"
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 10: Rate-Bound Credentials and OAuth Guest Migration Summary

**Credential sign-in now reserves trusted email/IP capacity before asynchronous scrypt, hands NextAuth a one-use server grant, and safely migrates guest activity after authentication.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-28T17:11:00-04:00
- **Completed:** 2026-07-28T17:31:34-04:00
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added the supported POST `/api/auth/credentials` boundary with byte-bounded exact parsing, trusted Vercel IP resolution, fail-closed limiter handling, reset-aware 429 responses, and two fixed credential failure codes.
- Replaced synchronous scrypt with non-blocking async derivation, then restricted NextAuth's Credentials provider to consuming a random 256-bit, short-lived server grant exactly once.
- Added a session-layer guest-migration trigger that waits before authenticated dependent UI renders and shows a recoverable error if its server-owned migration request fails.

## Task Commits

1. **Task 1: Add the rate-limit-aware credentials exchange and one-use NextAuth grant** - `24ebbf4` (TDD RED), `5e7c268` (feat), `afd6881` (Rule 1 fix)
2. **Task 2: Trigger guest migration once for an OAuth-returned session** - `b764958` (TDD RED), `097c1f1` (feat)

## Files Created/Modified

- `apps/web/app/api/auth/credentials/route.ts` - Bounded credential exchange that reserves quota before account access or password work.
- `apps/web/lib/server/data-store.ts` - Asynchronous password derivation, typed verification results, and short-lived credential grant storage.
- `apps/web/auth.ts` - Credentials callback now accepts only a consumed opaque grant.
- `apps/web/components/auth/AuthSessionProvider.tsx` - Authenticated session migration trigger and recoverable error state.
- `apps/web/__tests__/api/auth-controls.test.ts` - Rate, trusted-IP, grant-consumption, and direct-callback regression coverage.
- `apps/web/__tests__/components/auth/AuthSessionProvider.test.tsx` - One-time migration and error-state UI coverage.

## Decisions Made

- Keep credential rate limiting external and fail closed; missing trusted address data or limiter availability returns 503 before account lookup/KDF work.
- Keep raw email and password outside NextAuth's credential callback by using an in-process short-lived server grant that is deleted atomically on read.
- Treat idempotent/no-guest migration as normal success and expose only a generic recoverable client error for genuine server failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected strict TypeScript typing for asynchronous scrypt output**
- **Found during:** Task 1 verification
- **Issue:** The promisified Node scrypt overload returned `unknown` to strict TypeScript, preventing typecheck despite correct runtime behavior.
- **Fix:** Replaced the ambiguous promisified call with a typed Promise wrapper around Node's non-blocking scrypt callback API.
- **Files modified:** `apps/web/lib/server/data-store.ts`
- **Verification:** Focused tests, typecheck, lint, and the full web Jest suite pass.
- **Commit:** `afd6881`

**Total deviations:** 1 auto-fixed Rule 1 type correctness issue. No scope expansion.

## Issues Encountered

- The shell does not expose the repository-required Node 20/Corepack pnpm 10.34.5 command. Verification used the installed workspace binaries with the available Node executable; focused tests, typecheck, lint, and the full suite passed. The canonical `corepack pnpm` command remains unavailable in this environment.

## Known Stubs

None.

## Self-Check: PASSED

- Required source, test, and summary files exist on disk.
- Task commits `24ebbf4`, `5e7c268`, `afd6881`, `b764958`, and `097c1f1` exist in Git history.
- No placeholder or TODO/FIXME patterns were found in plan-owned production or test files.

## Next Phase Readiness

- Plan 02-11 can wire the client sign-in form to this supported credential boundary without ever sending raw credentials directly to NextAuth.
- OAuth and credential sessions both use the server-owned, idempotent guest migration path without exposing guest credentials or client-chosen authority.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
