---
phase: 04-incremental-durable-persistence-boundaries
plan: 02
subsystem: persistence
tags: [cas, student-records, onboarding, shortlist, nextjs]
requires:
  - phase: 04-01
    provides: Opaque versioned reads and single-attempt conditional writes across supported adapters
provides:
  - Conflict-safe account and OAuth provisioning through bounded student operations
  - Conditional onboarding replacement with server-derived ownership
  - Atomic shortlist ID and plan replacement with safe route conflicts
affects: [04-03-operational-persistence, 04-04-recovery-cas, student-routes]
tech-stack:
  added: []
  patterns: [single-attempt student CAS, atomic student intent replacement, safe 409 reload contract]
key-files:
  created:
    - apps/web/lib/server/student-records.ts
    - apps/web/__tests__/lib/student-records.test.ts
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/app/api/account/onboarding/route.ts
    - apps/web/app/api/account/shortlist/route.ts
    - apps/web/__tests__/api/account-guest-routes.test.ts
key-decisions:
  - "Treat student account, profile, and shortlist replacements as non-commutative single-attempt CAS operations."
  - "Keep browser identity outside mutation contracts; only the server-resolved storage key selects a student slice."
  - "Return a stable conflict/reload category without current records, foreign data, or provider versions."
patterns-established:
  - "Student replacement: read one opaque version, compose one owned slice plus audit evidence, and conditionally commit once."
  - "Shortlist intent: programme IDs and plans are one atomic replacement operation."
requirements-completed: [DATA-01, DATA-02]
coverage:
  - id: D1
    description: "Account provisioning and onboarding replacements preserve newer concurrent state and student ownership."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/student-records.test.ts#bounded student records
        status: pass
    human_judgment: false
  - id: D2
    description: "Shortlist IDs and plans commit atomically and routes expose only a safe reload conflict."
    requirement: DATA-02
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/account-guest-routes.test.ts#returns a safe reload conflict without exposing stored student state
        status: pass
      - kind: integration
        ref: apps/web/__tests__/lib/student-records.test.ts#commits shortlist IDs and plans atomically for one student
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-08-29
status: complete
---

# Phase 4 Plan 2: Bounded Student Persistence Summary

**Student account, onboarding, and shortlist writes now use ownership-safe single-attempt CAS, with shortlist IDs and plans committed as one intent.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-29T00:28:23Z
- **Completed:** 2026-08-29T00:34:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Moved credential and OAuth account creation plus onboarding replacement behind bounded student operations without changing password or role behavior.
- Combined shortlist programme IDs and plan statuses into one conditional write while preserving compatibility helpers for existing internal callers.
- Added safe `409` reload responses for stale onboarding and shortlist intent without exposing stored records or adapter versions.
- Proved cross-owner isolation, atomicity, and two-writer conflict behavior with focused tests.

## Task Commits

1. **Task 1 RED: Student account and onboarding conflict tests** - `4fce4b3` (test)
2. **Task 1 GREEN: Bounded account and onboarding writes** - `d1e4102` (feat)
3. **Task 2 RED: Atomic shortlist and route conflict tests** - `28c51f3` (test)
4. **Task 2 GREEN: Atomic shortlist state and safe 409 mapping** - `bf190c0` (feat)
5. **Validation correction: Strict onboarding fixture typing** - `f8e6923` (test)

## Files Created/Modified

- `apps/web/lib/server/student-records.ts` - Bounded student account, profile, and shortlist conditional operations.
- `apps/web/lib/server/data-store.ts` - Compatibility exports delegate student mutations to the bounded boundary.
- `apps/web/app/api/account/onboarding/route.ts` - Safe onboarding conflict mapping.
- `apps/web/app/api/account/shortlist/route.ts` - One combined shortlist write and safe conflict mapping.
- `apps/web/__tests__/lib/student-records.test.ts` - Ownership, atomicity, and interleaving tests.
- `apps/web/__tests__/api/account-guest-routes.test.ts` - Server-derived identity and safe route response coverage.

## Decisions Made

- Student replacements receive one CAS attempt and are never replayed over a newer student choice.
- Existing `saveShortlist` and `saveShortlistPlans` callers retain compatibility but now cross the same conditional student boundary.
- Conflict payloads contain only `category: conflict` and `action: reload`, never the winning record or provider token.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected strict onboarding test fixture typing**
- **Found during:** Plan-level TypeScript validation
- **Issue:** The test fixture widened `affordabilitySensitivity` to `number`, failing strict domain typechecking.
- **Fix:** Typed the fixture and replacement explicitly as `OnboardingData`.
- **Files modified:** `apps/web/__tests__/lib/student-records.test.ts`
- **Verification:** Focused tests, typecheck, and lint passed.
- **Committed in:** `f8e6923`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test-only type correction; no production scope change.

## Issues Encountered

- The restricted sandbox could not resolve the provisioned Node runtime outside the workspace; validation and GSD commands used the approved repository toolchain outside that restriction.

## Verification

- Focused student operation and account route suites: 2 suites, 12 tests passed.
- Datastore, authentication, and Phase 3 recovery regression selection: 4 suites, 47 tests passed.
- Web TypeScript typecheck: passed.
- Web lint with zero warnings: passed.
- Stub scan: no functional stubs. Existing availability error copy is intentional runtime behavior.

## User Setup Required

None - no external configuration, provider writes, or production changes were required.

## Self-Check: PASSED

- All six plan-owned artifacts exist.
- Commits `4fce4b3`, `d1e4102`, `28c51f3`, `bf190c0`, and `f8e6923` exist in git history.
- Focused tests, compatibility/recovery regressions, typecheck, and lint pass.
- Unrelated dirty and untracked files remain untouched.

## Next Phase Readiness

- Plan 04-03 can migrate operational lifecycle, audit, and platform writes onto the same CAS seam.
- Supported adapters and Phase 3 recovery behavior remain unchanged and verified.
- Production deployment remains intentionally out of scope.

---
*Phase: 04-incremental-durable-persistence-boundaries*
*Completed: 2026-08-29*
