---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 13
subsystem: authorization
tags: [nextjs, api, staff-authorization, decision-engine, tdd]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Strict per-request active-staff authorization and privacy-minimal privileged-operation audits."
provides:
  - "A disabled public decision endpoint that cannot invoke the global decision engine or write shared decision logs."
  - "Operations and feed metric dashboards guarded by active-staff authorization before global metric reads."
affects: [02-11, admin-operations, decision-engine]
tech-stack:
  added: []
  patterns:
    - "Server-rendered privileged dashboards authorize with requireActiveStaff before calling global metric helpers."
    - "Retired public mutation endpoints return a stable non-sensitive 404 response with no server-store dependency."
key-files:
  created:
    - apps/web/__tests__/api/decision-boundary.test.ts
  modified:
    - apps/web/app/api/decisions/route.ts
    - apps/web/app/admin/ops/page.tsx
    - apps/web/app/admin/feed/page.tsx
key-decisions:
  - "Retire the anonymous decision trigger instead of providing a public aggregate or replacement endpoint."
  - "Use a safe 404 denial for server-rendered decision dashboards after requireActiveStaff records its minimal authorization audit."
patterns-established:
  - "Every global decision-metric consumer must establish current active-staff authority before any getPlatformMetrics call."
requirements-completed: [SEC-01, SEC-02]
coverage:
  - id: D1
    description: "The public decision route returns only a stable not-found response and cannot reach the decision mutation seam."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/decision-boundary.test.ts#returns a safe disabled response without running or exposing decisions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Operations and feed dashboards deny removed, unauthenticated, and malformed-config staff outcomes before reading global metrics."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/decision-boundary.test.ts#denies removed staff member before either dashboard reads or mutates global metrics"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current active staff can render both decision dashboards only after authorization."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/decision-boundary.test.ts#shows both dashboards only after current active-staff authorization"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 13: Decision Mutation and Metrics Authorization Summary

**Public decision mutation is retired behind a stable 404 response, while global decision dashboards now require fresh active-staff authorization before reading or writing shared metrics.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-28T21:32:00Z
- **Completed:** 2026-07-28T21:43:13Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Audited all `apps/web` references before modification: `/api/decisions` appeared only in its route handler; `runAndStoreDecisions` appeared in that handler, its platform-store definition, and `getPlatformMetrics`; `getPlatformMetrics` appeared only in the operations/feed server pages and its platform-store definition. No in-tree browser caller or unexpected public caller exists.
- Replaced the public decision handler with a fixed `{ error: 'Not found' }` 404 response and removed its platform-store dependency.
- Guarded the operations and feed dashboards with distinct `requireActiveStaff` action/route labels before global metric calculation, failing safely without rendering metrics for denied requests.

## Task Commits

1. **Task 1: Audit and disable the public decision-engine route** - `a7849f6` (TDD RED), `48ffbd9` (implementation)
2. **Task 2: Guard server-rendered global decision dashboards** - `880af4f` (implementation)
3. **Test isolation correction** - `ed871cb` (test)

## Files Created/Modified

- `apps/web/app/api/decisions/route.ts` - Returns the stable disabled response without importing the decision engine.
- `apps/web/app/admin/ops/page.tsx` - Requires active staff before loading operations metrics.
- `apps/web/app/admin/feed/page.tsx` - Requires active staff before loading feed metrics.
- `apps/web/__tests__/api/decision-boundary.test.ts` - Covers disabled public access plus denied and allowed dashboard authorization flows.

## Decisions Made

- Removed the public write/aggregation path rather than exposing a new aggregate or analytics endpoint.
- Used `notFound()` as the non-sensitive server-page denial after the active-staff guard records its minimal audit outcome.

## Verification

- Focused Jest boundary suite - passed (5 tests).
- `apps/web` ESLint with zero warnings - passed.
- `apps/web` strict TypeScript check - passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test isolation] Stabilized mocked server-module imports in the boundary test**
- **Found during:** Task 2
- **Issue:** The initial Jest mock layout did not isolate Next.js server-page dependencies reliably and violated the repository lint rule for CommonJS-style test imports.
- **Fix:** Reset modules per test, register relative module mocks before importing the route/pages, and retain typed dynamic imports.
- **Files modified:** `apps/web/__tests__/api/decision-boundary.test.ts`
- **Verification:** Focused Jest suite, full web lint, and strict TypeScript check passed.
- **Committed in:** `ed871cb`

**Total deviations:** 1 auto-fixed (1 Rule 1 test-isolation correction). No production scope expansion.

## Issues Encountered

- The required `corepack pnpm` verification command could not run because this executor environment exposes neither Corepack nor Node 20/pnpm 10.34.5. Equivalent locally installed Jest, ESLint, and TypeScript binaries were run successfully with the available Node runtime.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The remaining Phase 2 registration/client-flow plan can proceed without an anonymous decision mutation path.
- Global decision metrics remain intentionally server-only and must continue to use the active-staff guard.

## Self-Check: PASSED

- All four plan-owned source and test files exist.
- TDD and implementation commits `a7849f6`, `48ffbd9`, `880af4f`, and `ed871cb` exist in Git history.
- Focused Jest coverage, TypeScript, and ESLint verification passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
