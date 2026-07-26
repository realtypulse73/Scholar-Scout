---
phase: 01-release-and-ci-baseline
verified: 2026-07-26T03:26:17Z
status: gaps_found
score: 0/3 must-haves verified
behavior_unverified: 2
overrides_applied: 0
gaps:
  - truth: "A maintainer can install dependencies with one documented immutable package-manager and lockfile path, and use it for local development, CI, and Vercel builds."
    status: failed
    reason: "AGENTS.md is an active project instruction file but still directs developers to npm, package-lock.json, npm workspaces, and npm install/run commands, contradicting the checked-in pnpm-only contract."
    artifacts:
      - path: AGENTS.md
        issue: "Stale package-manager, lockfile, local-development, CI, and Vercel guidance at lines 36-37, 72, 77-78, 113, 264, and 267."
    missing:
      - "Regenerate or update AGENTS.md from current repository evidence so it documents only pnpm@10.34.5/Corepack, pnpm-lock.yaml, frozen install, and current pnpm workspace commands."
  - truth: "The Node 20 lifecycle checkpoint is linked to an accountable supported-Node target, owner, and timing before this baseline is accepted as long-lived."
    status: failed
    reason: "The Phase 1 validation contract makes this a phase-close requirement, but the readiness checklist retains an unresolved TODO instead of the required issue or ADR URL."
    artifacts:
      - path: docs/production-readiness-checklist.md
        issue: "Line 145 says `TODO: add the accountable issue or ADR URL before the next release policy is approved.`"
    missing:
      - "Create or identify the accountable Node-upgrade issue/ADR and replace the TODO with its link, owner, target, and timing."
behavior_unverified_items:
  - truth: "Every pull request reports Scholar Scout build, typecheck, lint, and test results without an unrelated CrimClock job failing the pipeline."
    test: "Open a draft PR against main and inspect the check list and results."
    expected: "Exactly the six ScholarScout checks report independently; no CrimClock/Python job appears."
    why_human: "The workflow definition and local commands are present and pass, but repository evidence cannot prove GitHub actually scheduled the jobs for a PR."
  - truth: "A maintainer can distinguish a failed Scholar Scout quality check from a clean, releasable pull request."
    test: "Inspect the main ruleset/branch protection after a successful draft PR."
    expected: "Only the six exact ScholarScout checks are required, branches must be current, pull requests are required, and direct pushes are blocked."
    why_human: "Required-check and direct-push settings live in GitHub, not in the repository."
---

# Phase 1: Release and CI Baseline Verification Report

**Phase Goal:** Maintainers can reproduce a clean Scholar Scout build and use pull-request checks as a reliable release signal.
**Verified:** 2026-07-26T03:26:17Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | One documented immutable package-manager and lockfile path works locally, in CI, and in Vercel. | ✗ FAILED | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, CI, Vercel config, and active runbooks use pnpm, but `AGENTS.md` still prescribes npm/package-lock paths. This violates the single documented-path contract. |
| 2 | Every PR reports Scholar Scout build, typecheck, lint, and test results without CrimClock. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `.github/workflows/ci.yml` has exactly six independently named PR/main jobs, no path filters, no CrimClock/Python references, and every mapped command passed locally. No draft-PR check evidence exists. |
| 3 | A maintainer can distinguish a failed Scholar Scout check from a clean, releasable PR. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The six fixed names are documented in the PR template and Vercel handoff, but no GitHub ruleset/branch-protection evidence establishes required checks, current-branch enforcement, or direct-push restriction. |

**Score:** 0/3 truths verified (2 present, behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `package.json` + `pnpm-workspace.yaml` + `pnpm-lock.yaml` | Pinned shared workspace contract | ✓ VERIFIED | `pnpm@10.34.5`; Node 20; required workspace importers (`.`, web, and both services); stale root/nested locks absent. Frozen install passed with pnpm 10.34.5. |
| `scripts/pnpm-portable.ps1` + `scripts/use-portable-node.ps1` | Portable Corepack pnpm path | ✓ VERIFIED | Both portable activation and pnpm `--version` completed successfully with v20.20.2 / pnpm 10.34.5. |
| `.github/workflows/ci.yml` | Six independent Scholar Scout quality jobs | ✓ VERIFIED (static) | Six jobs, exact names, PR/main triggers, Corepack, frozen install, one mapped command per job, and no CrimClock/Python job. Hosted execution remains unverified. |
| `vercel.json` | Frozen pnpm Vercel build path | ✓ VERIFIED (static) | `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm build:vercel`; actual Vercel use needs maintainer evidence. |
| `.github/workflows/post-deploy-smoke.yml` | Production-only smoke and incident workflow | ✓ VERIFIED (static) | Filters `vercel.deployment.success` to `production`, maps event URL to `SCHOLARSCOUT_SMOKE_BASE_URL`, retains JSON artifact, and has a scoped issue-alert job. Event delivery and failure path need external evidence. |
| `AGENTS.md` | Current project instructions | ✗ STALE / BLOCKER | Its generated stack guidance still presents npm and two removed lockfiles as the supported project contract. |
| `docs/production-readiness-checklist.md` | Node runtime lifecycle ownership | ✗ STUB / BLOCKER | The mandatory external decision reference is an unresolved TODO. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `package.json` | `pnpm-lock.yaml` | pinned Corepack pnpm frozen install | ✓ WIRED | Bundled Node/Corepack selected pnpm 10.34.5 and `pnpm install --frozen-lockfile --ignore-scripts` succeeded. |
| `.github/workflows/ci.yml` | `pnpm-lock.yaml` | six Corepack/frozen installs | ✓ WIRED (static) | Each of the six jobs contains the same frozen install; mapped local commands passed. |
| Vercel production-success event | post-deploy workflow | `repository_dispatch` production guard | ⚠️ EXTERNAL | YAML is wired, but no Vercel dispatch run proves delivery. |
| post-deploy workflow | `scripts/production-smoke.mjs` | `SCHOLARSCOUT_SMOKE_BASE_URL` then `pnpm run smoke:production` | ✓ WIRED (static) | Payload URL reaches the existing root script; production-tooling tests exercise smoke-script success/failure behavior, not Actions event delivery. |
| smoke failure alert | incident runbook | issue body link to `docs/production-incident-response.md` | ✓ WIRED (static) | Alert body is idempotent, contains non-secret evidence fields, and states no automatic rollback. Controlled failure is still unproven. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `post-deploy-smoke.yml` | `SCHOLARSCOUT_SMOKE_BASE_URL` | `github.event.client_payload.url` | Event-provided production URL is passed to the existing smoke command | ✓ FLOWING (static); event delivery needs human evidence |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Pinned immutable workspace install | bundled `pnpm install --frozen-lockfile --ignore-scripts` | pnpm 10.34.5; lockfile up to date; exit 0 | ✓ PASS |
| Portable Node/Corepack activation | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-portable-node.ps1` | Node v20.20.2; pnpm 10.34.5; exit 0 | ✓ PASS |
| Web typecheck, lint, Jest, and build | four commands mapped from CI | all exit 0; Jest 22 suites / 133 tests; production build completed | ✓ PASS |
| HTTP fixture tests | `pnpm --filter @scholar-scout/http-data-service test` | 6 passing tests | ✓ PASS |
| Production-tooling behavior | `pnpm test:production-tooling` | 17 passing tests, including portable wrapper and smoke-script failure behavior | ✓ PASS |

Step 7c: SKIPPED — Phase 1 declares no conventional `scripts/**/tests/probe-*.sh` probe.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | 01-02, 01-03, 01-05 | Relevant independent Scholar Scout CI results, no CrimClock | ? NEEDS HUMAN | Static workflow and all six commands pass, but a draft-PR execution and GitHub required-check configuration were not retained. |
| OPS-05 | 01-01 through 01-05 | One documented immutable package-manager and lockfile path | ✗ BLOCKED | The code and current runbooks use pnpm, but `AGENTS.md` remains authoritative-looking npm/package-lock guidance. |

No requirement mapped to Phase 1 is orphaned from the plans.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | 36-37, 72, 77-78, 113, 264, 267 | stale active npm/package-lock instructions | 🛑 BLOCKER | Maintainers are given a second, contradictory package-manager path. |
| `docs/production-readiness-checklist.md` | 145 | unresolved `TODO` for required Node upgrade issue/ADR | 🛑 BLOCKER | The explicit Phase 1 lifecycle checkpoint has no owner, target, or timing reference. |

## External Maintainer Evidence Required After Gap Closure

1. **Draft PR CI execution**

   **Test:** Open a PR to `main` and retain its checks.
   **Expected:** The six exact `ScholarScout / ...` checks run independently with no CrimClock check.
   **Why human:** GitHub Actions scheduling and check reporting are external runtime behavior.

2. **GitHub main protection**

   **Test:** Export or screenshot the `main` ruleset/branch protection.
   **Expected:** Pull requests and up-to-date branches are required; direct pushes are restricted; exactly the six named ScholarScout checks are required.
   **Why human:** These controls are dashboard configuration, not committed source.

3. **Vercel production parity and smoke success**

   **Test:** After a protected merge, retain the Vercel production build log and the dispatched smoke-run/artifact URL.
   **Expected:** Corepack uses pnpm 10.34.5, the frozen install and `pnpm build:vercel` run, and the smoke report targets that event's production URL.
   **Why human:** Vercel settings, Git integration, and event dispatch cannot be proven locally.

4. **Controlled smoke failure**

   **Test:** Trigger a safe failing production-smoke scenario and retain the run, artifact, and created/updated incident issue.
   **Expected:** The issue contains no secret material, links the human rollback runbook, and an accountable maintainer records review with no automatic rollback.
   **Why human:** This is an external failure/alert/response sequence.

## Gaps Summary

The pnpm migration, six CI commands, portable tooling, Vercel configuration, and static post-deploy wiring are substantive and locally validated. Phase 1 nevertheless misses its goal today because the repository's live `AGENTS.md` contradicts the promised single package-manager path, and because the mandatory Node lifecycle decision remains an unresolved TODO. No later roadmap phase explicitly owns either cleanup, so neither is deferred.

_Verified: 2026-07-26T03:26:17Z_
_Verifier: the agent (gsd-verifier)_
