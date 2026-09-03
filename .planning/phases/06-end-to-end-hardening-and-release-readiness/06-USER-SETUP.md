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
| [ ] | `SCHOLARSCOUT_VERCEL_PROTECTION_BYPASS` | Existing Vercel deployment-protection automation secret | GitHub Preview environment secret |
| [ ] | `SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY` | Generated runner/server lifecycle capability, also configured only for Vercel Preview | GitHub Preview environment secret |

## Vercel Preview Configuration

- [ ] Confirm the Preview environment—not Production—has the durable Blob
  adapter/token and the same generated fixture lifecycle capability. The
  workflow generates its disposable `@example.test` account credentials at
  runtime and never stores them as repository secrets.
- [ ] Confirm deployment protection is enabled and the automation bypass is
  restricted to the GitHub Preview environment.
- [ ] Do not set the outage flag in project settings. The workflow applies it
  only to its one-off unaliased outage deployment.

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
