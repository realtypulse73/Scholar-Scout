---
phase: 01-release-and-ci-baseline
plan: 06
subsystem: release-operations
tags: [pnpm, corepack, node-24, adr, release-readiness, documentation]
requires:
  - phase: 01-05
    provides: Operational release handoffs and the Node lifecycle checkpoint
provides:
  - One active Corepack-selected pnpm maintainer contract in AGENTS.md
  - An accepted, accountable Node 24 LTS upgrade ADR linked from release readiness
affects: [contributor-tooling, ci, vercel, release-policy, production-readiness]
tech-stack:
  added: []
  patterns:
    - Keep the pinned Corepack pnpm contract, root lockfile, CI, and Vercel instructions synchronized.
    - Record runtime lifecycle ownership in a repository ADR while leaving hosted evidence maintainer-owned.
key-files:
  created:
    - docs/adr/0001-node-runtime-upgrade.md
  modified:
    - AGENTS.md
    - docs/production-readiness-checklist.md
key-decisions:
  - "Make Corepack-selected pnpm@10.34.5, the root pnpm lockfile, and the frozen lifecycle-script-disabled install the sole active maintainer path."
  - "Target Node 24 LTS with the Scholar Scout release maintainer accountable before long-lived release-policy approval, while retaining Node 20 only as the Phase 1 compatibility boundary."
patterns-established:
  - "Use pnpm --filter workspace commands in active project instructions."
  - "Keep GitHub/Vercel dashboard and hosted-runtime evidence outside repository-only documentation fixes."
requirements-completed: [OPS-05]
coverage:
  - id: D1
    description: Active project instructions provide one pnpm-only dependency and workspace-command contract.
    requirement: OPS-05
    verification:
      - kind: other
        ref: AGENTS.md pinned-version, frozen-install, workspace-command, and stale-path scans
        status: pass
    human_judgment: false
  - id: D2
    description: Node lifecycle accountability is recorded in an accepted ADR and linked from the production readiness checklist.
    requirement: OPS-05
    verification:
      - kind: other
        ref: ADR acceptance/owner/target/deadline scans and release-checklist link scan
        status: pass
    human_judgment: false
metrics:
  duration: 18 minutes
  completed: 2026-07-25
  tasks_completed: 2
  files_modified: 3
status: complete
---

# Phase 01 Plan 06: Release and CI Baseline Gap Closure Summary

**Active maintainer guidance now uses the single Corepack-selected pnpm contract, and Node 24 LTS upgrade accountability is recorded in a linked, accepted ADR.**

## Performance

- **Duration:** 18 minutes
- **Completed:** 2026-07-25
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Replaced stale active npm, legacy-lockfile, and workspace-command guidance in `AGENTS.md` with the checked-in Corepack/pnpm 10.34.5 contract.
- Added an accepted Node 24 LTS ADR with a release-maintainer owner, deadline, rationale, governed validation scope, and official Node release-schedule source.
- Replaced the release-readiness lifecycle TODO with a durable local ADR link while preserving the manual GitHub/Vercel evidence boundary.

## Task Commits

1. **Task 1: Align active project instructions with the frozen pnpm workspace contract** - `bac3147` (docs)
2. **Task 2: Record and link the accountable Node runtime upgrade decision** - `412765c` (docs)

## Files Created/Modified

- `AGENTS.md` - documents Corepack-selected pnpm 10.34.5, the root lockfile, frozen installs, pnpm workspace commands, and matching CI/Vercel behavior.
- `docs/adr/0001-node-runtime-upgrade.md` - accepted Node 24 LTS target, accountability, timing, upgrade scope, and validation obligations.
- `docs/production-readiness-checklist.md` - links the bounded Node 20 lifecycle checkpoint to the accepted ADR.

## Decisions Made

- Kept Node 20 unchanged as the documented Phase 1 compatibility baseline; the ADR establishes the Node 24 LTS target without silently changing runtime implementation.
- Retained draft-PR execution, branch protection, Vercel production parity, and smoke-event proof as maintainer-owned external evidence in `01-VERIFICATION.md`.

## Verification

- Passed the Task 1 required scans for the pnpm pin, frozen install, web and service workspace commands, and absence of active npm/legacy-lockfile guidance.
- Passed the Task 2 required ADR, owner, deadline, readiness-link, and removed-TODO scans.
- Passed `git diff --check`.
- Focused Phase 1 re-verification confirms the two repository gaps are resolved and the four hosted GitHub/Vercel/smoke checks remain explicitly external evidence requirements.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - the lifecycle decision is backed by an accepted ADR rather than a placeholder; no plan-created or plan-modified file retains a stub that prevents this plan's goal.

## Issues Encountered

- The shell did not expose a global `node` command. The repository's existing portable Node 20 runtime was used for GSD state inspection; no runtime contract was changed.

## User Setup Required

Maintainers must still retain the Phase 1 external evidence specified in `01-VERIFICATION.md`: a draft-PR CI run, main branch-protection/ruleset proof, Vercel production build and smoke evidence, and a controlled smoke-failure incident record. These are not completed by repository edits.

## Next Phase Readiness

The two repository-owned verification blockers are closed. Phase-level release verification still requires the documented GitHub and Vercel evidence before the phase can be considered fully verified.

## Self-Check: PASSED

- Confirmed all three implementation artifacts and this summary exist.
- Confirmed task commits `bac3147` and `412765c` exist in Git history.

---

*Phase: 01-release-and-ci-baseline*
*Completed: 2026-07-25*
