---
phase: 01-release-and-ci-baseline
plan: 02
subsystem: continuous-integration
tags: [github-actions, pnpm, corepack, quality-gate]
requires:
  - 01-01
provides:
  - Six independently reported Scholar Scout quality checks for pull requests and main pushes
  - Frozen Corepack-pnpm dependency installation across repository workflows
affects:
  - GitHub Actions quality gates
  - Contributor pull-request verification
  - Portable package-manager tooling coverage
tech_stack:
  added: []
  patterns:
    - One CI job per quality signal
    - Corepack-enabled frozen pnpm installs with lifecycle scripts disabled
key_files:
  created:
    - .planning/phases/01-release-and-ci-baseline/01-02-SUMMARY.md
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/production-readiness.yml
    - .github/workflows/production-monitor.yml
    - .github/workflows/prelaunch-rehearsal.yml
    - .github/workflows/product-ops.yml
    - .github/workflows/autonomous-product-manager.yml
    - .github/PULL_REQUEST_TEMPLATE.md
    - apps/web/components/campus-community/CampusNoteBoard.tsx
    - scripts/test-production-tooling.mjs
decisions:
  - Keep quality checks independently named and avoid an aggregate required-check substitute.
  - Omit optional dependency caching so every job relies only on Corepack and the frozen root lockfile.
  - Forward Jest's run-in-band flag directly through pnpm without an extra delimiter.
metrics:
  duration: 34 minutes
  completed: 2026-07-25
  tasks_completed: 3
  files_modified: 9
status: complete
---

# Phase 01 Plan 02: CI Quality Gate Summary

Six independently visible Scholar Scout checks now run from the same Corepack-enabled, frozen pnpm dependency graph as every operational workflow.

## Delivered

- Replaced the mixed-product CI topology with these stable checks on pull requests to `main` and pushes to `main`:
  - `ScholarScout / Web typecheck`
  - `ScholarScout / Web lint`
  - `ScholarScout / Web Jest`
  - `ScholarScout / Web build`
  - `ScholarScout / HTTP data-service tests`
  - `ScholarScout / Production-tooling tests`
- Removed the unrelated CrimClock/Python CI job and every executable npm install, run, and cache path from repository workflows.
- Preserved production readiness, production monitor, prelaunch rehearsal, product-ops, and autonomous-product-manager triggers, permissions, concurrency, secrets, and artifact handling while moving each to frozen Corepack-pnpm installation.
- Updated the pull-request template to label and document the same six executable pnpm checks.
- Restored the zero-warning web lint gate and aligned production-tooling coverage with the retained `pnpm-portable.ps1` helper.

## Verification

- `pnpm install --frozen-lockfile --ignore-scripts` passed with pnpm 10.34.5.
- `pnpm --filter @scholar-scout/web typecheck` passed.
- `pnpm --filter @scholar-scout/web lint` passed with zero warnings.
- `pnpm --filter @scholar-scout/web test --runInBand` passed: 22 suites, 133 tests.
- `pnpm --filter @scholar-scout/web build` passed.
- `pnpm --filter @scholar-scout/http-data-service test` passed: 6 tests.
- `pnpm test:production-tooling` passed: 16 tests.
- Static workflow checks confirmed exactly six CI quality jobs, six Corepack steps, six frozen installs, the required PR/main triggers, and no executable legacy npm, CrimClock, or Python service paths.

## Decisions Made

- CI has no dependency cache; correctness on a clean frozen install takes precedence and avoids cache trust-boundary complexity.
- The pnpm Jest command uses `test --runInBand`: under pnpm 10, the extra `--` is forwarded literally to Jest and fails the job.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored the zero-warning web lint gate**
- **Found during:** Task 1 verification
- **Issue:** `CampusNoteBoard` omitted `uploaderUsername` from a `useEffect` dependency list, causing the strict lint command to fail.
- **Fix:** Added the missing dependency so filtered notes refresh when the uploader changes.
- **Files modified:** `apps/web/components/campus-community/CampusNoteBoard.tsx`
- **Commit:** `ed38487`

**2. [Rule 1 - Bug] Corrected pnpm Jest argument forwarding**
- **Found during:** Plan-level verification
- **Issue:** `pnpm --filter @scholar-scout/web test -- --runInBand` forwarded a literal delimiter to Jest under pnpm 10, making Jest treat the flag as a test pattern.
- **Fix:** Use `pnpm --filter @scholar-scout/web test --runInBand` in CI and the pull-request template.
- **Files modified:** `.github/workflows/ci.yml`, `.github/PULL_REQUEST_TEMPLATE.md`
- **Commit:** `99de948`

**3. [Rule 1 - Bug] Updated stale portable package-manager coverage**
- **Found during:** Plan-level verification
- **Issue:** The production-tooling test still invoked the removed `npm-portable.ps1` helper.
- **Fix:** Test the Phase 1 `pnpm-portable.ps1` helper instead.
- **Files modified:** `scripts/test-production-tooling.mjs`
- **Commit:** `99de948`

**Total deviations:** 3 auto-fixed Rule 1 issues. **Impact:** The configured CI checks now execute successfully under the pinned pnpm runtime instead of failing on stale or incorrectly forwarded commands.

## Known Stubs

None.

## Self-Check: PASSED

- All nine modified implementation files exist and all five plan commits are present.
- The only remaining worktree change is the user-owned `.planning/config.json` auto-chain setting.
