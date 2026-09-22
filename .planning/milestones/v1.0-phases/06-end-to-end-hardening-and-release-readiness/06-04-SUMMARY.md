---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 04
subsystem: high-risk failure contracts
tags: [api, webhook, persistence, preview, testing]
dependency_graph:
  requires: [02-08, 05-05]
  provides: [deterministic no-write failure coverage]
  affects: [release-readiness, preview-uat]
tech_stack:
  added: []
  patterns: [Preview-only outage seam, route no-write assertions, ephemeral HTTP integration]
key_files:
  created:
    - apps/web/lib/server/community-submission.ts
    - apps/web/__tests__/api/campus-notes.test.ts
    - apps/web/__tests__/api/peer-connections.test.ts
  modified:
    - apps/web/__tests__/api/advisor-chat.test.ts
    - apps/web/__tests__/api/account-guest-routes.test.ts
    - apps/web/app/api/campus-notes/route.ts
    - apps/web/app/api/peer-connections/route.ts
    - services/codex-webhook-runner/test/server.test.mjs
    - services/http-data-service/test/server.test.mjs
decisions:
  - Keep Preview outage injection inert outside Vercel Preview and return a stable no-detail 503 before request parsing or writes.
metrics:
  duration: 16m
  completed: 2026-09-08
status: complete
---

# Phase 06 Plan 04: High-Risk Failure Contracts Summary

Deterministic route and service coverage now proves unavailable provider and malformed persistence paths fail closed without writes or disclosure.

## Completed Tasks

1. Tightened advisor and student account route assertions for provider-safe fallback, unavailable quota behavior, and conflict recovery.
2. Added a Preview-only community submission outage seam and direct campus-note/inbox no-write route coverage.
3. Added webhook and HTTP persistence integration cases proving downstream dispatch stops and malformed replacement input preserves the winning document.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand __tests__/api/advisor-chat.test.ts __tests__/api/account-guest-routes.test.ts __tests__/api/campus-notes.test.ts __tests__/api/peer-connections.test.ts` — 4 suites, 18 tests passed.
- `pnpm --filter @scholar-scout/codex-webhook-runner test` — 9 tests passed.
- `pnpm --filter @scholar-scout/http-data-service test` — 13 tests passed.

## Deviations from Plan

### Authorized Scope Expansion

**1. [Rule 4 - Architecture] Added the missing Preview community outage seam**
- **Found during:** Task 2
- **Issue:** The planned campus/peer route tests and `reserveCommunitySubmission()` implementation did not exist in the checkout.
- **Fix:** After explicit authorization, added a server-only Preview-gated reservation seam, checked before both community create operations, with narrow direct tests.
- **Files modified:** `apps/web/lib/server/community-submission.ts`, campus/peer routes and their test suites.
- **Commit:** `d28ffe3`

## Known Stubs

None.

## Self-Check: PASSED

- Confirmed all new route test and server-seam files exist.
- Confirmed task commits `91b3c4d`, `d28ffe3`, and `a9c7f93` are present in git history.
