---
phase: 09-catalogue-foundations-and-source-contracts
plan: 05
subsystem: catalogue-domain-contract
tags: [typescript, jest, catalogue, validation, chronology, import-boundary]
requires:
  - plan: 09-04
    provides: Evidence-backed verified coverage, immutable regional fixtures, and prior contract safeguards.
provides:
  - Injected-clock chronology validation for verified coverage reviews.
  - Stable, non-throwing validation errors for malformed card evidence and matrix entries.
affects: [phase-10-reviewed-imports, catalogue-publication, source-governance]
tech-stack:
  added: []
  patterns: [RED-GREEN contract regression, unknown-shaped runtime boundary, deterministic validation errors]
key-files:
  created:
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-05-SUMMARY.md
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
    - .planning/phases/09-catalogue-foundations-and-source-contracts/09-VALIDATION.md
key-decisions:
  - "Verified coverage reviews must not be future-dated or predate the attributable evidence review or documented source date under the injected clock."
  - "Untrusted card and matrix values fail as stable validator errors before property access, while valid controlled cells continue through normal matrix checks."
metrics:
  duration: 7min
  completed: 2026-09-22
  tasks_completed: 3
  files_modified: 3
status: complete
---

# Phase 09 Plan 05: Catalogue Validation Repair Summary

**Verified coverage chronology and malformed import shapes now fail deterministically at the pure catalogue validation boundary.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-22T22:07:31Z
- **Completed:** 2026-09-22T22:14:03Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Added RED-first public-validator regressions for future and causally impossible verified-coverage review dates using the fixed injected clock.
- Made coverage review dates reject dates after the injected clock and dates before attributable evidence review or documented source dates.
- Added record guards for unresolved card evidence, region entries, and coverage rows so `null`, primitives, and arrays return stable errors instead of throwing.
- Preserved the frozen six-region roster, 36 explicit `not-yet-verified` coverage cells, D-08 card contract, evidence vocabulary, and domain-only Phase 09 boundary.
- Recorded both repair tasks and their quality gate in the Phase 09 validation map.

## Task Commits

1. **Task 1: Add failing public-validator regressions for chronology and malformed import shapes** — `1714fc2` (RED)
2. **Task 2: Harden coverage chronology and card/matrix runtime-shape guards** — `dab5f15` (GREEN)
3. **Task 3: Record the repair map and run the Phase 09 quality gate** — `f61af7a`

## Verification

- `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — passed (46 tests).
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

The checks emitted the existing Node 20 versus required Node 24 engine warning and Next.js multiple-lockfile warning. Neither prevented any required quality gate from passing, and no runtime, dependency, lockfile, fixture, or configuration change was made.

## Decisions Made

- Compare a parseable verified-coverage review date with the supplied clock and each parseable attributable evidence date; retain `validateFactEvidence` as the owner of evidence freshness and action rules.
- Treat only non-array objects as safe property-access boundaries for untrusted card evidence and matrix list entries; return one stable shape error per malformed entry and continue validating valid rows.

## TDD Gate Compliance

- RED commit `1714fc2` contains the failing public-validator regressions; the focused suite failed solely on the three reviewed validator defects.
- GREEN commit `dab5f15` follows the RED commit and makes the focused suite pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the isolated documented-source chronology test setup.**
- **Found during:** Task 2 focused verification.
- **Issue:** The original source-date assertion reused an older source date, so it could only prove review-before-evidence rather than the separately required review-before-documented-source case.
- **Fix:** The regression now supplies an independently valid later documented source date while retaining the fixed clock and complete verified matrix.
- **Files modified:** `apps/web/__tests__/lib/catalogue-contract.test.ts`
- **Commit:** `dab5f15`

## Known Stubs

None.

## Threat Flags

None. This plan added no endpoint, authentication, file-access, schema, or external-network surface.

## State Update Note

Pre-existing concurrent changes to `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/config.json` were preserved and deliberately not modified or staged by this plan.

## Self-Check: PASSED

- Confirmed the two owned source/test files, validation map, and summary exist in the assigned worktree.
- Confirmed the RED, GREEN, and validation commits `1714fc2`, `dab5f15`, and `f61af7a` exist in repository history.
