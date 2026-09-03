---
phase: 06-end-to-end-hardening-and-release-readiness
plan: "05"
subsystem: testing
tags: [e2e, fixture-lifecycle, nextjs, playwright, security]
requires:
  - phase: 06-02
    provides: capability-gated server-owned fixture lifecycle
  - phase: 06-03
    provides: isolated HTTPS Chromium student release tracer
  - phase: 06-04
    provides: high-risk API and persistence failure coverage
provides:
  - Browser-metadata denial before internal fixture lifecycle adapter access
  - Exact terminal lifecycle cleanup coverage and governed-record browser assertions
affects: [preview-rehearsal, release-evidence, phase-06-release-gate]
tech-stack:
  added: []
  patterns: [fixed no-body lifecycle transport, browser-shape denial, generated governed catalogue assertions]
key-files:
  created: []
  modified:
    - apps/web/app/api/internal/e2e-fixture/route.ts
    - apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts
    - apps/web/e2e/student-release-journey.spec.ts
    - scripts/e2e-fixture-lifecycle.test.mjs
key-decisions:
  - "Treat browser navigation/client-hint metadata as browser-shaped input and reject it before fixture adapter work."
  - "Prove generated governed records by visible discovery and recommendation presence, never a brittle rank-order snapshot."
patterns-established:
  - "Lifecycle supervisor tests invoke the registered cleanup handler and assert one exact DELETE after terminal paths."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: "Internal fixture lifecycle rejects production, missing/invalid capability, query/body input, and browser-shaped metadata before lifecycle access."
    requirement: OPS-04
    verification:
      - kind: integration
        ref: "apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The isolated Chromium journey observes generated governed programmes in discovery and after onboarding recommendations, then receives a successful lifecycle cleanup."
    requirement: PROD-04
    verification:
      - kind: e2e
        ref: "node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fixture lifecycle transport preserves exact POST, GET, and one DELETE cleanup ordering after normal, failed, and externally signalled terminal paths."
    requirement: OPS-04
    verification:
      - kind: integration
        ref: "node --test scripts/e2e-fixture-lifecycle.test.mjs"
        status: pass
    human_judgment: false
duration: 31min
completed: 2026-09-02
status: complete
---

# Phase 6 Plan 05: Guarded Preview Fixture Lifecycle Summary

**The generated programme fixture now denies browser navigation metadata before adapter work and proves a governed record survives the connected discovery-to-recommendation journey before exact cleanup.**

## Performance

- **Duration:** 31 min
- **Completed:** 2026-09-02
- **Tasks:** 1/1
- **Files modified:** 4

## Accomplishments

- Denied `Referer`, browser fetch-user, and client-hint metadata alongside the existing capability, production, no-body, and no-query protections.
- Added deterministic lifecycle coverage for one registered terminal cleanup, preserving the fixed `POST` → `GET` → `DELETE` protocol.
- Proved the generated server-governed technology pathway is visible in discovery and after onboarding recommendations without snapshotting the full catalogue or ranking.

## Task Commits

1. **Task 1: Gate the governed Preview fixture lifecycle and exact cleanup** — `00aad21` (test), `524d5ea` (feat)

## Files Created/Modified

- `apps/web/app/api/internal/e2e-fixture/route.ts` — rejects additional browser-shaped metadata before invoking lifecycle helpers.
- `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts` — covers metadata and production denials before adapter access.
- `apps/web/e2e/student-release-journey.spec.ts` — asserts generated governed records in both required student surfaces.
- `scripts/e2e-fixture-lifecycle.test.mjs` — proves exactly one awaited cleanup when a terminal handler invokes the registered lifecycle cleanup.

## Decisions Made

- Browser navigation and client-hint headers are not valid runner transport and are rejected before any fixture adapter operation.
- The browser tracer asserts named generated records are present rather than relying on recommendation ordering.

## Verification

- `node --test scripts/e2e-fixture-lifecycle.test.mjs` — passed (3 tests).
- `corepack pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts __tests__/lib/server/e2e-programme-fixture.test.ts` — passed (12 tests).
- `node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium` — passed (`1 passed (14.8s)`); observed successful lifecycle POST, GET, and DELETE.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Security boundary] Rejected browser navigation metadata before adapter access.**
- **Found during:** Task 1
- **Issue:** A request carrying only a `Referer` header reached the internal fixture verification path despite being browser-shaped input.
- **Fix:** Treated `Referer`, `sec-fetch-user`, and `sec-ch-ua` as browser-shape signals and added regression coverage.
- **Files modified:** `apps/web/app/api/internal/e2e-fixture/route.ts`, `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts`
- **Verification:** Targeted route suite passed with production and all metadata denials.
- **Committed in:** `524d5ea`

**2. [Rule 1 - Test robustness] Narrowed the generated recommendation assertion without coupling it to ranking order.**
- **Found during:** Task 1
- **Issue:** The recommendation surface legitimately renders the same generated programme in multiple sections, making a strict all-page heading locator ambiguous.
- **Fix:** Asserted one exact visible generated heading without making a rank-order claim.
- **Files modified:** `apps/web/e2e/student-release-journey.spec.ts`
- **Verification:** Owned Chromium journey passed with lifecycle cleanup.
- **Committed in:** `524d5ea`

**Total deviations:** 2 auto-fixed (Rule 1).
**Impact on plan:** Both changes close fixture-control and deterministic-test correctness gaps without adding a browser control surface, raw persistence access, or production scope.

## Issues Encountered

- `state.advance-plan` cannot parse the repository's pre-existing `Plan: Not started` state format. No manual state edit was used; the remaining supported state, metric, decision, session, roadmap, and requirement updates are attempted through the GSD SDK.

## Known Stubs

None.

## Next Phase Readiness

The protected Preview transport and release-evidence plans can consume a server-owned lifecycle that remains capability-only, production-denied, and proven through governed discovery/recommendation state.

## Self-Check: PASSED

- Confirmed all four plan-owned modified files and this summary exist.
- Confirmed `00aad21` and `524d5ea` exist in Git history.
- Found no stubs, TODOs, FIXMEs, or placeholder content in the plan-owned implementation files.
