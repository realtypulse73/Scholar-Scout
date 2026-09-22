---
phase: 09-catalogue-foundations-and-source-contracts
plan: 09
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, validation, security, clock]
requires:
  - plan: 09-08
    provides: Provenance-valid regional coverage membership.
provides:
  - Every public catalogue validator that accepts an injected clock rejects an invalid Date deterministically.
  - Future evidence and verified coverage cannot be certified through an invalid injected validation clock.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [RED-GREEN validation-clock regression, fail-closed injected-clock boundary]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-09-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
key-decisions:
  - "Reject invalid injected clocks at every public validator boundary with one stable error before shape, chronology, or freshness validation."
  - "Keep opportunity-card status derived from card validation so an invalid clock remains unknown without changing the classifier API."
patterns-established:
  - "Injected validation dependencies fail closed at each public trust boundary rather than conditionally disabling integrity checks."
requirements-completed: [REG-03, EVID-01]
coverage:
  - id: D1
    description: All five public injected-clock catalogue validators return the same stable error for an invalid Date, and the derived opportunity-card status is unknown.
    requirement: EVID-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#invalid injected validation clock regressions
        status: pass
    human_judgment: false
  - id: D2
    description: A complete verified six-pathway coverage matrix with future evidence and review dates cannot validate through an invalid clock.
    requirement: REG-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#rejects a complete verified matrix with future coverage and evidence dates
        status: pass
    human_judgment: false
metrics:
  duration: 5min
  completed: 2026-09-22
  tasks_completed: 2
  files_modified: 2
status: complete
---

# Phase 09 Plan 09: Invalid Validation-Clock Guard Summary

**Every injected-clock catalogue validation boundary now rejects an invalid Date before it can certify future evidence or verified coverage as current.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-22T23:36:27Z
- **Completed:** 2026-09-22T23:41:23Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added RED-first regressions for direct evidence, employer training, wage context, opportunity-card facts, derived card status, and a complete six-pathway verified coverage matrix under an invalid injected clock.
- Made each public validator return the identical `Validation clock must be a valid Date.` error before normal validation when the supplied Date is invalid.
- Preserved valid-clock freshness, provenance, controlled-pathway, uncertainty, and first-view card behavior while the derived card status resolves to `unknown` for an invalid clock.

## Task Commits

1. **Task 1: Add RED regressions for an invalid injected validation clock** — `a4eb34a` (RED)
2. **Task 2: Fail closed at every public injected-clock validation boundary** — `25081a1` (GREEN)

## Files Created/Modified

- `apps/web/__tests__/lib/catalogue-contract.test.ts` — invalid-clock regressions using otherwise valid future evidence and a complete verified matrix.
- `apps/web/lib/catalogue-contract.ts` — stable fail-closed guard at all five public injected-clock validator boundaries.

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — passed (76 tests); the new cases first failed before the production edit.
- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` — passed (7 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

## Decisions Made

- Validate the injected clock at every public boundary, not only in the nested fact validator, so callers always receive one stable root failure and malformed clocks cannot bypass matrix row checks.
- Preserve `getFreshnessStatus` as an `unknown` classifier and preserve `getOpportunityCardVerificationStatus` as a delegating derived consumer.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The local runtime is Node 20.20.2 while the workspace declares Node 24.x, and Next.js reports a pre-existing multiple-lockfile warning. All required checks passed without runtime, dependency, fixture, or configuration changes.
- Pre-existing `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, planning cache, `.gitkeep`, and `debug.log` changes were preserved and excluded from all commits.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 reviewed imports can rely on public catalogue validators to reject an invalid injected clock before accepting current facts or verified coverage.
- No fixtures, source roster, routes, persistence, UI, live integration, ranking, provider inventory, or documentation changed.

## Self-Check: PASSED

- Confirmed both owned production/test files and this summary exist in the assigned worktree.
- Confirmed the RED and GREEN commits `a4eb34a` and `25081a1` exist in repository history.
