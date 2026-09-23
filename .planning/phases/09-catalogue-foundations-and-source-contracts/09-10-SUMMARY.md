---
phase: 09-catalogue-foundations-and-source-contracts
plan: 10
subsystem: testing
tags: [typescript, jest, haversine, numerical-stability]
requires:
  - phase: 09-09
    provides: Catalogue contract validation and regression baseline
provides:
  - Finite great-circle distances for valid near-antipodal coordinates
  - Public regression coverage for the bounded Haversine calculation
affects: [catalogue local focus, regional coverage]
tech-stack:
  added: []
  patterns:
    - Bound closed-domain floating-point intermediates before root evaluation
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-contract.ts
    - apps/web/__tests__/lib/catalogue-contract.test.ts
key-decisions:
  - "Clamp the Haversine intermediate inclusively to [0, 1] before both central-angle roots."
patterns-established:
  - "Great-circle arithmetic preserves valid-coordinate semantics under floating-point rounding."
requirements-completed: [REG-01]
coverage:
  - id: D1
    description: "Valid near-antipodal coordinates return a finite pi-radius great-circle distance."
    requirement: REG-01
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/catalogue-contract.test.ts#returns a finite deterministic distance for valid near-antipodal coordinates"
        status: pass
      - kind: other
        ref: "pnpm --filter @scholar-scout/web run typecheck && lint && test --runInBand"
        status: pass
    human_judgment: false
duration: 5min
completed: 2026-09-22
status: complete
---

# Phase 09 Plan 10: Near-Antipodal Great-Circle Repair Summary

**Bounded Haversine arithmetic now keeps valid near-antipodal distances finite while preserving the documented inclusive ten-mile local-focus rule.**

## Performance

- **Duration:** approximately 5 min
- **Completed:** 2026-09-22
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

- Added the exact public near-antipodal regression from the verification report; it failed RED against the unmodified arithmetic.
- Clamped the Haversine intermediate inclusively to `0..1` before both central-angle square roots.
- Confirmed the focused suite, TypeScript check, ESLint, and full web Jest suite pass after the repair.

## Verification

- RED: focused Jest suite failed only the new assertion: `Number.isFinite(distance)` was `false`; existing 76 tests passed.
- GREEN: `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` — 77 passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run test --runInBand` — passed.

## Files Created/Modified

- `apps/web/lib/catalogue-contract.ts` — bounds the Haversine value before central-angle roots.
- `apps/web/__tests__/lib/catalogue-contract.test.ts` — proves the public helper returns the finite pi-radius distance for the exact valid near-antipodal pair.

## Decisions Made

- Clamp at the mathematical closed interval before both square-root operands, retaining coordinate validation, Earth-radius use, public signatures, and the inclusive local-focus comparison.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The sandboxed Node process could not resolve the workspace path; required test commands were re-run with normal workspace filesystem access.
- Gates report existing Node 24 engine and multiple-lockfile warnings; no gate failed and this plan made no runtime or lockfile changes.

## Commit Status

No files were staged or committed. The requested worktree is on `codex/phase6-production-release`, which is outside the executor's mandatory `worktree-agent-*` commit namespace, and the task explicitly required no staging. The code/test patch and this summary remain isolated and unstaged for the integration owner to commit atomically.

## Next Phase Readiness

The deterministic local-focus helper now handles the documented floating-point edge case without changing regional boundaries, source fixtures, public APIs, or catalogue evidence behavior.

## Self-Check: PASSED

- Both modified source and test files exist.
- The focused regression and all requested quality gates passed.

---
*Phase: 09-catalogue-foundations-and-source-contracts*
*Completed: 2026-09-22*
