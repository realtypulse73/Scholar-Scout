---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 05
subsystem: preview-fixture-lifecycle
tags: [e2e, preview, fixture, security, governed-catalogue]
dependency_graph:
  requires: [06-02, 06-03, 06-04]
  provides: [guarded server-owned Preview fixture lifecycle]
  affects: [OPS-04, PROD-04, release-readiness]
tech_stack:
  added: []
  patterns:
    - The runner uses a fixed HTTPS, capability-bearing no-body lifecycle protocol.
    - Generated programme records are persisted, read, and removed through governed catalogue operations.
key_files:
  created: []
  modified:
    - scripts/e2e-fixture-lifecycle.mjs
    - scripts/e2e-fixture-lifecycle.test.mjs
    - apps/web/app/api/internal/e2e-fixture/route.ts
    - apps/web/lib/server/e2e-programme-fixture.ts
    - apps/web/lib/server/programme-records.ts
decisions:
  - Preserve normal seed-catalogue merging while the fixture is active; fixture records must prove the persisted governed path rather than replace it.
metrics:
  duration: 15m
  completed: 2026-09-09
  tasks_completed: 1
  files_modified: 7
status: complete
---

# Phase 6 Plan 05: Guarded Preview Fixture Lifecycle Summary

The Preview fixture lifecycle now rejects unsafe transport before browser work, persists deterministic non-personal programmes through the governed catalogue, and performs one awaited cleanup on every terminal path.

## Completed Tasks

1. **Gate the governed Preview fixture lifecycle and exact cleanup** — runner configuration now requires HTTPS and a non-empty capability, rejected lifecycle phases cannot reach the browser run, and cleanup remains exact after failures, crashes, and signals.
2. The server route rejects production, missing/incorrect lifecycle credentials, bodies, queries, and browser-navigation metadata before it reaches the fixture adapter.
3. Generated records are created and deleted serially through `saveProgrammeRecord`, `getGovernedProgrammes`, and `deleteProgrammeRecord`, preserving seed records and avoiding conditional-write conflicts.

## Verification

- `node --test scripts/e2e-fixture-lifecycle.test.mjs` — passed (5 tests).
- `pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts __tests__/lib/server/e2e-programme-fixture.test.ts` — passed (2 suites, 8 tests).
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Task Commits

1. **RED: add failing lifecycle transport guards** — `97dda49`
2. **GREEN: harden governed fixture lifecycle** — `76bc63d`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Serialized generated fixture mutations through the conditional-write adapter**
- **Found during:** Task 1
- **Issue:** Parallel fixture programme creation raced at the versioned persistence boundary and could reject one declared record with a revision conflict.
- **Fix:** Created and deleted the bounded generated record set sequentially, then verified it through the normal governed catalogue merge.
- **Files modified:** `apps/web/lib/server/e2e-programme-fixture.ts`, `apps/web/lib/server/programme-records.ts`, `apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts`
- **Commit:** `76bc63d`

## Known Stubs

None.

## Threat Flags

None. The plan adds no new public endpoint or browser control surface; the existing internal route remains capability-gated and production-denied.

## Self-Check: PASSED

- Confirmed each lifecycle, route, fixture, and governed-catalogue file exists.
- Confirmed commits `97dda49` and `76bc63d` exist in repository history.
- No blocking stubs, skipped tests, or unrun verification remain.
