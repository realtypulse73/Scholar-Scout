---
phase: 01-release-and-ci-baseline
plan: 01
subsystem: infra
tags: [pnpm, corepack, workspaces, lockfile, dependency-management]
requires: []
provides:
  - "Pinned pnpm 10.34.5/Corepack contract for the root workspace and portable Windows helpers"
  - "One regenerated root pnpm lockfile covering every workspace importer"
affects: [ci, vercel, deployment, contributor-tooling]
tech-stack:
  added: [pnpm 10.34.5 via Corepack]
  patterns: [one root lockfile, frozen lifecycle-script-disabled installs]
key-files:
  created: [pnpm-workspace.yaml, pnpm-lock.yaml, scripts/pnpm-portable.ps1]
  modified: [package.json, scripts/use-portable-node.ps1, services/codex-webhook-runner/package.json]
key-decisions:
  - "Pin pnpm@10.34.5 in the root manifest and invoke it through Corepack."
  - "Generate and validate one root lockfile from final workspace manifests before removing stale locks."
patterns-established:
  - "Use pnpm --filter for root workspace commands."
  - "Use frozen pnpm installs with lifecycle scripts disabled for reproducible dependency validation."
requirements-completed: [OPS-05]
coverage:
  - id: D1
    description: "Pinned Corepack pnpm workspace contract and portable Windows entry point"
    requirement: OPS-05
    verification:
      - kind: integration
        ref: "powershell -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 --version"
        status: pass
      - kind: integration
        ref: "corepack pnpm --filter @scholar-scout/web run typecheck --help"
        status: pass
    human_judgment: false
  - id: D2
    description: "Single regenerated root lockfile for all workspace importers"
    requirement: OPS-05
    verification:
      - kind: integration
        ref: "corepack pnpm install --frozen-lockfile --ignore-scripts"
        status: pass
      - kind: integration
        ref: "corepack pnpm --filter @scholar-scout/web run typecheck"
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-07-25
status: complete
---

# Phase 01 Plan 01: pnpm Workspace Contract Summary

**Pinned Corepack pnpm 10.34.5 workspace tooling with one frozen, reviewed lockfile spanning the web app and both services.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-25T22:20:09-04:00
- **Completed:** 2026-07-25T22:28:22-04:00
- **Tasks:** 3/3
- **Files modified:** 11

## Accomplishments

- Replaced the root npm contract with pnpm 10.34.5 selected through Corepack and declared the existing workspace membership in `pnpm-workspace.yaml`.
- Replaced portable npm helpers with portable Node/Corepack pnpm helpers while preserving the local `.pnpm-store/` ignore boundary.
- Regenerated the root lockfile from finalized workspace manifests, verified frozen installation without lifecycle scripts, and removed the root npm and nested web pnpm lockfiles.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the pnpm-only root workspace contract** - `df5a334` (chore)
2. **Task 2: Replace npm-specific portable tooling and metadata** - `5882d2c` (chore)
3. **Task 3: Regenerate the sole reviewed workspace lockfile** - `3f5b4b0` (chore)

## Files Created/Modified

- `package.json` - pins pnpm and translates root workspace scripts.
- `pnpm-workspace.yaml` - declares apps, packages, and services as one workspace.
- `scripts/pnpm-portable.ps1` and `scripts/pnpm-portable.cmd` - provide the portable Corepack pnpm entry point.
- `scripts/use-portable-node.ps1` - enables Corepack with the selected portable Node runtime.
- `pnpm-lock.yaml` - contains the regenerated dependency graph for all four importers.
- `package-lock.json` and `apps/web/pnpm-lock.yaml` - removed as superseded lockfiles.

## Decisions Made

- Pin `pnpm@10.34.5` at the root and use Corepack rather than adding a package-manager runtime dependency.
- Generate the authoritative root lockfile from declared manifests, validate it with a frozen install, and only then remove legacy locks.

## Verification

- `powershell -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 --version` - passed (`10.34.5`).
- `corepack pnpm --filter @scholar-scout/web run typecheck --help` - passed.
- `corepack pnpm install --frozen-lockfile --ignore-scripts` - passed for all four workspace projects.
- `corepack pnpm --filter @scholar-scout/web run typecheck` - passed.
- Confirmed `pnpm-lock.yaml` importers: `.`, `apps/web`, `services/http-data-service`, and `services/codex-webhook-runner`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The initial lockfile generation was blocked on dependency-registry resolution. After registry access was approved, Corepack resolved the pinned pnpm release and regenerated the graph successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The pnpm-only workspace and frozen root lockfile are ready for CI, Vercel, and documentation updates in the remaining Phase 1 plans.

## Self-Check: PASSED

- Required workspace manifests, portable pnpm helpers, root lockfile, and this summary exist.
- Legacy `package-lock.json` and `apps/web/pnpm-lock.yaml` are absent.
- Task commits `df5a334`, `5882d2c`, and `3f5b4b0` exist in Git history.

---
*Phase: 01-release-and-ci-baseline*
*Completed: 2026-07-25*
