---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 03
subsystem: authentication
tags: [next-auth, opaque-guest, http-only-cookie, migration, authorization]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Fail-closed atomic guest quota reservation seam."
provides:
  - "Seven-day opaque guest lifecycle records with hashed credential lookup."
  - "Session-derived account or cookie-resolved guest actors without staff capability."
  - "Idempotent same-device migration of explicit private activity records."
affects: [02-04, 02-05, 02-08, 02-10, 02-12, account-ownership]
tech-stack:
  added: []
  patterns:
    - "Resolve private storage keys only in server-only actor helpers."
    - "Move a documented allowlist during guest migration and preserve community/operational collections."
key-files:
  created:
    - apps/web/lib/server/student-actor.ts
    - apps/web/app/api/account/guest-migration/route.ts
    - apps/web/__tests__/api/auth-controls.test.ts
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/lib/server/platform-store.ts
    - apps/web/__tests__/lib/data-store.test.ts
key-decisions:
  - "Use a random 256-bit HttpOnly guest cookie with SHA-256 server lookup and no raw-secret persistence."
  - "Keep a migrated guest quota window bound to the account until the seven-day lifecycle expires."
  - "Merge guest shortlist data without overwriting existing account data, and move only the documented private-activity allowlist."
patterns-established:
  - "Actor helpers return discriminated account-or-guest identities with namespaced storage keys and no staff field."
  - "Migration routes accept no identity-bearing JSON and derive both sides from session/cookie server state."
requirements-completed: [SEC-01, SEC-03]
coverage:
  - id: D1
    description: "Opaque seven-day guest lifecycle persistence and one-time allowlisted record migration preserve excluded community and operational data."
    requirement: SEC-01
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-store.test.ts#guest lifecycle migration"
        status: pass
    human_judgment: false
  - id: D2
    description: "Account and guest actors derive only from the active session or trusted secure cookie, without staff capability."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/auth-controls.test.ts#student actor controls"
        status: pass
    human_judgment: false
  - id: D3
    description: "A signed-in same-device migration is authenticated, idempotent, and clears its opaque credential without browser-selected identity."
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/auth-controls.test.ts#student actor controls"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 03: Opaque Guest Actors and Migration Summary

**Seven-day opaque guest actors now use secure server-side lookup and migrate only approved private activity into the signed-in account once.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-28T02:13:47Z
- **Completed:** 2026-07-28T02:25:26Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- Added hashed seven-day guest lifecycle records, quota-window carry-over metadata, and minimal migration audit evidence without retaining browser secrets.
- Restricted storage identities to server-derived account sessions or opaque HttpOnly guest cookies; guest actors have no staff capability.
- Added an authenticated POST migration endpoint that accepts no identity-bearing body, transfers only private records once, and invalidates the guest credential.

## Task Commits

1. **Task 1: Persist guest lifecycle and allowlisted record migration** - `e2997cf` (TDD RED), `f46b32a` (feat)
2. **Task 2: Resolve only server-derived account or guest actors** - `388585c` (TDD RED), `6a7c7fd` (feat)
3. **Task 3: Expose session-bound guest migration** - `0b5beab` (TDD RED), `d12bcd8` (feat)
4. **Verification fixture correction** - `d5a3320` (test)

## Files Created/Modified

- `apps/web/lib/server/data-store.ts` - Persists and normalizes hashed guest lifecycle, quota binding, and migration audit metadata.
- `apps/web/lib/server/platform-store.ts` - Moves only the documented private-record allowlist and marks migrations idempotently.
- `apps/web/lib/server/student-actor.ts` - Resolves opaque guest/account actors and manages secure guest-cookie issuance and clearing.
- `apps/web/app/api/account/guest-migration/route.ts` - Implements session-bound, body-free guest migration.
- `apps/web/__tests__/lib/data-store.test.ts` - Covers lifecycle secrecy, allowlist transfer, idempotency, and excluded collection preservation.
- `apps/web/__tests__/api/auth-controls.test.ts` - Covers actor and migration route contracts.

## Decisions Made

- Use a 256-bit random credential in a `Secure`, `HttpOnly`, `SameSite=Lax`, root-path cookie; store only its SHA-256 lookup hash with a seven-day expiry.
- Preserve an account's existing onboarding and shortlist values while merging guest shortlist data, so migration cannot overwrite signed-in work.
- Retain the active guest quota window until lifecycle expiry so signing in cannot evade the guest advisor window.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made the auth mock virtual in the new route-contract test**
- **Found during:** Task 2
- **Issue:** Jest resolved the alias before the actor module existed and could not load the test's auth mock.
- **Fix:** Declared the isolated auth mock as virtual.
- **Files modified:** `apps/web/__tests__/api/auth-controls.test.ts`
- **Verification:** Focused actor and route tests pass.
- **Committed in:** `388585c`

**2. [Rule 1 - Bug] Restored cookie-store acquisition after factoring existing-guest lookup**
- **Found during:** Task 3
- **Issue:** The new guest resolver refactor attempted to set an issued cookie without a local cookie store.
- **Fix:** Reacquired the trusted route-handler cookie store before setting the issued credential.
- **Files modified:** `apps/web/lib/server/student-actor.ts`
- **Verification:** Actor and migration route tests pass.
- **Committed in:** `d12bcd8`

**3. [Rule 1 - Bug] Corrected invalid typed fixture values exposed by full TypeScript verification**
- **Found during:** Final verification
- **Issue:** Two new fixtures used values outside the established onboarding and analytics unions.
- **Fix:** Replaced them with valid domain values.
- **Files modified:** `apps/web/__tests__/lib/data-store.test.ts`, `apps/web/__tests__/api/auth-controls.test.ts`
- **Verification:** Focused tests, typecheck, and lint pass.
- **Committed in:** `d5a3320`

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 test setup issue). No scope expansion.

## Known Stubs

None.

## Threat Flags

None - the added cookie and migration route surfaces are the plan's explicitly mitigated trust boundaries.

## Self-Check: PASSED

- All six plan-owned source/test files and this summary exist.
- All seven TDD, implementation, and verification-fix commits exist in Git history.
- Focused lifecycle and actor-route tests, web typecheck, and lint passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
