---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 07
subsystem: staff-authorization
tags: [nextauth, authorization, audit, admin-data, tdd]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Per-request active-staff authorization and minimal privileged-operation audit evidence."
provides:
  - "Fresh, revocable staff authorization for all privileged administrative data-operation routes."
  - "Minimal allowed and denied authorization audit coverage for backup, import, restore, and status operations."
affects: [admin-operations, phase-3-data-operations, staff-revocation]
tech-stack:
  added: []
  patterns:
    - "Privileged data routes call requireActiveStaff before parsing bodies or reading data stores."
    - "Restore mutations use the server-verified actor ID rather than a session role claim."
key-files:
  created: []
  modified:
    - apps/web/app/api/admin/data/backups/route.ts
    - apps/web/app/api/admin/data/import/validate/route.ts
    - apps/web/app/api/admin/data/import/restore/route.ts
    - apps/web/app/api/admin/data/status/route.ts
    - apps/web/app/api/admin/data/backups/[id]/plan/route.ts
    - apps/web/app/api/admin/data/backups/[id]/restore/route.ts
    - apps/web/__tests__/api/admin-data-routes.test.ts
key-decisions:
  - "Apply the Plan 06 live allowlist guard to every staff-only administrative data route while preserving bearer-token health monitoring as a separate integration boundary."
  - "Use route-specific stable audit actions and paths without recording request bodies, emails, or confirmation text."
patterns-established:
  - "New privileged data operations must use requireActiveStaff before request parsing or data-store access."
requirements-completed: [SEC-02]
coverage:
  - id: D1
    description: "Backup listing and import validation or restore reject removed, missing, and malformed allowlists while retaining their established response contracts."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/admin-data-routes.test.ts#checks the live staff allowlist and audits data backup and import decisions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Data status and backup plan or restore routes enforce a fresh staff check and create minimal allowed or denied authorization evidence."
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/admin-data-routes.test.ts#checks the live staff allowlist and audits status and backup restore decisions"
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-07-28
status: complete
---

# Phase 2 Plan 07: Administrative Data Route Authorization Summary

**Every staff-only administrative data route now checks the current strict allowlist per request and records privacy-minimal authorization evidence.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-28T05:30:00Z
- **Completed:** 2026-07-28T05:50:00Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Guarded backup listing, import validation, and import restore before parsing bodies or accessing data stores.
- Guarded data status plus backup restore planning and execution with the same revocable staff check.
- Added route coverage for allowed, removed, missing, and malformed staff configuration, including minimal audit evidence; bearer-token health monitoring remains separate.

## Task Commits

1. **Task 1: Guard backup listing and import validation/restore routes** - `a838def` (TDD RED), `2febafe` (implementation)
2. **Task 2: Guard backup planning, backup restore, and data status** - `82daf36` (TDD RED), `fd0ef29` (implementation)

## Files Created/Modified

- `apps/web/app/api/admin/data/backups/route.ts` - Guards backup listing with the current active-staff allowlist.
- `apps/web/app/api/admin/data/import/validate/route.ts` - Authorizes before parsing import snapshots.
- `apps/web/app/api/admin/data/import/restore/route.ts` - Uses the verified actor ID for import restore attribution.
- `apps/web/app/api/admin/data/status/route.ts` - Restricts data-store status to currently authorized staff.
- `apps/web/app/api/admin/data/backups/[id]/plan/route.ts` - Audits and guards backup restore planning.
- `apps/web/app/api/admin/data/backups/[id]/restore/route.ts` - Audits and guards backup restore execution with the verified actor.
- `apps/web/__tests__/api/admin-data-routes.test.ts` - Covers live revocation, invalid configuration, safe denial, and audit records across protected data routes.

## Decisions Made

- The dedicated `/api/admin/data/health` bearer-token endpoint remains an independently protected monitoring integration; it was not converted to a staff route.
- Audit events use only the server-derived actor ID, action, route, outcome, and timestamp from the Plan 06 primitive.

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/admin-data-routes.test.ts` - passed (8 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` - passed.
- `corepack pnpm --filter @scholar-scout/web run lint` - passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` - passed (34 suites, 197 tests).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Issues Encountered

- The sandbox shell did not expose Node.js on `PATH`; verification used the workspace's pinned pnpm distribution with the runtime-provided Node executable. No project files were changed for this environment issue.

## Next Phase Readiness

All existing administrative data-operation handlers now share the revocable authorization boundary required before Phase 3 can broaden recovery semantics.

## Self-Check: PASSED

- All seven plan-owned route and test files exist.
- TDD and implementation commits `a838def`, `2febafe`, `82daf36`, and `fd0ef29` exist in Git history.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
