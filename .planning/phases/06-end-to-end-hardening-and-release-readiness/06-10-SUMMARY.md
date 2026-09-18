---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 10
subsystem: preview-rehearsal
tags: [vercel-blob, preview, e2e, lifecycle, safety]
requires: [06-09]
provides: [fixture-bound-preview-storage, no-write-runtime-preflight]
affects: [prelaunch-rehearsal, e2e-fixture-lifecycle]
tech-stack:
  added: []
  patterns: [server-only-path-guard, authenticated-head-preflight, fixture-scoped-storage]
key-files:
  created: [scripts/provision-preview-rehearsal.test.mjs]
  modified:
    - scripts/provision-preview-rehearsal.mjs
    - scripts/e2e-fixture-lifecycle.mjs
    - apps/web/lib/server/e2e-programme-fixture.ts
    - apps/web/app/api/internal/e2e-fixture/route.ts
    - apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts
    - apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts
decisions:
  - Require an exact fixture-bound Preview Blob configuration before any fixture operation.
  - Perform an authenticated no-write HEAD preflight before lifecycle writes or browser work.
metrics:
  duration: 19m
  completed: 2026-09-18
status: complete
---

# Phase 6 Plan 10: Isolated Preview Fixture Storage Summary

Baseline and outage rehearsal fixtures now use separate fixture-bound Preview Blob locations, and the runtime rejects unsafe storage configuration before accessing the data adapter.

## Completed Work

- Added separate generated storage bindings to the ignored local Preview handoff while keeping generated values out of the provisioning report.
- Required the fixture runtime to be Preview-only, Blob-backed, and configured with the exact path bound to its own fixture identity.
- Added an authenticated no-write `HEAD` preflight before lifecycle provisioning, verification, cleanup, or browser work.
- Ensured a rejected preflight performs no lifecycle write-side request.

## Verification

- `node --test scripts/provision-preview-rehearsal.test.mjs scripts/e2e-fixture-lifecycle.test.mjs` — passed (10 tests).
- `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/server/e2e-programme-fixture.test.ts __tests__/app/api/internal/e2e-fixture/route.test.ts` — passed (2 suites, 17 tests).

## Decisions Made

- Exact runtime equality is required for the fixture-scoped storage configuration; defaults, blanks, external values, malformed values, and another fixture's storage configuration all fail closed.
- The preflight is a no-write `HEAD` request, so an unsafe deployment cannot proceed into provisioning or cleanup traffic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prevented cleanup after a rejected preflight**
- **Found during:** Task 1 focused lifecycle test
- **Issue:** The initial preflight addition still entered the `finally` cleanup path after a rejected `HEAD` request.
- **Fix:** Enabled cleanup registration and execution only after the no-write preflight succeeds.
- **Files modified:** `scripts/e2e-fixture-lifecycle.mjs`, `scripts/e2e-fixture-lifecycle.test.mjs`
- **Commit:** `0d95aff`

## Known Stubs

None.

## Self-Check: PASSED

- Verified the four production seams exist after commit `0d95aff`.
- Verified test-first commit `77839a5` and implementation commit `0d95aff` exist in Git history.
- Verified the implementation commit contains no tracked-file deletions.
