---
phase: 01-release-and-ci-baseline
plan: 05
subsystem: deployment-operations
tags: [pnpm, corepack, release-runbook, incident-response, production-smoke, node-20]
requires:
  - phase: 01-04
    provides: Pnpm-only contributor and deployment guides with a protected-main handoff
provides:
  - Pnpm-only release, readiness, incident, provider, and automation handoffs
  - Controlled production-smoke incident evidence with human-only rollback authority
  - Tested generated operator guidance and a Corepack portable pnpm wrapper
affects: [release-operations, github-actions, vercel, production-incident-response]
tech-stack:
  added: []
  patterns:
    - Use Corepack-selected pnpm and frozen installs in every active operator path.
    - Treat post-deploy smoke failure as retained evidence and a human rollback decision, never automated reversal.
key-files:
  created: [.planning/phases/01-release-and-ci-baseline/01-05-SUMMARY.md]
  modified:
    - docs/production-release-runbook.md
    - docs/production-incident-response.md
    - docs/production-readiness-checklist.md
    - scripts/pnpm-portable.ps1
    - scripts/test-production-tooling.mjs
key-decisions:
  - "Require protected-main CI, production-only smoke evidence, and an incident acknowledgement before calling a release complete."
  - "Keep Node 20 as the Phase 1 compatibility baseline while requiring a maintainer-owned upgrade target and timeline before it becomes long-lived policy."
  - "Use pnpm's process-scoped store configuration in the portable wrapper because pnpm 10 does not accept the prior store flag form."
patterns-established:
  - "Generated handoffs and report help must be covered by production-tooling assertions before their command vocabulary changes."
requirements-completed: [OPS-01, OPS-05]
coverage:
  - id: D1
    description: Active release, readiness, incident, provider, and automation handoffs use the frozen Corepack pnpm contract and name protected-main release evidence.
    requirement: OPS-05
    verification:
      - kind: other
        ref: thirteen-file legacy-command and release-evidence scans
        status: pass
    human_judgment: true
    rationale: Protected-main ruleset configuration, Vercel dispatch, retained external artifacts, and incident acknowledgement require maintainer evidence.
  - id: D2
    description: Generated operator guidance and production report help emit pnpm commands through the tested portable Corepack wrapper.
    requirement: OPS-01
    verification:
      - kind: integration
        ref: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 test:production-tooling
        status: pass
    human_judgment: false
metrics:
  duration: 35 minutes
  completed: 2026-07-26
  tasks_completed: 3
  files_modified: 14
status: complete
---

# Phase 01 Plan 05: Operational Release Handoffs Summary

**Production operators now follow one frozen Corepack/pnpm release path with protected-main evidence, production-only smoke artifacts, non-secret alert issues, and a deliberate human rollback procedure.**

## Performance

- **Duration:** 35 minutes
- **Completed:** 2026-07-26
- **Tasks:** 3/3
- **Files modified:** 14

## Accomplishments

- Converted active release, readiness, incident, provider, OAuth, automation, and quality guidance to Corepack-selected pnpm commands.
- Required protected `main`, all six named CI checks, production-success smoke reports, incident issue links, and a human rollback acknowledgement as release evidence.
- Added production-tooling coverage for generated pnpm handoffs/report help and restored the portable pnpm wrapper using the Corepack shim with a repository-local ignored store.

## Task Commits

1. **Task 1: Convert readiness, release, incident, and provider runbooks to pnpm** - `6d64265` (docs)
2. **Task 2: Align remaining active automation and quality handoffs** - `a50c734` (docs)
3. **Task 3 RED: Add pnpm operator guidance coverage** - `a439235` (test)
4. **Task 3 GREEN: Emit pnpm production guidance** - `9626e0a` (feat)
5. **Rule 1 correction: Match documented Jest command to CI** - `7aee240` (fix)

## Files Created/Modified

- `docs/production-release-runbook.md` - frozen dependency prerequisite and protected production-release evidence.
- `docs/production-incident-response.md` - controlled smoke-failure record and data-safe human rollback authority.
- `docs/production-readiness-checklist.md` - six CI commands, release evidence, and Node lifecycle checkpoint.
- `docs/production-secret-provider-notes.md`, `docs/google-oauth-permissions-handoff.md`, and `docs/github-oauth-first-handoff.md` - provider guidance using active pnpm commands.
- `services/codex-webhook-runner/README.md`, `docs/chatgpt-codex-github-sync.md`, and `docs/scholarscout-rubric.md` - automation/quality handoffs tied to the protected-main release runbook.
- `scripts/test-production-tooling.mjs`, `scripts/provision-production-values.mjs`, `scripts/provision-environment.mjs`, and `scripts/production-report-summary.mjs` - tested generated pnpm guidance.
- `scripts/pnpm-portable.ps1` - Corepack pnpm shim with a process-scoped repository store.

## Verification

- Passed frozen install: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 install --frozen-lockfile --ignore-scripts`.
- Passed all six quality gates: web typecheck, lint, Jest (22 suites/133 tests), production build, HTTP data-service tests (6 tests), and production-tooling tests (17 tests).
- Passed the thirteen-file legacy-command scan, release/incident evidence scan, and `git diff --check`.

## Decisions Made

- Release completion now requires protected-main and post-deploy smoke evidence; local command results alone do not authorize a release.
- A failed smoke check opens or updates a non-secret issue and records evidence, but rollback remains an incident-owner decision after fresh snapshot/export safeguards.
- Node 20 remains in place only as a bounded Phase 1 baseline; the next long-lived release policy requires a maintainer-owned issue or ADR naming the supported target, owner, and timing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the portable pnpm store configuration**
- **Found during:** Task 3
- **Issue:** pnpm 10 interpreted the wrapper's CLI `--store-dir` form as a command, preventing `pnpm test:production-tooling` from running.
- **Fix:** Invoke the Corepack-created `pnpm.cmd` shim and pass the ignored repository store through process-scoped `npm_config_store_dir`.
- **Files modified:** `scripts/pnpm-portable.ps1`
- **Verification:** The portable wrapper accepted `--version`, the production-tooling suite passed, and frozen installation completed.
- **Committed in:** `9626e0a`

**2. [Rule 1 - Bug] Matched documented Jest invocation to CI**
- **Found during:** Overall verification
- **Issue:** The extra delimiter in `pnpm --filter @scholar-scout/web test -- --runInBand` was forwarded literally to Jest, so it searched for a `--runInBand` test pattern.
- **Fix:** Use the CI command `pnpm --filter @scholar-scout/web test --runInBand` in active handoffs.
- **Files modified:** `docs/production-readiness-checklist.md`, `docs/chatgpt-codex-github-sync.md`, `docs/scholarscout-rubric.md`
- **Verification:** All 22 Jest suites and 133 tests passed.
- **Committed in:** `7aee240`

**Total deviations:** 2 auto-fixed (1 blocking issue, 1 bug).

## Known Stubs

- `docs/production-readiness-checklist.md:145` - The Node upgrade decision link is intentionally a maintainer-owned checkpoint. It must be replaced with the accountable issue or ADR URL before Node 20 is treated as a long-lived release baseline.

## User Setup Required

Before the phase's production gate is considered externally proven, a maintainer must retain:

1. GitHub ruleset/branch-protection evidence for protected `main` and the six exact checks.
2. A Vercel Production build log and a production-success smoke workflow run with its report artifact.
3. A safe controlled smoke-failure run, its non-secret alert issue, and a written acknowledgement that the human rollback runbook was reviewed and no automatic rollback occurred.
4. The Node upgrade target/owner/timing issue or ADR linked from the readiness checklist.

## Next Phase Readiness

The repository now has pnpm-only operational guidance and executable production-tooling coverage. External GitHub/Vercel evidence and the Node lifecycle decision remain maintainer actions.

## Self-Check: PASSED

- All fourteen Plan 05 implementation files and this summary exist.
- Task commits `6d64265`, `a50c734`, `a439235`, `9626e0a`, and `7aee240` exist in Git history.
- The pre-existing user-owned `.planning/config.json` change remains unstaged and untouched.
