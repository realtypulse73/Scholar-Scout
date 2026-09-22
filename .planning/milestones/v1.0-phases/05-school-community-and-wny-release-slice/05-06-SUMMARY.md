---
phase: 05-school-community-and-wny-release-slice
plan: 06
subsystem: discovery-data
tags: [typescript, jest, western-new-york, source-links]
requires:
  - phase: 05-03
    provides: Western New York discovery dataset and accessible directory
provides:
  - Corrected first-party visit URLs for four Western New York institutions
  - Regression coverage against the exported production institution dataset
affects: [phase-5-uat, vercel-preview]
tech-stack:
  added: []
  patterns:
    - Production-dataset assertions prevent source-link regressions
key-files:
  created: []
  modified:
    - apps/web/lib/western-new-york.ts
    - apps/web/__tests__/lib/western-new-york.test.ts
key-decisions:
  - "Use the supplied first-party visit resources and preserve all existing evidence wording and ranking logic."
patterns-established:
  - "Test institution source corrections by id against WESTERN_NEW_YORK_INSTITUTIONS rather than a fabricated fixture."
requirements-completed: []
coverage:
  - id: D1
    description: Corrected production WNY visit-source mapping for Bryant & Stratton, Canisius, Daemen, and Hilbert
    requirement: PROD-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/western-new-york.test.ts#keeps corrected official visit sources in the production WNY dataset
        status: pass
    human_judgment: false
duration: partial
completed: 2026-08-29
status: partial
---

# Phase 5 Plan 06: WNY Source-Correction Summary

**Four first-party institutional visit resources are corrected in the production Western New York dataset and protected by an id-based Jest regression test.**

## Performance

- **Tasks completed:** 1 of 2 (Task 2 Preview/UAT recheck is owned by the orchestrator and was not run here).
- **Files modified:** 2

## Accomplishments

- Replaced only the stale Bryant & Stratton, Canisius, Daemen, and Hilbert `mediaUrl` values with the supplied first-party resources.
- Updated `sourceCheckedOn` only for those four records to `2026-08-29`.
- Added production-dataset coverage that maps each corrected institution id to its exact URL and review date.

## Verification

- RED: `corepack pnpm --filter @scholar-scout/web exec jest --config jest.config.ts --runInBand western-new-york` failed before the data correction, showing the stale Bryant & Stratton URL and date.
- GREEN: the same direct Jest command passed: 1 suite, 4 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` passed.

## Task Commits

No task commit was created by this executor. The mandatory worktree guard refused a commit because the worktree branch is `codex/phase-5-discussion`, while executor commits are permitted only from the `worktree-agent-*` namespace. The verified source/test changes remain scoped and ready for the orchestrator to commit.

## Files Created/Modified

- `apps/web/lib/western-new-york.ts` - corrected the four first-party visit URLs and their review dates.
- `apps/web/__tests__/lib/western-new-york.test.ts` - asserts the corrected mapping against `WESTERN_NEW_YORK_INSTITUTIONS`.

## Decisions Made

- Kept the correction data-only: no discovery ranking, public evidence language, or accessibility UI behavior changed.

## Deviations from Plan

### Worktree Guard

- **Found during:** Task 1 commit.
- **Issue:** The current worktree is on `codex/phase-5-discussion`, outside the executor's required `worktree-agent-*` commit namespace.
- **Resolution:** Did not bypass the guard; delegated the atomic commit to the orchestrator.

### Verification Invocation

- **Found during:** Task 1 RED check.
- **Issue:** The plan's forwarded `pnpm test --runInBand -- western-new-york` invocation exited without executing the targeted suite.
- **Resolution:** Used the web workspace's direct Jest executable with the same configuration and target; it provided the required failing RED result and passing GREEN result.

## Next Phase Readiness

- The correction is ready for its normal Git-integrated Preview deployment and the complete existing Test 1 accessibility/source-link UAT recheck.
- This summary is intentionally partial until the orchestrator records Preview/UAT evidence and completes the required commit/state updates.

---
*Phase: 05-school-community-and-wny-release-slice*
*Plan: 06*
