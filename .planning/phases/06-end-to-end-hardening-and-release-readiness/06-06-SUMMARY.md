---
phase: 06-end-to-end-hardening-and-release-readiness
plan: "06"
subsystem: testing
tags: [preview, playwright, vercel, e2e, release-gate]
requires:
  - phase: 06-03
    provides: isolated Chromium student release journey
  - phase: 06-05
    provides: capability-gated governed fixture lifecycle and exact cleanup
provides:
  - Candidate-bound protected Preview browser transport with fail-closed metadata checks
  - One-run governed student journey with exact fixture cleanup and scrubbed evidence
  - Live governed recommendation rendering for post-deployment Preview fixtures
affects: [prelaunch-rehearsal, release-evidence, phase-06-release-gate]
tech-stack:
  added: []
  patterns: [one-time protection-cookie bootstrap, steady-state in-memory bypass, candidate-bound scrubbed tracer evidence]
key-files:
  created:
    - .github/workflows/preview-release-tracer.yml
    - scripts/preview-deployment-protection.mjs
    - scripts/preview-deployment-protection.test.mjs
    - scripts/run-preview-release-tracer.mjs
    - scripts/run-preview-release-tracer.test.mjs
    - apps/web/__tests__/components/recommendations/RecommendationDashboard.test.tsx
  modified:
    - scripts/e2e-fixture-lifecycle.mjs
    - scripts/e2e-fixture-lifecycle.test.mjs
    - apps/web/app/api/internal/e2e-fixture/route.ts
    - apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts
    - apps/web/components/recommendations/RecommendationDashboard.tsx
    - apps/web/app/recommendations/page.tsx
key-decisions:
  - "Bootstrap the Vercel protection cookie once, then retain only the in-memory bypass header for steady-state browser and context API traffic."
  - "Bind the protected trace to an exact candidate commit and deployment ID, with only a scrubbed pass/fail artifact leaving the runner."
  - "Render recommendations dynamically because governed Preview fixtures are created after the candidate build completes."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: "Invalid or mismatched Preview metadata, missing protection material, and missing lifecycle capability fail before browser creation or traffic."
    requirement: OPS-04
    verification:
      - kind: integration
        ref: "node --test scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "The exact candidate-bound protected Preview completes discovery, shortlist persistence, onboarding, governed recommendations, and simulation before exact cleanup."
    requirement: PROD-04
    verification:
      - kind: e2e
        ref: "GitHub Actions run 33720225770 / deployment dpl_5KyrApi2FYTrn3AvDZW3npueavZ3"
        status: pass
    human_judgment: false
  - id: D3
    description: "Guest recommendations consume server-owned onboarding and shortlist context and render the current governed catalogue rather than build-time data."
    requirement: PROD-04
    verification:
      - kind: component
        ref: "apps/web/__tests__/components/recommendations/RecommendationDashboard.test.tsx"
        status: pass
      - kind: build
        ref: "pnpm --filter @scholar-scout/web run build"
        status: pass
      - kind: e2e
        ref: "GitHub Actions run 33720225770"
        status: pass
    human_judgment: false
duration: 6h
completed: 2026-09-03
status: complete
---

# Phase 6 Plan 06: Protected Preview Student Tracer Summary

**An exact candidate-bound protected Preview now runs the governed student release journey through discovery, persisted shortlist, onboarding, live recommendations, and simulation, then cleans the fixture and emits only scrubbed evidence.**

## Performance

- **Duration:** 6h
- **Completed:** 2026-09-03
- **Tasks:** 1/1
- **Files created/modified:** 12

## Accomplishments

- Added a fail-closed Vercel Preview protection boundary that validates Preview environment, candidate commit, deployment ID, and in-memory bypass material before traffic.
- Added a manually dispatched bridge that checks out the exact candidate, runs the fixed fixture lifecycle and student browser journey, uploads only a scrubbed outcome, and awaits exact cleanup.
- Proved the final candidate `e1d205cefe945b63bd4193d8c51e86befe57faf3` against Ready Preview deployment `dpl_5KyrApi2FYTrn3AvDZW3npueavZ3`; protected run `33720225770` passed and produced `{category: passed, candidateCommit, deploymentId}` only.
- Closed live Preview defects without weakening controls: fixed checkout targeting, separated capability headers, classified safe denials, accepted verified zero-byte streams, restored guest recommendation context, bootstrapped the protection cookie once, and made governed recommendations dynamic.

## Task Commits

1. **Task 1: Run one guarded student tracer against a candidate-bound protected Preview** — `7161ce7` (test), `45997ce` (feat), `b949e2e` (workflow)
2. **Live Preview correctness fixes** — `2d99b8b`, `6fa3523`, `2e06b47`, `61f2ebb`, `fe3dbe9`, `c002be6`, `da5d0ef`, `cdf7d9a`, `e1d205c`

## Files Created/Modified

- `.github/workflows/preview-release-tracer.yml` — dispatches the exact protected candidate trace without releasing runner secrets.
- `scripts/preview-deployment-protection.mjs` and test — validate candidate Preview metadata and manage one-time cookie bootstrap plus steady-state in-memory transport.
- `scripts/run-preview-release-tracer.mjs` and test — supervise fixed lifecycle ordering, browser journey, scrubbed result, and cleanup.
- `scripts/e2e-fixture-lifecycle.mjs` and test — preserve exact server lifecycle semantics for protected Preview requests.
- `apps/web/app/api/internal/e2e-fixture/route.ts` and test — retain capability-only, Preview-only fixture access while accepting the verified runner request stream.
- `apps/web/components/recommendations/RecommendationDashboard.tsx` and component test — hydrate guest recommendation context from the server-owned account APIs.
- `apps/web/app/recommendations/page.tsx` — read governed programmes at request time so post-build fixtures appear in Preview recommendations.

## Decisions Made

- Vercel's cookie-setting instruction is a one-time bootstrap action; repeating it on application/API traffic is not steady-state authorization.
- Browser protection and fixture capability remain separate headers and trust boundaries.
- The recommendations page is dynamic because its governed catalogue is mutable after deployment; a build-time snapshot cannot satisfy the release trace.
- No trace, screenshot, video, cookie, secret, fixture identifier, student content, or storage detail is retained in releasable evidence.

## Verification

- `node --test scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs` — passed (6 tests).
- `pnpm --filter @scholar-scout/web test --runInBand __tests__/components/recommendations/RecommendationDashboard.test.tsx` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run build` — passed; `/recommendations` is reported as dynamic.
- PR #20 required checks — all passed, including Chromium release tracer, web Jest/build/lint/typecheck, service/tooling checks, and Vercel Preview.
- Exact protected candidate run `33720225770` — passed against deployment `dpl_5KyrApi2FYTrn3AvDZW3npueavZ3`; deployment logs show dynamic `/recommendations`, `/simulate`, successful account API calls, and terminal fixture `DELETE 200`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Repaired candidate checkout and protected transport semantics.**
- The bridge now checks out the validated candidate branch/commit, keeps lifecycle capability separate, accepts the verified zero-byte protocol, and applies the protection cookie instruction only once.

**2. [Rule 1 - Correctness] Restored server-owned guest recommendation context.**
- The dashboard now uses the existing opaque account APIs for guest onboarding and shortlist state instead of depending exclusively on browser storage.

**3. [Rule 1 - Correctness] Removed the build-time governed-catalogue snapshot.**
- The recommendation route now renders dynamically, allowing the post-deployment governed fixture to appear in the required release journey.

**Total deviations:** 3 auto-fixed correctness groups.
**Impact on plan:** The changes were required to make the planned protected Preview tracer exercise real candidate state. They add no production target, secret-bearing evidence, browser capability surface, or persistent test data.

## Issues Encountered

- Protected Preview failures originally exposed only a safe generic result. Each retry was diagnosed from scrubbed workflow status and Vercel request metadata, then repaired through a scoped PR and full check gate.
- No unresolved Plan 06-06 issue remains.

## Known Stubs

None.

## Next Phase Readiness

Plan 06-07 can consume the passing candidate-bound protected Preview record as its independent browser lane while keeping candidate quality, high-risk API, local browser, outage/restoration, and real-production evidence separate.

## Self-Check: PASSED

- Confirmed all plan-owned scripts, tests, workflow, and this summary exist.
- Confirmed the final exact run `33720225770` passed for candidate `e1d205cefe945b63bd4193d8c51e86befe57faf3` and deployment `dpl_5KyrApi2FYTrn3AvDZW3npueavZ3`.
- Confirmed terminal fixture cleanup returned `DELETE 200` and no secret-bearing diagnostic artifact was retained.
