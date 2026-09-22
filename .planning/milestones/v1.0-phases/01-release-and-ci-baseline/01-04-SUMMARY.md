---
phase: 01-release-and-ci-baseline
plan: 04
subsystem: deployment-operations
tags: [pnpm, corepack, documentation, vercel, github-rulesets, ci]
requires:
  - phase: 01-03
    provides: Frozen pnpm Vercel configuration and production smoke workflow
provides:
  - Pnpm-only contributor, Docker-free, adapter, and HTTP-fixture command guidance
  - Vercel and GitHub handoff instructions for protected production deployment
  - PR template prerequisite aligned with the frozen Corepack installation contract
affects: [contributor-tooling, ci, vercel, deployment, release-operations]
tech-stack:
  added: []
  patterns:
    - Document the root-selected Corepack pnpm version and frozen install before repository commands.
    - Separate committed Vercel configuration from maintainer-owned Vercel and GitHub dashboard controls.
key-files:
  created: [.planning/phases/01-release-and-ci-baseline/01-04-SUMMARY.md]
  modified:
    - README.md
    - docs/docker-free-development.md
    - docs/http-data-adapter-runbook.md
    - docs/vercel-blob-data-adapter.md
    - services/http-data-service/README.md
    - docs/vercel-deployment.md
    - docs/vercel-permissions-handoff.md
    - docs/vercel-docker-workaround.md
    - .github/PULL_REQUEST_TEMPLATE.md
key-decisions:
  - "Document pnpm 10.34.5 through Corepack with a frozen, lifecycle-script-disabled install as the sole supported contributor path."
  - "Treat Vercel Corepack setup, the production branch, and GitHub required-check protection as external dashboard configuration with retained evidence."
patterns-established:
  - "Use pnpm --filter for web and HTTP-service workspace commands in contributor-facing docs."
  - "Name CI checks exactly as .github/workflows/ci.yml when describing branch protection or PR validation."
requirements-completed: [OPS-05]
coverage:
  - id: D1
    description: Pnpm-only contributor, adapter, Docker-free, and HTTP-service documentation follows the frozen Corepack command contract.
    requirement: OPS-05
    verification:
      - kind: integration
        ref: powershell.exe -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 install --frozen-lockfile --ignore-scripts
        status: pass
      - kind: integration
        ref: portable Corepack pnpm --filter @scholar-scout/http-data-service test
        status: pass
      - kind: other
        ref: stale npm command and required pnpm documentation scans
        status: pass
    human_judgment: false
  - id: D2
    description: Vercel and GitHub handoff documentation identifies the protected production deployment contract and the evidence to retain.
    requirement: OPS-05
    verification:
      - kind: other
        ref: Vercel handoff static command/check-name scan
        status: pass
    human_judgment: true
    rationale: Vercel Production environment settings, GitHub ruleset enforcement, and production build evidence require maintainer dashboard access.
  - id: D3
    description: PR template contains the frozen Corepack prerequisite and CI's six exact pnpm commands.
    requirement: OPS-05
    verification:
      - kind: other
        ref: template-to-.github/workflows/ci.yml check-name comparison
        status: pass
    human_judgment: false
metrics:
  duration: 25 minutes
  completed: 2026-07-25
  tasks_completed: 3
  files_modified: 9
status: complete
---

# Phase 01 Plan 04: Contributor and Vercel Documentation Summary

**Pnpm-only contributor guidance and protected Vercel deployment handoffs now use the pinned Corepack 10.34.5 contract, frozen installs, and CI-aligned branch protection.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-25T22:37:00-04:00
- **Completed:** 2026-07-25T23:02:08-04:00
- **Tasks:** 3/3
- **Files modified:** 9

## Accomplishments

- Replaced active contributor, Docker-free, adapter, and HTTP-fixture command paths with Corepack-selected pnpm 10.34.5 and the frozen lifecycle-script-disabled install.
- Documented Vercel's committed root build contract alongside the maintainer-owned Production Corepack variable, protected `main` branch, GitHub ruleset, and evidence-retention steps.
- Added the frozen-install prerequisite to the PR template while preserving its six CI commands and existing safety prompts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert contributor and local-service guides to frozen pnpm** - `5f653ca` (docs)
2. **Task 2: Document Vercel's protected Corepack deployment contract** - `e038b09` (docs)
3. **Task 3: Keep pull-request instructions synchronized after documentation migration** - `fb1930a` (docs)

## Files Created/Modified

- `README.md` - establishes the primary Corepack/pnpm contributor path and workspace commands.
- `docs/docker-free-development.md` - preserves portable Node guidance through the pnpm helper.
- `docs/http-data-adapter-runbook.md`, `docs/vercel-blob-data-adapter.md`, and `services/http-data-service/README.md` - retain adapter contracts while using pnpm commands.
- `docs/vercel-deployment.md`, `docs/vercel-permissions-handoff.md`, and `docs/vercel-docker-workaround.md` - distinguish committed build settings from required Vercel/GitHub dashboard configuration.
- `.github/PULL_REQUEST_TEMPLATE.md` - includes the Corepack frozen-install prerequisite before the six CI commands.

## Decisions Made

- Made the root `packageManager` pin, `corepack enable`, and `pnpm install --frozen-lockfile --ignore-scripts` explicit in active setup guidance.
- Documented GitHub/Vercel controls as manual operator configuration, not as claims that repository files enforce those settings.

## Verification

- Passed: active contributor/deployment guide scans found no standalone `npm` command references and confirmed required pnpm/Corepack strings.
- Passed: `powershell.exe -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 install --frozen-lockfile --ignore-scripts` recreated dependencies from the frozen root lockfile with pnpm 10.34.5.
- Passed: portable Corepack `pnpm --filter @scholar-scout/http-data-service test` (with the portable Node directory on `PATH`) ran all six HTTP fixture tests successfully.
- Passed: PR-template commands and labels were compared with `.github/workflows/ci.yml`; all six exact labels match.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The portable validation shell required PowerShell's one-process execution-policy bypass and an explicit portable Node `PATH`. The frozen install and filtered service test then passed. The documented wrapper remains used only for the root commands it supports; filtered workspace examples use the standard pnpm syntax after Corepack setup.

## Known Stubs

None.

## User Setup Required

External configuration is still required before the production release gate is proven:

1. In Vercel, set `ENABLE_EXPERIMENTAL_COREPACK=1` for Production and keep Git integration's Production Branch on `main`.
2. In GitHub, configure the `main` ruleset/branch protection after successful CI runs appear: require pull requests, up-to-date branches, restricted direct pushes, and the six documented ScholarScout checks.
3. Retain GitHub ruleset evidence and a Vercel production build log showing Corepack, the frozen install, and `pnpm build:vercel` after a protected merge.

## Next Phase Readiness

The repository now presents one executable pnpm route to contributors and operators. The Phase 1 external GitHub/Vercel evidence and controlled smoke-failure evidence remain maintainer actions before the release gate is fully demonstrated.

## Self-Check: PASSED

- All nine documented files and this summary exist.
- Task commits `5f653ca`, `e038b09`, and `fb1930a` exist in Git history.
- The pre-existing user-owned `.planning/config.json` change remains unstaged and untouched.

---
*Phase: 01-release-and-ci-baseline*
*Completed: 2026-07-25*
