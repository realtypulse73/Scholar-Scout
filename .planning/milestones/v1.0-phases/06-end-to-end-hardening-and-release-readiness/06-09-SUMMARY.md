---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 09
subsystem: release-gate
tags: [pnpm, github-actions, release-rehearsal, operational-testing]
requires:
  - phase: 06-07
    provides: Candidate-bound local, Preview-browser, and Preview-outage release rehearsal lanes.
provides:
  - Candidate-quality evidence with immutable install, root test, lint, typecheck, and build in one ordered record.
  - A workflow checkout pinned and verified against the manually dispatched candidate commit.
affects: [release-readiness, preview-rehearsal, OPS-04, PROD-04]
tech-stack:
  added: []
  patterns:
    - Release-lane subprocess tests simulate a failed root command and prove later lanes remain absent.
    - Workflow dispatch inputs are used both for checkout and a fail-closed resolved-HEAD assertion.
key-files:
  created: []
  modified:
    - scripts/prelaunch-rehearsal.mjs
    - scripts/test-production-tooling.mjs
    - .github/workflows/prelaunch-rehearsal.yml
key-decisions:
  - "Candidate quality records root pnpm test exactly once; focused web and service tests remain in the separate high-risk lane."
  - "The manually dispatched candidate SHA is both the checkout ref and the expected resolved HEAD before release work begins."
patterns-established:
  - "Operational release tests must prove command ordering and failure isolation through subprocess records."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: Candidate quality records the required immutable install, root pnpm test, lint, typecheck, and build sequence and blocks later lanes after root-test failure.
    requirement: OPS-04
    verification:
      - kind: integration
        ref: pnpm test:production-tooling
        status: pass
    human_judgment: false
  - id: D2
    description: The prelaunch workflow checks out the dispatched candidate commit and fails before the gate runner when resolved HEAD differs.
    requirement: PROD-04
    verification:
      - kind: integration
        ref: pnpm test:production-tooling
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-09-18
status: complete
---

# Phase 06 Plan 09: Candidate Quality Gate Summary

**Candidate-bound release evidence now records the immutable install, root test, lint, typecheck, and build sequence before any high-risk or browser lane can proceed.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-18T06:24:00Z
- **Completed:** 2026-09-18T06:31:37Z
- **Tasks:** 1/1
- **Files modified:** 3

## Accomplishments

- Replaced the filtered candidate test substitutions with the required root `pnpm test`, retaining the exact five-command quality record.
- Added a subprocess-backed failure test proving a failed root test writes a failed candidate-quality record and leaves high-risk and local-browser records absent.
- Pinned workflow checkout to `inputs.candidate_commit` and compared resolved `HEAD` before the release-gate command.

## Task Commits

1. **Task 1: Fail closed on a candidate-quality record without root pnpm test** - `7c4c8fb` (test), `0f48b5d` (fix)

## Files Created/Modified

- `scripts/prelaunch-rehearsal.mjs` - Defines the exact ordered candidate-quality command list while keeping high-risk proof separate.
- `scripts/test-production-tooling.mjs` - Exercises root-test failure, lane isolation, workflow checkout pinning, and HEAD verification.
- `.github/workflows/prelaunch-rehearsal.yml` - Checks out the dispatched candidate and fails closed on a resolved-HEAD mismatch.

## Decisions Made

- Candidate quality uses root `pnpm test`; focused web, webhook, and HTTP-service tests remain the distinct high-risk lane.
- The workflow compares the full resolved checkout SHA with the manual candidate input before it can produce release-gate evidence.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The local sandbox could not resolve the workspace parent directory for Node or update Git worktree metadata; the required test and commits were run through approved repository access. This did not alter source behavior or release evidence.

## User Setup Required

None - no external service configuration was changed. An authorized maintainer must still run the separate Preview evidence plan; this plan does not dispatch workflows or contact Vercel/GitHub.

## Next Phase Readiness

- G-06-02's candidate-quality command-substitution gap is closed in source and operational tests.
- Protected Preview and outage evidence remain separate authorized work and were not executed by this plan.

## Self-Check: PASSED

- Found all three modified implementation/test/workflow files.
- Found task commits `7c4c8fb` and `0f48b5d` in Git history.

---
*Phase: 06-end-to-end-hardening-and-release-readiness*
*Completed: 2026-09-18*
