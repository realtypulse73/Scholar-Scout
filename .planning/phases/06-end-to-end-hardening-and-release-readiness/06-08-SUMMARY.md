---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 08
subsystem: release-e2e-fixture
tags: [e2e, fixture, programme-governance, security]
dependency_graph:
  requires: [06-02, 06-05]
  provides: [governed-fixture-lifecycle, seed-free-fixture-catalogue]
  affects: [OPS-04, PROD-04, preview-rehearsal]
tech_stack:
  added: []
  patterns: [server-only-fixture-config, lazy-governed-import, fixture-allowlist]
key_files:
  created:
    - apps/web/lib/server/e2e-fixture-config.ts
  modified:
    - apps/web/lib/server/e2e-programme-fixture.ts
    - apps/web/lib/server/programme-records.ts
    - apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts
decisions:
  - Fixture activation requires a valid server-side fixture ID, non-production runtime, and explicit enablement.
  - Fixture-mode catalogue reads return only published records whose IDs are declared by the active generated fixture.
metrics:
  duration: 12m
  completed: 2026-09-18
  tasks_completed: 1
  files_modified: 4
status: complete
---

# Phase 06 Plan 08: Governed Fixture Catalogue Summary

Generated E2E programmes now use the audited save/read/delete boundary and fixture-mode discovery exposes only the declared published records.

## Completed Tasks

1. **Route one generated fixture set through the governed catalogue end to end** — extracted a shared server-only fixture configuration seam, replaced direct persistence mutations with serial `saveProgrammeRecord` and `deleteProgrammeRecord` calls, and filtered fixture-mode catalogue reads to the generated fixture allowlist. `227cac2`, `57fa771`

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand __tests__/lib/server/e2e-programme-fixture.test.ts __tests__/app/api/internal/e2e-fixture/route.test.ts` — passed (2 suites, 16 tests).
- `node --test scripts/e2e-fixture-lifecycle.test.mjs` — passed (11 tests).
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Decisions Made

- Fixture mode is denied in production and without a valid, server-owned fixture identifier before any lifecycle persistence call.
- A lazy fixture import lets governed catalogue reads derive the exact allowed IDs without introducing an initialization cycle.
- Fixture records are returned in their declared generated order; seed and unrelated persisted records are excluded until fixture mode is disabled.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- Confirmed the fixture configuration, lifecycle, catalogue boundary, and regression test files exist.
- Confirmed task commits `227cac2` and `57fa771` exist in git history.
