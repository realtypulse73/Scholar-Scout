---
phase: 03-administrative-and-data-operations-correctness
plan: 03
subsystem: admin-data-recovery-routes
tags: [nextjs, authorization, recovery, backups, audit]
requires:
  - phase: 03-02
    provides: signed recovery envelopes, bound recovery plans, retention, and incident holds
provides:
  - Authorized safe backup summary and count-only preview routes
  - Exact bounded backup recovery apply route using signed plan tokens
  - Server-only authorized incident-hold release route with lifecycle evidence
affects: [03-04, 03-05, admin-data-routes, recovery-operations]
tech-stack:
  added: []
  patterns: [authorize-before-parse, count-only recovery previews, exact bounded request DTOs]
key-files:
  created:
    - apps/web/app/api/admin/data/backups/[id]/hold/release/route.ts
  modified:
    - apps/web/app/api/admin/data/backups/route.ts
    - apps/web/app/api/admin/data/backups/[id]/plan/route.ts
    - apps/web/app/api/admin/data/backups/[id]/restore/route.ts
    - apps/web/app/api/admin/data/status/route.ts
    - apps/web/lib/server/data-recovery.ts
    - apps/web/__tests__/api/admin-data-routes.test.ts
key-decisions:
  - "Treat privileged authorization evidence as operational metadata outside the recovery state digest so authorization cannot invalidate a freshly issued plan."
  - "Keep incident-hold release as an authenticated operator-only route and exclude it from advertised UI capabilities."
patterns-established:
  - "Privileged recovery routes authorize before reading request bodies, route parameters, or application recovery state."
  - "Recovery responses contain safe identifiers, counts, state, and retry guidance but never snapshot or student content."
requirements-completed: [OPS-02, OPS-03, DATA-03]
duration: 12min
completed: 2026-08-28
status: complete
---

# Phase 3 Plan 3: Authorized Backup Recovery Routes Summary

**Authorized backup routes now expose deterministic metadata and count-only previews, enforce signed bounded recovery plans, and release incident holds through a non-advertised audited operator endpoint.**

## Performance

- **Duration:** 12 min
- **Completed:** 2026-08-28
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Replaced legacy backup list and preview handlers with safe newest-first summaries and actor/state-bound signed plan tokens.
- Made compatibility status a projection of the canonical fresh capability health read, including safe retryable outage responses.
- Replaced direct snapshot restoration with an exact bounded `{ planToken, reason, confirmation }` contract and one-write recovery application.
- Added a freshly authorized, exact bounded incident-hold release route that returns only lifecycle identifiers and remains absent from advertised UI capabilities.
- Added route coverage for healthy-empty versus unavailable storage, deterministic ordering, count-only previews, exact-body rejection, bound apply, hold identity/state checks, lifecycle audit, and response redaction.

## Task Commits

1. **Task 1 RED: Backup summary and preview contracts** - `7522975`
2. **Task 1 GREEN: Safe list, preview, and status routes** - `ad88cd6`
3. **Task 2 RED: Exact bound recovery apply contract** - `58dae53`
4. **Task 2 GREEN: Signed plan-token restore application** - `654f062`
5. **Task 3 RED: Incident-hold operator route contract** - `b7a815f`
6. **Task 3 GREEN: Authorized hold release and lifecycle result** - `0087517`

## Files Created/Modified

- `apps/web/app/api/admin/data/backups/route.ts` - Safe deterministic backup summaries with explicit healthy-empty and unavailable outcomes.
- `apps/web/app/api/admin/data/backups/[id]/plan/route.ts` - Count-only signed recovery-plan previews.
- `apps/web/app/api/admin/data/backups/[id]/restore/route.ts` - Exact bounded plan-token apply handler with typed safe status mapping.
- `apps/web/app/api/admin/data/backups/[id]/hold/release/route.ts` - Freshly authorized operator-only incident-hold release.
- `apps/web/app/api/admin/data/status/route.ts` - Compatibility projection of canonical capability health.
- `apps/web/lib/server/data-recovery.ts` - Operational-evidence-excluding state digest and typed hold-release outcomes.
- `apps/web/__tests__/api/admin-data-routes.test.ts` - Backup route, recovery apply, hold release, ordering, failure, and redaction coverage.

## Decisions Made

- Authorization audit events are operational evidence, not application recovery state; excluding them from the recovery digest preserves drift detection while allowing a freshly authorized apply request.
- Incident-hold release is intentionally server/operator-only and is not included in the capability operation list used to derive Phase 3 UI controls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prevented authorization audit writes from invalidating every recovery plan**
- **Found during:** Task 2
- **Issue:** Fresh staff authorization appends privacy-minimal operational evidence before apply, changing the whole-document digest after preview even when application data is unchanged.
- **Fix:** Excluded privileged authorization evidence from the application recovery digest while retaining all persisted evidence.
- **Files modified:** `apps/web/lib/server/data-recovery.ts`
- **Verification:** Bound preview/apply route test, recovery-domain suite, full web suite, strict typecheck, and lint all pass.
- **Commit:** `654f062`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** Required integration correction; no scope expansion or weakening of recovery state binding.

## Issues Encountered

- The first full-suite invocation included an extra pnpm argument delimiter, causing Jest to interpret `--runInBand` as a test-name pattern. It was rerun with the repository's documented pnpm 10 syntax and all 40 suites passed.

## User Setup Required

None for this plan. Recovery signing variables remain an operational prerequisite for enabling preview/apply in a deployed environment.

## Verification

- Focused admin-route and recovery suites: 22 tests passed.
- Full web suite: 40 suites and 242 tests passed.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- No snapshot, provider, credential, or student content appears in recovery route responses.

## Self-Check: PASSED

- All seven created/modified implementation and test files exist.
- All six TDD task commits exist in git history.
- Every task acceptance criterion and the plan-level verification command passed.
- No stubs, skipped tests, or unrun verification remain.

## Next Phase Readiness

- Plan 03-04 can wire signed import validation and apply readiness to the same recovery contract.
- Phase 3 is 3 of 6 plans complete with no blocker from Plan 03-03.

---
*Phase: 03-administrative-and-data-operations-correctness*
*Completed: 2026-08-28*
