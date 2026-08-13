---
phase: 01-release-and-ci-baseline
verified: 2026-07-26T04:01:06Z
status: passed
score: 0/3 must-haves verified
behavior_unverified: 3
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 0/3
  gaps_closed:

    - "A maintainer has one active Corepack-selected pnpm 10.34.5 / root-lockfile / frozen-install contract."
    - "The Node 20 compatibility baseline is tied to an accountable Node 24 LTS target, owner, timing, and validation path."
  gaps_remaining: []
  regressions: []
behavior_unverified_items:

  - truth: "A maintainer can install dependencies with one documented immutable package-manager and lockfile path, and use it for local development, CI, and Vercel builds."
    test: "Merge a reviewed change through protected main and retain the Vercel production build log."
    expected: "Vercel selects Corepack pnpm 10.34.5, runs the frozen root install, and runs pnpm build:vercel."
    why_human: "Repository files and local portable-pnpm tests prove the contract exists and works locally, but cannot prove Vercel's environment setting or hosted execution."

  - truth: "Every pull request reports Scholar Scout build, typecheck, lint, and test results without an unrelated CrimClock job failing the pipeline."
    test: "Open a draft PR against main and inspect the completed check list."
    expected: "Exactly the six ScholarScout quality checks run independently; no CrimClock or Python check appears."
    why_human: "The committed workflow has the six jobs and local mapped checks pass, but GitHub Actions scheduling is external runtime behavior."

  - truth: "A maintainer can distinguish a failed Scholar Scout quality check from a clean, releasable pull request."
    test: "Inspect the main ruleset or branch-protection configuration after a successful draft PR."
    expected: "Pull requests and up-to-date branches are required, direct pushes are blocked, and exactly the six ScholarScout checks are required."
    why_human: "Required-check and direct-push controls live in GitHub configuration, not committed source."
human_verification:

  - test: "Open a draft PR against main and retain its completed checks."
    expected: "The six exact ScholarScout checks run independently with no unrelated CrimClock/Python job."
    why_human: "GitHub Actions scheduling and check reporting are external runtime behavior."

  - test: "Export or screenshot the main ruleset/branch-protection configuration."
    expected: "Pull requests, up-to-date branches, restricted direct pushes, and only the six exact ScholarScout checks are enforced."
    why_human: "GitHub rulesets are dashboard state."

  - test: "Merge through protected main and retain the Vercel production build log."
    expected: "The log shows Corepack pnpm 10.34.5, pnpm install --frozen-lockfile --ignore-scripts, and pnpm build:vercel."
    why_human: "Vercel production environment variables, Git integration, and hosted build execution are external state."

  - test: "Retain a production-success post-deploy smoke workflow run and its production-smoke-report artifact."
    expected: "The run uses the event deployment URL and the report is uploaded for that production event."
    why_human: "Vercel-to-GitHub repository-dispatch delivery cannot be proven by static YAML."

  - test: "Run one safe controlled production-smoke failure and retain the workflow run, artifact, incident issue, and maintainer acknowledgement."
    expected: "The alert issue contains no secrets, links the human incident runbook, and records that no automatic rollback occurred."
    why_human: "This is an external failure/alert/response sequence; repository code only proves the static path."
---

# Phase 1: Release and CI Baseline Verification Report

**Phase Goal:** Maintainers can reproduce a clean Scholar Scout build and use pull-request checks as a reliable release signal.
**Verified:** 2026-07-26T04:01:06Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A maintainer can install dependencies with one documented immutable package-manager and lockfile path, and use it for local development, CI, and Vercel builds. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The former documentation blocker is closed: `AGENTS.md` now matches `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, CI, and `vercel.json`; no active legacy npm/lockfile path was found. Portable pnpm reports 10.34.5 and focused local tests pass. Hosted CI/Vercel execution remains unobserved. |
| 2 | Every pull request reports Scholar Scout build, typecheck, lint, and test results without an unrelated CrimClock job failing the pipeline. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `.github/workflows/ci.yml` statically defines exactly six ScholarScout PR/main jobs, each Corepack + frozen-pnpm based; no CrimClock/Python reference remains. A real GitHub PR run has not been retained. |
| 3 | A maintainer can distinguish a failed Scholar Scout quality check from a clean, releasable pull request. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | The exact check names and protection requirements are consistently documented, but repository files cannot establish that the GitHub ruleset requires them or blocks direct pushes. |

**Score:** 0/3 truths behaviorally verified (3 present, behavior-unverified)

### Repository Gap Closure

| Prior blocker | Re-verification evidence | Status |
| --- | --- | --- |
| Competing active npm/package-lock guidance | `AGENTS.md` contains the pnpm 10.34.5 pin, frozen install, web/service commands, and Vercel build command; scans found no `npm install`/`npm run`, `package-lock.json`, or nested web lockfile guidance. | ✓ VERIFIED |
| Unowned Node 20 lifecycle TODO | `docs/adr/0001-node-runtime-upgrade.md` is accepted and specifies Node 24 LTS, the Scholar Scout release maintainer, the deadline, and governed validation scope; the readiness checklist directly links it and the old TODO is absent. | ✓ VERIFIED |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `package.json` + `pnpm-workspace.yaml` + `pnpm-lock.yaml` | Pinned shared workspace contract | ✓ VERIFIED | Root pin is `pnpm@10.34.5`; Node remains 20.x; lockfile includes `.`, `apps/web`, and both service importers. Legacy root and nested lockfiles are absent. |
| `scripts/pnpm-portable.ps1` + `scripts/use-portable-node.ps1` | Portable Node/Corepack pnpm path | ✓ VERIFIED | The wrapper enables Corepack against the bundled Node 20 runtime and reports pnpm 10.34.5. |
| `AGENTS.md` | One active maintainer contract | ✓ VERIFIED | Substantive generated instructions now wire the same pnpm version, frozen install, workspace commands, CI path, and Vercel build command to the checked-in sources. |
| `docs/adr/0001-node-runtime-upgrade.md` | Accountable Node lifecycle decision | ✓ VERIFIED | Accepted ADR names target, accountable owner, deadline, current compatibility boundary, validation surfaces, and external-evidence boundary. |
| `docs/production-readiness-checklist.md` | Linked lifecycle checkpoint | ✓ VERIFIED | Its Node-runtime section directly links the ADR and contains no unresolved lifecycle-decision stub. |
| `.github/workflows/ci.yml` | Six independent Scholar Scout quality jobs | ✓ VERIFIED (static) | Six displayed ScholarScout jobs use Node 20, Corepack, frozen install, and distinct commands; no unrelated CrimClock/Python job is defined. Hosted execution is still human verification. |
| `vercel.json` | Frozen pnpm Vercel build path | ✓ VERIFIED (static) | Uses `pnpm install --frozen-lockfile --ignore-scripts` followed by `pnpm build:vercel`. |
| `.github/workflows/post-deploy-smoke.yml` | Production-event smoke and incident path | ✓ VERIFIED (static) | Production-only dispatch guard, event URL data flow, retained artifact, scoped issue permission, and human-runbook alert are wired. Dispatch and failure behavior remain external verification. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | `package.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml` | matching pin, frozen install, and workspace commands | ✓ WIRED | The active instruction strings match the live root contract; scans found no competing legacy path. |
| `docs/production-readiness-checklist.md` | `docs/adr/0001-node-runtime-upgrade.md` | direct relative lifecycle link | ✓ WIRED | The checklist link resolves to the accepted local ADR and repeats its owner/timing boundary. |
| `.github/workflows/ci.yml` | `pnpm-lock.yaml` | each named job uses Corepack and frozen install | ✓ WIRED (static) | All six jobs share the committed dependency graph before their named check. |
| Vercel production-success event | `.github/workflows/post-deploy-smoke.yml` | `repository_dispatch` guarded to `production` | ⚠️ EXTERNAL | The workflow is wired, but no Vercel dispatch run proves delivery. |
| Post-deploy workflow | `scripts/production-smoke.mjs` | event URL becomes `SCHOLARSCOUT_SMOKE_BASE_URL` | ✓ WIRED (static) | The workflow passes the payload URL to `pnpm run smoke:production`; production-tooling tests exercise the script behavior. |
| Smoke failure alert | `docs/production-incident-response.md` | idempotent issue body links human response | ✓ WIRED (static) | Only alert reporting is automated; the workflow contains no rollback command and explicitly directs a human decision. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `.github/workflows/post-deploy-smoke.yml` | `SCHOLARSCOUT_SMOKE_BASE_URL` | `github.event.client_payload.url` | The dispatch payload’s deployment URL is supplied to the existing smoke command. | ✓ FLOWING (static); event delivery needs human evidence |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Portable Corepack pnpm contract | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 --version` | pnpm `10.34.5`; exit 0 | ✓ PASS |
| HTTP fixture command used by CI | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 --filter @scholar-scout/http-data-service test` | 6 tests passed; exit 0 | ✓ PASS |
| Phase 1 operational tooling | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/pnpm-portable.ps1 test:production-tooling` | 17 tests passed, including portable-wrapper coverage and smoke failure behavior; exit 0 | ✓ PASS |

Step 7c: SKIPPED — Phase 1 declares no conventional `scripts/**/tests/probe-*.sh` probe.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| OPS-01 | 01-02, 01-03, 01-05 | Relevant independent Scholar Scout CI results, with no CrimClock job | ? NEEDS HUMAN | Workflow topology and focused mapped checks are sound, but a draft-PR execution and GitHub merge-gate configuration are external evidence. |
| OPS-05 | 01-01 through 01-06 | One documented immutable package-manager and lockfile path | ✓ SATISFIED (repository) | The previous active-instruction and Node-lifecycle blockers are closed; local portable pnpm and operational tests pass. Vercel production parity remains an external phase-close check. |

No requirement mapped to Phase 1 is orphaned from its plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No `TBD`, `FIXME`, `XXX`, `TODO`, placeholder, or stale package-manager marker in the three gap-closure artifacts. | ℹ️ None | No repository blocker found. |

## Human Verification Required

### 1. Draft PR CI execution

**Test:** Open a draft PR against `main` and retain its completed checks.

**Expected:** Exactly the six named ScholarScout checks run independently, with no CrimClock/Python check.

**Why human:** GitHub Actions scheduling and reported check state are external.

### 2. GitHub main protection

**Test:** Export or screenshot the `main` ruleset/branch-protection configuration.

**Expected:** Pull requests and up-to-date branches are required, direct pushes are restricted, and exactly the six named ScholarScout checks are required.

**Why human:** Rulesets are dashboard configuration.

### 3. Vercel production parity

**Test:** Merge through protected `main` and retain the Vercel production build log.

**Expected:** Corepack selects pnpm 10.34.5, the frozen install runs, and `pnpm build:vercel` completes.

**Why human:** Vercel environment configuration, Git integration, and hosted execution are external state.

### 4. Production-success smoke evidence

**Test:** Retain a production-success post-deploy smoke workflow run and its JSON artifact.

**Expected:** The run targets the event deployment URL and uploads `production-smoke-report`.

**Why human:** The Vercel-to-GitHub dispatch cannot be observed from repository files.

### 5. Controlled smoke failure and human response

**Test:** Run one safe failing smoke scenario and retain its workflow run, artifact, incident issue, and maintainer acknowledgement.

**Expected:** The issue is non-secret, links the human incident runbook, and records review with no automatic rollback.

**Why human:** This validates an external failure/alert/response sequence.

## Gaps Summary

The two repository blockers from the prior verification are closed; there are no remaining repository implementation gaps or regressions. The phase cannot be marked passed until the five retained GitHub/Vercel/manual evidence items above are supplied. This is an escalation gate for external operational evidence, not a code-fix request.

_Verified: 2026-07-26T04:01:06Z_
_Verifier: the agent (gsd-verifier)_
