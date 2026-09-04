# Phase 6: User Setup Required

**Generated:** 2026-09-03
**Phase:** End-to-End Hardening and Release Readiness
**Status:** Incomplete

The implementation and automated tests are repository-owned. The final
candidate rehearsal requires these maintainer-owned Preview controls. Do not
paste any value into issues, artifacts, chat, or committed files.

## GitHub Preview Environment Secrets

| Status | Variable | Source | Add to |
|---|---|---|---|
| [ ] | `VERCEL_TOKEN` | Vercel account token authorized only for the Scholar Scout project | GitHub repository → Environments → Preview → Secrets |
| [x] | `SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS` | Existing Vercel deployment-protection automation secret | GitHub Preview environment secret |
| [x] | `SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY` | Generated runner/server lifecycle capability, also configured only for Vercel Preview | GitHub Preview environment secret |

## Vercel Preview Configuration

- [x] Confirm the Preview environment—not Production—has the durable Blob
  adapter/token and the same generated fixture lifecycle capability. The
  workflow generates its disposable `@example.test` account credentials at
  runtime and never stores them as repository secrets.
- [x] Confirm deployment protection is enabled and the automation bypass is
  restricted to the GitHub Preview environment.
- [ ] Do not set the outage flag in project settings. The workflow applies it
  only to its one-off unaliased outage deployment.

## Protected Preview Tracer Checkpoint

- Candidate commit: `dc5ebf63b8ea6cfc7dc2efabd65f7e0afd6ee17e`
- Preview deployment: `dpl_CspcvYy8K9HKZMMQkuTufYWbEJrs`
- Command: `node scripts/run-preview-release-tracer.mjs`
- UTC: `2026-09-04T23:01:36Z`
- Result: `passed`
- Artifact/run: https://github.com/realtypulse73/Scholar-Scout/actions/runs/33927892557

This proves the candidate-bound protected Preview browser lane and exact fixture
cleanup. It does not replace the separate Preview outage/restoration lane or
the complete prelaunch rehearsal gate.

## Verification

Dispatch **ScholarScout Prelaunch Rehearsal** with the exact candidate commit
and `refs/heads/worktree-agent-*` ref. Expected results:

- candidate quality, high-risk, local browser, protected Preview browser, and
  Preview outage/restoration records all pass for the same commit;
- both deployments are Preview-only and unaliased;
- the generated account uses only the isolated outage data path;
- both generated Blob paths and both temporary deployments are removed;
- the uploaded evidence contains only approved scrubbed fields.

Once every item and the rehearsal pass are confirmed, mark this file Complete.
