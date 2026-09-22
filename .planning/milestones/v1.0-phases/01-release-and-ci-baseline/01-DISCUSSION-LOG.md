# Phase 1: Release and CI Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 1-release-and-ci-baseline
**Areas discussed:** Package-manager standard, Required PR checks, Release gate, Cleanup boundary

---

## Package-manager standard

| Option | Description | Selected |
|--------|-------------|----------|
| Keep npm 10 only | Preserve the existing npm-based configuration. | |
| Migrate to pnpm now | Consolidate dependency management in this phase. | ✓ |
| Temporary dual support | Keep npm and pnpm paths during transition. | |

**User's choice:** Migrate to pnpm now, pin it through `packageManager` and Corepack, use one root lockfile, and require frozen installs everywhere.
**Notes:** Regenerate and review the untracked root lockfile; do not trust it as-is.

---

## Required PR checks

| Option | Description | Selected |
|--------|-------------|----------|
| Full relevant suite | Web, HTTP service, and production-tooling checks on every PR. | ✓ |
| Web app only | Defer service/tooling checks to release time. | |
| Two-tier checks | Restrict some checks to path-specific changes. | |

**User's choice:** Run the full suite as separate named jobs, enforce a strict zero-warning quality gate, and run it on PRs plus pushes to `main`.
**Notes:** CI must provide a clear, trustworthy release signal.

---

## Release gate

| Option | Description | Selected |
|--------|-------------|----------|
| Required checks before merge | Protect `main` with GitHub rules. | ✓ |
| Document policy only | Rely on manual review. | |
| Keep `main` unprotected | CI remains advisory. | |

**User's choice:** Require checks before merge, deploy after successful protected merges, run post-deploy smoke checks, and use alert-driven human rollback on smoke-test failure.
**Notes:** Avoid automatic rollback while data changes are still evolving.

---

## Cleanup boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Atomic pnpm migration | Update all operational entry points and remove obsolete npm artifacts together. | ✓ |
| Follow-up cleanup | Leave temporary ambiguity until later. | |
| Retain npm fallback | Keep npm references indefinitely. | |

**User's choice:** Make cleanup atomic; ignore pnpm caches without deleting local developer caches.
**Notes:** Update CI, Vercel, documentation, and `.gitignore` in the same migration.

---

## the agent's Discretion

Choose the exact Node 20-compatible pnpm version and named-job decomposition while preserving the locked requirements.

## Deferred Ideas

None.
