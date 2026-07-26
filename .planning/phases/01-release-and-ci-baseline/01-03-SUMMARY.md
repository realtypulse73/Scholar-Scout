---
phase: 01-release-and-ci-baseline
plan: 03
subsystem: deployment-operations
tags: [vercel, github-actions, pnpm, corepack, production-smoke, incident-response]
requires:
  - phase: 01-02
    provides: Corepack-enabled frozen pnpm workflow convention and stable Scholar Scout CI checks
provides:
  - Frozen Corepack-pnpm Vercel install and root build configuration
  - Production-only Vercel deployment smoke workflow with retained report evidence
  - Idempotent GitHub incident issue linking the human rollback runbook
affects:
  - Vercel production deployment
  - GitHub deployment automation
  - Production incident response
tech-stack:
  added: []
  patterns:
    - Filter Vercel repository-dispatch smoke jobs by production environment before loading smoke secrets.
    - Preserve smoke evidence and notify maintainers through a single idempotent, non-secret GitHub issue.
key-files:
  created:
    - .github/workflows/post-deploy-smoke.yml
    - .planning/phases/01-release-and-ci-baseline/01-03-SUMMARY.md
  modified:
    - vercel.json
key-decisions:
  - Use Vercel's event payload URL and deployed commit SHA, rather than a static production URL or preview event.
  - Keep rollback a data-safe human decision; incident automation only records evidence and directs maintainers to the runbook.
patterns-established:
  - Production deploy verification consumes the existing smoke script and production-monitor report conventions instead of duplicating probes.
requirements-completed: [OPS-01, OPS-05]
coverage:
  - id: D1
    description: Vercel uses the frozen pnpm workspace install and root build command.
    requirement: OPS-05
    verification:
      - kind: integration
        ref: corepack pnpm install --frozen-lockfile --ignore-scripts && corepack pnpm build:vercel
        status: pass
    human_judgment: true
    rationale: Vercel log inspection and dashboard configuration are required to prove the hosted deployment uses this path.
  - id: D2
    description: A Vercel production-success event runs smoke checks against its own URL and creates an incident on failure.
    requirement: OPS-01
    verification:
      - kind: other
        ref: git diff --check and static post-deploy workflow verification
        status: pass
    human_judgment: true
    rationale: GitHub/Vercel dispatch, retained artifact, controlled failure, alert issue, and human rollback review require external evidence.
metrics:
  duration: 8 minutes
  completed: 2026-07-26
  tasks_completed: 2
  files_modified: 2
status: complete
---

# Phase 01 Plan 03: Production Deployment Smoke Summary

**Vercel now builds through the pinned frozen pnpm workspace path, and each production-success deployment can run the established smoke suite against its own event URL with durable human-response incident evidence.**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-07-26T02:45:01Z
- **Completed:** 2026-07-26T02:53:14Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Configured Vercel to install the reviewed workspace graph with `pnpm install --frozen-lockfile --ignore-scripts` and run the root `pnpm build:vercel` command while retaining the Next.js framework and `apps/web/.next` output.
- Added a `vercel.deployment.success` workflow whose smoke job runs only for a production payload, checks out the event's deployed SHA, and passes the event URL through `SCHOLARSCOUT_SMOKE_BASE_URL` to the existing smoke suite.
- Preserved JSON and Markdown smoke evidence on every result and added an idempotent issue alert that includes only the deployment URL, commit SHA, run/artifact links, and a relative human-rollback runbook link.

## Task Commits

1. **Task 1: Make Vercel use the pinned frozen pnpm build path** - `f415efb` (chore)
2. **Task 2: Add a production-only post-deploy smoke and failure-alert workflow** - `3112de4` (feat)

## Files Created/Modified

- `vercel.json` - Uses the frozen Corepack-selected pnpm install and root Vercel build script.
- `.github/workflows/post-deploy-smoke.yml` - Runs production-event smoke checks, retains report artifacts, and creates or updates a non-secret incident issue after failures.

## Verification

- Passed: static Vercel configuration check confirmed the exact install/build commands and preserved framework/output settings.
- Passed: `corepack pnpm install --frozen-lockfile --ignore-scripts` using bundled Node 20/Corepack and pnpm 10.34.5.
- Passed: `corepack pnpm build:vercel` (Next.js production build).
- Passed: `git diff --check` and static workflow checks for the dispatch type, production guard, event URL, smoke secrets, evidence artifact, issue permission, and runbook link.

## Decisions Made

- Use `github.event.client_payload.url` and `github.event.client_payload.git.sha`, matching Vercel's repository-dispatch contract so smoke checks verify the deployed production revision rather than a static or preview URL.
- Scope `issues: write` to the alert job alone. The incident body contains no secrets, cookies, environment values, or data exports.
- Do not automate rollback. The alert points maintainers to `docs/production-incident-response.md` for a data-safe, human decision.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## User Setup Required

Repository changes are complete, but the following dashboard and production-evidence actions require a maintainer:

1. In GitHub **Settings → Rules → Rulesets** (or branch protection), require pull requests, an up-to-date branch, blocked direct pushes, and exactly these six successful checks: `ScholarScout / Web typecheck`, `ScholarScout / Web lint`, `ScholarScout / Web Jest`, `ScholarScout / Web build`, `ScholarScout / HTTP data-service tests`, and `ScholarScout / Production-tooling tests`.
2. In Vercel **Project Settings → Environment Variables**, add `ENABLE_EXPERIMENTAL_COREPACK=1` for **Production**. In **Project Settings → Git**, keep `main` as the production branch, keep Git integration connected, and verify production deployments emit `vercel.deployment.success` repository-dispatch events.
3. After a protected merge, retain a Vercel build-log URL showing pnpm 10.34.5, the frozen install command, and `pnpm build:vercel`; retain the triggered smoke workflow run and its `production-smoke-report` artifact.
4. Run one safe controlled smoke failure against a non-production-impacting endpoint. Retain its run URL, report artifact URL, and created-or-updated incident issue URL. A maintainer must record acknowledgement that `docs/production-incident-response.md` was reviewed and that no automatic rollback occurred.

## Next Phase Readiness

The repository now has the deployment-time command and event workflow needed for production verification. External GitHub/Vercel setup and controlled-failure evidence remain required before the phase's operational release gate can be considered proven.

## Self-Check: PASSED

- `vercel.json` and `.github/workflows/post-deploy-smoke.yml` exist.
- Task commits `f415efb` and `3112de4` exist in Git history.
- The only remaining uncommitted workspace change is the pre-existing user-owned `.planning/config.json`.

---
*Phase: 01-release-and-ci-baseline*
*Completed: 2026-07-26*
