---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 04
subsystem: personal-data-api-security
tags: [authorization, student-actor, request-validation, analytics, tdd]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Opaque account and guest actors with server-derived storage keys."
provides:
  - "Actor-scoped memory and simulation result reads and writes."
  - "Bounded exact simulation and analytics request contracts."
  - "No public endpoint for the global analytics event collection."
affects: [02-05, 02-12, account-ownership, analytics]
tech-stack:
  added: []
  patterns:
    - "Resolve the trusted student actor before every personal-data store access."
    - "Use parseJsonRequest with an exact route schema before user-controlled writes."
key-files:
  created:
    - apps/web/__tests__/api/user-data-routes.test.ts
  modified:
    - apps/web/app/api/memory/route.ts
    - apps/web/app/api/simulations/results/route.ts
    - apps/web/app/api/analytics/events/route.ts
decisions:
  - "Public personal-data routes issue or reuse the Phase 02 opaque guest actor rather than accepting a browser-selected key."
  - "Analytics has no aggregate GET surface in this phase; it is not deferred to a public or staff view."
metrics:
  duration: 32min
  completed: 2026-07-27
  tasks: 2
  files: 4
status: complete
---

# Phase 2 Plan 04: Protect Personal Data Ownership Summary

**Memory, simulations, and analytics now derive ownership from the trusted server actor, and global analytics are no longer publicly readable.**

## Accomplishments

- Scoped memory reads and recalculation writes to `actor.storageKey` and removed browser-selected route identity.
- Scoped simulation results, recommendations, and completion analytics to the actor after validating an 8 KiB exact simulation payload with known, non-duplicate answer pairs.
- Removed analytics GET, required an actor for event writes, and bounded its area, event name, metadata entries, scalar values, and request body.
- Added adversarial route coverage for cross-actor substitution, invalid payloads, metadata, and global analytics exposure.

## Task Commits

1. **Task 1: Scope memory and simulation results to the resolved actor** - `d35faba` (TDD RED), `bbf7494` (implementation)
2. **Task 2: Bound analytics access and actor-owned events** - `eb0460f` (TDD RED), `314fb35` (implementation)
3. **Verification fixture correction** - `610b9d0`

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/user-data-routes.test.ts` - passed (4 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` - passed.
- `corepack pnpm --filter @scholar-scout/web run lint` - passed.

## Decisions Made

- Private route ownership is established exclusively by `resolveStudentActor({ allowGuest: true })`; account and opaque guest storage keys remain isolated.
- Simulation and analytics handlers reject identity-bearing or malformed payload fields rather than passing them to persistence.
- The analytics route does not retain an aggregate operational GET endpoint; no public caller can retrieve all events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected isolated Jest mock module paths**
- **Found during:** Task 1 RED setup
- **Issue:** Jest could not resolve the alias-based mocked server modules in the new isolated route test.
- **Fix:** Mocked the equivalent project-relative modules so the routes and assertions share the same Jest module instance.
- **Files modified:** `apps/web/__tests__/api/user-data-routes.test.ts`
- **Verification:** Focused route suite failed specifically for the pre-existing ownership defects before implementation.
- **Commit:** `d35faba`

**2. [Rule 1 - Bug] Corrected zero-argument actor route test fixtures**
- **Found during:** Final TypeScript verification
- **Issue:** Tests passed obsolete request arguments to memory and simulation GET handlers after their secure zero-argument contract removed caller-selected keys.
- **Fix:** Invoked those handlers without arguments while retaining actor-ownership assertions.
- **Files modified:** `apps/web/__tests__/api/user-data-routes.test.ts`
- **Verification:** Focused tests, TypeScript, and ESLint all pass.
- **Commit:** `610b9d0`

**Total deviations:** 2 auto-fixed (1 blocking test setup issue, 1 test fixture bug). No scope expansion.

## Known Stubs

None.

## Self-Check: PASSED

- All four plan-owned files exist.
- All five TDD, implementation, and verification commits exist in Git history.
- Focused Jest coverage, TypeScript, and ESLint verification passed.

