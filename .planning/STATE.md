---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 02
current_phase_name: Authentication, API, AI, and Webhook Controls
status: executing
stopped_at: Completed 02-06-PLAN.md
last_updated: "2026-07-28T03:00:33.498Z"
last_activity: 2026-07-27
last_activity_desc: Phase 02 execution started
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 19
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-25)

**Core value:** Students can confidently discover and act on the education pathways that fit their goals and circumstances.
**Current focus:** Phase 02 — Authentication, API, AI, and Webhook Controls

## Current Position

Phase: 02 (Authentication, API, AI, and Webhook Controls) — EXECUTING
Plan: 8 of 13
Status: Ready to execute
Last activity: 2026-07-27 — Phase 02 execution started

Progress: [███████░░░] 68%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: Not established

**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01-release-and-ci-baseline P01 | 8min | 3 tasks | 11 files |
| Phase 01-release-and-ci-baseline P02 | 34min | 3 tasks | 9 files |
| Phase 01-release-and-ci-baseline P03 | 8 minutes | 2 tasks | 2 files |
| Phase 01-release-and-ci-baseline P04 | 25m | 3 tasks | 9 files |
| Phase 01-release-and-ci-baseline P05 | 35 minutes | 3 tasks | 14 files |
| Phase 01-release-and-ci-baseline P06 | 18 minutes | 2 tasks | 3 files |
| Phase 02 P01 | 1 day | 1 tasks | 1 files |
| Phase 02-authentication-api-ai-and-webhook-controls P02 | 11min | 3 tasks | 10 files |
| Phase 02 P09 | 5min | 3 tasks | 4 files |
| Phase 02-authentication-api-ai-and-webhook-controls P03 | 12min | 3 tasks | 6 files |
| Phase 02 P04 | 32min | 2 tasks | 4 files |
| Phase 02-authentication-api-ai-and-webhook-controls P05 | 4min | 2 tasks | 5 files |
| Phase 02 P06 | 7min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- Prioritize release confidence and security before product expansion.
- Treat the current uncommitted school/community/WNY cluster as a separately validated release slice.
- Modernize whole-document persistence incrementally at high-risk boundaries.
- [Phase ?]: Pinned pnpm@10.34.5 through Corepack for the root workspace and portable Windows tooling.
- [Phase ?]: Use one regenerated root pnpm lockfile, validate it with frozen lifecycle-script-disabled installs, then remove stale locks.
- [Phase ?]: CI reports six independently named Scholar Scout checks, each with a frozen Corepack-pnpm install.
- [Phase ?]: Use pnpm test --runInBand without an extra delimiter so Jest receives the flag correctly under pnpm 10.
- [Phase ?]: Use the Vercel repository-dispatch production URL and deployed SHA for post-deploy smoke evidence.
- [Phase ?]: Keep failed-smoke response as an idempotent incident issue with human-only rollback guidance.
- [Phase ?]: Document the pinned Corepack pnpm path and frozen install as the only supported contributor contract.
- [Phase ?]: Keep Vercel Corepack setup, production-branch protection, and release evidence explicit as maintainer-owned dashboard configuration.
- [Phase ?]: Require protected-main CI, production-only smoke evidence, and an incident acknowledgement before calling a release complete.
- [Phase ?]: Keep Node 20 as the Phase 1 compatibility baseline while requiring a maintainer-owned upgrade target and timeline before it becomes long-lived policy.
- [Phase ?]: Use pnpm process-scoped store configuration in the portable wrapper because pnpm 10 does not accept the prior store flag form.
- [Phase ?]: Use Corepack-selected pnpm@10.34.5, the root pnpm lockfile, and frozen installs as the sole active maintainer contract.
- [Phase ?]: Target Node 24 LTS with the Scholar Scout release maintainer accountable before long-lived release-policy approval; retain Node 20 only as the Phase 1 compatibility boundary.
- [Phase ?]: Use the Vercel-managed Upstash Redis integration in iad1 for atomic rate-limit reservations.
- [Phase ?]: Plan 02-02 must consume Vercel-managed UPSTASH_REDIS_REST_KV_REST_API_URL and UPSTASH_REDIS_REST_KV_REST_API_TOKEN server-side; no repository aliases or secrets.
- [Phase ?]: Use Vercel-managed Upstash REST variables only for atomic, fail-closed rate-limit reservations.
- [Phase ?]: Reserve advisor and credential quotas before KDF, context reads, or OpenAI calls; provider failure returns unavailable.
- [Phase ?]: Reject absent or invalid webhook signatures with safe 503 responses while health remains observable.
- [Phase ?]: Require both an agent endpoint and server-only bearer token for outbound webhook dispatch.
- [Phase ?]: Sanitize and UTF-8 bound webhook job packets before dispatch.
- [Phase ?]: Use a random 256-bit HttpOnly guest cookie with SHA-256 server lookup and no raw-secret persistence.
- [Phase ?]: Keep a migrated guest quota window bound to the account until the seven-day lifecycle expires.
- [Phase ?]: Merge guest shortlist data without overwriting existing account data, and move only the documented private-activity allowlist.
- [Phase ?]: Derive memory, simulation, and analytics ownership only from trusted account or opaque guest actors.
- [Phase ?]: Remove global analytics GET rather than exposing an aggregate view in the personal-data security slice.
- [Phase ?]: Filter referral collections by the resolved student actor instead of exposing global records.
- [Phase ?]: Reject browser identity fields and use exact bounded contracts for engagement actions.
- [Phase ?]: Keep only bounded legacy engagement identity fields for client compatibility and ignore them; ownership always comes from the resolved actor.
- [Phase ?]: Use a strict current allowlist per privileged request; JWT and stored roles are not staff authority.
- [Phase ?]: Record only actor ID, action, route, outcome, and timestamp for privileged authorization evidence.

### Roadmap Evolution

- Phase 7 added: Governed Opportunity and Support Matching

### Pending Todos

None yet.

### Blockers/Concerns

- CI contains an unrelated CrimClock gate and package-manager/lockfile paths are ambiguous.
- User-keyed public APIs, advisor requests, and the webhook runner require fail-closed controls.
- Whole-document storage can silently reset on read failure and lose concurrent updates.
- Rendered admin data controls lack their corresponding privileged routes.
- The uncommitted school/community/WNY work must not be silently merged into unrelated stabilization changes.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260725-sao | Fix the missing admin data import validation route module | 2026-07-25 | 3a150a8 | [260725-sao-fix-the-missing-admin-data-import-valida](./quick/260725-sao-fix-the-missing-admin-data-import-valida/) |
| 260726-0ls | Create an evidence-graded product specification from the student opportunity research briefs | 2026-07-26 | eeed666 | [260726-0ls-create-an-evidence-graded-product-specif](./quick/260726-0ls-create-an-evidence-graded-product-specif/) |
| 260726-0qr | Create a project document index and add it to Codex project guidance | 2026-07-26 | 726e87f | [260726-0qr-create-a-project-document-index-and-add-](./quick/260726-0qr-create-a-project-document-index-and-add-/) |
| 260726-1db | Make the Vercel deployment configuration build Scholar Scout successfully from its monorepo. | 2026-07-26 | 034173e | [260726-1db-make-the-vercel-deployment-configuration](./quick/260726-1db-make-the-vercel-deployment-configuration/) |
| 260726-26d | Make post-deploy smoke target the stable public Scholar Scout Vercel production domain instead of protected dynamic deployment URLs. | 2026-07-26 | 830d702 | [260726-26d-make-post-deploy-smoke-target-the-stable](./quick/260726-26d-make-post-deploy-smoke-target-the-stable/) |
| 260727-tc7 | Create a standalone HTML training module for using GSD effectively | 2026-07-27 | b02cc1e | [260727-tc7-gsd-effective-training](./quick/260727-tc7-gsd-effective-training/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Data platform | Separate analytics store and audited background jobs (DATA-04, DATA-05) | v2 | 2026-07-25 |
| Product expansion | Notifications and moderation analytics (PROD-05, PROD-06) | v2 | 2026-07-25 |

## Session Continuity

Last session: 2026-07-28T03:00:33.465Z
Stopped at: Completed 02-06-PLAN.md
Resume file: None
