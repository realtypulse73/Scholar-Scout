---
phase: 09-catalogue-foundations-and-source-contracts
plan: 07
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, validation, chronology, import-boundary]
requires:
  - plan: 09-06
    provides: Runtime-shaped import guards and explicit unknown-coverage provenance discrimination.
provides:
  - Coverage rows must reference a supplied, validated regional record.
  - Source review dates cannot precede documented source dates.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [RED-GREEN validator regression, supplied-record membership validation, deterministic chronology errors]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-07-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
key-decisions:
  - "Require controlled coverage rows to reference an ID present in the supplied regional matrix, regardless of coverage state."
  - "Compare only parseable documented source dates with parseable checked dates; explicit unavailable dates remain valid and non-current."
patterns-established:
  - "Perform cross-field chronology checks only after existing shape validation succeeds."
requirements-completed: [REG-01, REG-02, REG-03, EVID-01, EVID-02]
coverage:
  - id: D1
    description: Controlled verified and not-yet-verified coverage rows cannot claim a region omitted from the reviewed matrix.
    requirement: REG-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#rejects a controlled undeclared coverage region
        status: pass
    human_judgment: false
  - id: D2
    description: Documented source metadata rejects impossible checked-before-source chronology while retaining explicit unavailable source dates.
    requirement: EVID-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-contract.test.ts#rejects a checked date before a documented source date
        status: pass
    human_judgment: false
metrics:
  duration: 14min
  completed: 2026-09-22
  tasks_completed: 2
  files_modified: 2
status: complete
---

# Phase 09 Plan 07: Catalogue Contract Review Repair Summary

**Reviewed catalogue imports now reject coverage for undeclared controlled regions and source checks that predate a documented source, while unavailable source dates retain explicit unknown freshness semantics.**

## Performance

- **Duration:** 14 min
- **Completed:** 2026-09-22
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Added RED-first regressions for both verified and explicit unknown coverage rows that reference controlled Greater Houston while its regional record is omitted.
- Added a deterministic source-metadata chronology regression and an unavailable-date preservation assertion.
- Bound coverage rows to the supplied validated region matrix and compared only documented source dates against checked dates.
- Preserved the frozen six-region source roster, ordered 36-cell explicit unknown baseline, D-08 first-view card contract, and Phase 09 domain-only scope.

## Task Commits

1. **Task 1: Add failing regressions for undeclared controlled coverage and source-date chronology** — `d5f64e3` (RED)
2. **Task 2: Bind coverage rows to supplied regions and reject impossible documented-source chronology** — `1360079` (GREEN), `8c36c77` (Rule 1 correction)

## Files Created/Modified

- `apps/web/__tests__/lib/catalogue-contract.test.ts` — public-validator RED regressions for supplied-region membership and source/check chronology.
- `apps/web/lib/catalogue-contract.ts` — pure membership and documented-source chronology validation.

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — passed (70 tests).
- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` — passed (7 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

## Decisions Made

- Apply supplied-region membership after the global controlled-vocabulary check so unsupported IDs retain their existing error and controlled but absent IDs receive the deterministic provenance error.
- Do not compare unavailable source dates, preserving their existing structurally valid but non-current/unknown semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowed the existing source-date guard for the new chronology path.**

- **Found during:** Task 2 complete quality gate.
- **Issue:** The existing `isSourceDate` helper returned a boolean, so TypeScript could not safely pass unknown parsed metadata to the documented-date helper.
- **Fix:** Changed the private guard to a `SourceDate` type predicate without changing its runtime behavior.
- **Files modified:** `apps/web/lib/catalogue-contract.ts`
- **Verification:** Focused contract and fixture suites, typecheck, lint, and full web Jest passed.
- **Committed in:** `8c36c77`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Required for type-safe implementation of the planned chronology validation; no scope expansion.

## Issues Encountered

- The local Node runtime is 20.20.2 while the workspace declares Node 24, and Next.js reports the pre-existing multiple-lockfile warning. All required checks passed without runtime, dependency, fixture, or configuration changes.
- Pre-existing `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, planning cache, `.gitkeep`, and `debug.log` changes were preserved and excluded from every commit.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 can reject reviewed snapshot coverage that lacks a declared regional provenance record or presents impossible source-review chronology.
- No source roster, fixtures, routes, persistence, UI, ranking, provider inventory, eligibility, sensitive inputs, or outcome logic changed.

## Self-Check: PASSED

- Confirmed both owned production/test files and this summary exist in the assigned worktree.
- Confirmed the RED, GREEN, and Rule 1 correction commits `d5f64e3`, `1360079`, and `8c36c77` exist in repository history.
