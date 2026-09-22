# Phase 1 Validation Contract — Release and CI Baseline

**Purpose:** Define the evidence required to prove OPS-01 and OPS-05, including the external GitHub/Vercel controls that repository-only tests cannot establish.

**Grounding:** This contract implements the `Validation Architecture` in `01-RESEARCH.md`: Jest 30 validates the web workspace; Node's built-in runner validates the HTTP data service and production tooling; frozen installation and GitHub/Vercel event evidence validate the release boundary.

## Required Validation Layers

| Layer | What it proves | Evidence / command | Owner plan |
|---|---|---|---|
| Immutable dependency graph | One regenerated root lockfile can reproduce all workspaces without lifecycle scripts. | `corepack enable`; `corepack pnpm install --frozen-lockfile --ignore-scripts`; lockfile importer review for `.`, `apps/web`, `services/http-data-service`, and `services/codex-webhook-runner`. | 01-01 |
| Six independent quality checks | Web typecheck, lint, Jest, build, HTTP fixture tests, and production-tooling tests each have a separate passing/failing signal. | Run the six final pnpm commands locally; open a draft PR and retain the six displayed check results. | 01-02 |
| Main merge gate | Only the six expected Scholar Scout checks authorize a merge to `main`; direct pushes are blocked. | GitHub ruleset/branch-protection screenshot or export showing the six exact check names, pull-request requirement, up-to-date branch requirement, and direct-push restriction. | 01-03 / 01-04 |
| Vercel parity | Hosted build uses the same root Corepack/pnpm frozen dependency graph after protected `main` merge. | Vercel production deployment log showing Node 20, Corepack-selected pnpm, frozen install, and `pnpm build:vercel`. | 01-03 |
| Post-deploy smoke success | A Vercel production-success dispatch runs the existing smoke suite against that deployment URL and preserves its report. | GitHub Actions run URL and uploaded JSON report artifact for a production event; report records the event URL through `SCHOLARSCOUT_SMOKE_BASE_URL`. | 01-03 |
| Controlled smoke failure and human response | D-12/D-13 failure handling alerts maintainers without exposing secrets or performing rollback automation. | A safe controlled failure run URL, retained report artifact URL, created-or-updated incident issue URL, and maintainer acknowledgement that the linked human rollback procedure was reviewed and no automatic rollback occurred. | 01-03 / 01-05 |
| Active-operator documentation | Contributors and operators execute the same pnpm-only contract and can find the release/incident evidence procedure. | Documentation searches plus command-to-`package.json` comparison across Plans 04–05; no historical backlog/report rewrite. | 01-04 / 01-05 |
| Node lifecycle decision | Node 20 is a bounded Phase 1 compatibility baseline, not an unowned long-term release policy. | Link to the accountable Node upgrade target/timing issue or ADR recorded in `docs/production-readiness-checklist.md`. | 01-05 |

## Commands and Sampling

Run the frozen install before each plan that depends on package resolution. At each wave merge, run all six commands below from the repository root:

```text
pnpm --filter @scholar-scout/web typecheck
pnpm --filter @scholar-scout/web lint
pnpm --filter @scholar-scout/web test -- --runInBand
pnpm --filter @scholar-scout/web build
pnpm --filter @scholar-scout/http-data-service test
pnpm test:production-tooling
```

Use `corepack enable` and `pnpm install --frozen-lockfile --ignore-scripts` before the suite. Do not treat a cache hit, a static YAML search, or a local success as substitute evidence for GitHub required-check configuration or Vercel production behavior.

## Phase-Close Evidence Checklist

- [ ] Root lockfile importer review and clean frozen-install output are retained.
- [ ] A draft PR shows exactly the six expected `ScholarScout / …` checks.
- [ ] GitHub ruleset/branch-protection evidence shows those six checks, pull requests, up-to-date branches, and blocked direct pushes.
- [ ] Vercel production build evidence shows Corepack, pnpm, the frozen install, and root build command.
- [ ] One production-success smoke workflow run has a retained JSON artifact.
- [ ] One safe controlled smoke-failure run has a retained artifact and non-secret incident issue.
- [ ] A maintainer acknowledgement confirms review of the linked human rollback procedure and confirms no automatic rollback occurred.
- [ ] Active documentation uses the final pnpm command contract without rewriting historical backlog/report evidence.
- [ ] The readiness checklist links the accountable Node upgrade target/timing issue or ADR.

## Failure Handling

Failure of any quality command blocks the corresponding named CI check. Failure of frozen installation blocks the migration and requires lockfile/manifests review before stale locks are removed. Failure of post-deploy smoke retains evidence, opens or updates the GitHub incident issue, and requires the documented human assessment/rollback process. The workflow must never promote, revert, or otherwise roll back a deployment automatically while compatible data changes are evolving.
