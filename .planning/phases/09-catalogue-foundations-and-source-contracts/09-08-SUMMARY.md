---
phase: 09-catalogue-foundations-and-source-contracts
plan: 08
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, validation, provenance, import-boundary]
requires:
  - plan: 09-07
    provides: Controlled coverage membership and source-review chronology validation.
provides:
  - Coverage membership now requires fully validated supplied regional provenance.
  - Forged official boundaries and malformed local focus cannot authorize verified or not-yet-verified coverage.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [RED-GREEN validator regression, provenance-first coverage membership]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-08-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
key-decisions:
  - "Forward every object-shaped supplied region's validation errors through coverage validation before using its ID."
  - "Admit a controlled regional ID to coverage membership only when the complete official-boundary and local-focus contract passes."
patterns-established:
  - "Validate untrusted parent records before deriving child-record authorization sets."
requirements-completed: [REG-01, REG-03, EVID-01]
coverage:
  - id: D1
    description: Forged boundaries and malformed local focus cannot authorize a complete regional coverage matrix in either coverage state.
    requirement: REG-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#rejects coverage authorized by invalid regional provenance
        status: pass
    human_judgment: false
  - id: D2
    description: Only fully provenance-valid supplied regions authorize controlled coverage rows while the frozen six-region, 36-cell matrix stays valid.
    requirement: REG-03
    verification:
      - kind: unit
        ref: pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand
        status: pass
      - kind: unit
        ref: pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand
        status: pass
    human_judgment: false
metrics:
  duration: 5min
  completed: 2026-09-22
  tasks_completed: 2
  files_modified: 2
status: complete
---

# Phase 09 Plan 08: Catalogue Provenance Admission Summary

**Coverage validation now requires every supplied region to pass its official-boundary and local-focus provenance contract before its controlled ID can authorize either coverage state.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-22T23:15:55Z
- **Completed:** 2026-09-22T23:20:49Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added four RED-first public-validator regressions for forged official boundaries and malformed local-focus provenance across verified and not-yet-verified Greater Houston matrices.
- Forwarded object-shaped supplied-region validation errors through `validateCoverageMatrix`.
- Limited controlled coverage membership to fully valid regional records while preserving the frozen roster, ordered 36-cell baseline, all prior guards, and D-08 fact contract.

## Task Commits

1. **Task 1: Add RED regressions for forged and malformed supplied regional provenance** — `7dd0ce3` (RED)
2. **Task 2: Admit only provenance-valid supplied regions to coverage membership** — `1f07f65` (GREEN)

## Files Created/Modified

- `apps/web/__tests__/lib/catalogue-contract.test.ts` — four public-validator regressions covering both provenance failures and both coverage states.
- `apps/web/lib/catalogue-contract.ts` — validates object-shaped supplied regions before deriving coverage membership.

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — passed (74 tests).
- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` — passed (7 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

## Decisions Made

- Treat the supplied regional matrix as an authorization boundary: a controlled ID is insufficient without valid official-boundary and local-focus provenance.
- Preserve existing row validation order so coverage tied to an invalid regional record receives the stable undeclared-region error in either state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made the validated region admission type-safe.**

- **Found during:** Task 2 complete quality gate.
- **Issue:** TypeScript could not infer that an object-shaped record with no validator errors is a `CatalogueRegion`.
- **Fix:** Added a narrow post-validation assertion when adding error-free records to the internal valid-region collection.
- **Files modified:** `apps/web/lib/catalogue-contract.ts`
- **Verification:** Focused contract and fixture suites, typecheck, lint, and the full web Jest suite passed.
- **Committed in:** `1f07f65`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** The type-only correction was necessary for the planned runtime validation and did not expand scope.

## Issues Encountered

- The local runtime is Node 20.20.2 while the workspace declares Node 24.x, and Next.js reports a pre-existing multiple-lockfile warning. All required checks passed without runtime, dependency, fixture, or configuration changes.
- Pre-existing `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, planning cache, `.gitkeep`, and `debug.log` changes were preserved and excluded from all commits.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 reviewed imports can rely on provenance-valid regional membership before accepting coverage states.
- No source roster, fixtures, routes, persistence, UI, ranking, provider inventory, or D-08 facts changed.

## Self-Check: PASSED

- Confirmed both owned production/test files and this summary exist in the assigned worktree.
- Confirmed the RED and GREEN commits `7dd0ce3` and `1f07f65` exist in repository history.
