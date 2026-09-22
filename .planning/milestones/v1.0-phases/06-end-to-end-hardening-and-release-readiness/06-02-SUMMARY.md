---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 02
subsystem: release-e2e-fixture
tags: [e2e, fixture, nextjs, security]
dependency_graph:
  requires: [06-01]
  provides: [isolated-https-fixture-launcher, governed-programme-fixture]
  affects: [06-03-browser-journey]
tech_stack:
  added: []
  patterns: [capability-gated-internal-route, owned-json-store, governed-catalogue-fixture]
key_files:
  created:
    - scripts/run-e2e-fixture.mjs
    - scripts/e2e-fixture-lifecycle.mjs
    - apps/web/lib/server/e2e-programme-fixture.ts
    - apps/web/app/api/internal/e2e-fixture/route.ts
  modified:
    - apps/web/lib/server/programme-records.ts
decisions:
  - The launcher owns the temporary JSON file, fixture ID, and lifecycle capability; browser processes receive only the HTTPS base URL.
  - Fixture-mode catalogue reads return only deterministic generated programme records through the governed catalogue boundary.
metrics:
  duration: 14m
  completed: 2026-09-08
status: complete
---

# Phase 06 Plan 02: Owned E2E Fixture Summary

An isolated HTTPS Next process now creates, verifies, and removes deterministic governed programme records without exposing fixture state to browser tests.

## Completed Tasks

1. **Disposable HTTPS application fixture** — Added a temporary JSON-backed child process, capability-gated internal lifecycle route, deterministic programme generator, and fixture-only governed catalogue response. `a55edf7`
2. **Exclusive launcher contract** — Added a CLI contract that permits only a selected Playwright spec/project and supplies the browser runner only its local HTTPS base URL. `0ea48af`

## Verification

- `node --test scripts/run-e2e-fixture.test.mjs scripts/e2e-fixture-lifecycle.test.mjs` — passed (6 tests).
- `pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts __tests__/lib/server/e2e-programme-fixture.test.ts` — passed (4 tests).
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Deviations from Plan

None - plan executed as written. Playwright dependency installation and browser journey implementation remain scoped to Plan 06-03.

## Security Notes

- Production, external base URLs, caller-supplied data files, and non-JSON adapters are rejected before child creation.
- The lifecycle route requires an exact authorization capability plus protocol header, and denies body/query/browser-shaped requests before adapter access.
- Cleanup is idempotent and deletes only deterministic fixture records plus the exact temporary directory created by the runner.

## Self-Check: PASSED

- Fixture launcher, lifecycle route, server fixture module, and all targeted tests exist.
- Task commits `a55edf7` and `0ea48af` exist in git history.
