---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 06
subsystem: protected-preview-release-tracer
tags: [playwright, preview, release, security, e2e]
dependency_graph:
  requires: [06-03, 06-05]
  provides: [candidate-bound protected Preview student tracer]
  affects: [OPS-04, PROD-04]
tech_stack:
  added: []
  patterns:
    - The runner keeps Vercel protection material in an in-process browser context.
    - The student journey is shared by the regular Playwright spec and the protected supervisor.
key_files:
  created:
    - scripts/preview-deployment-protection.mjs
    - scripts/run-preview-release-tracer.mjs
    - scripts/student-release-journey.mjs
  modified:
    - apps/web/e2e/student-release-journey.spec.ts
    - scripts/e2e-fixture-lifecycle.mjs
    - scripts/preview-deployment-protection.test.mjs
    - scripts/run-preview-release-tracer.test.mjs
decisions:
  - Run the shared student journey in the supervisor process so Preview protection never crosses a child-process boundary.
metrics:
  duration: 24m
  completed: 2026-09-09
  tasks_completed: 1
  files_modified: 7
status: complete
---

# Phase 6 Plan 06: Protected Preview Release Tracer Summary

The release tracer validates a candidate-bound HTTPS Preview, provisions its governed fixture lifecycle, and drives the full student journey in one protected in-memory browser context without persisting bypass material or visual diagnostics.

## Completed Tasks

1. Added a Preview-protection boundary that rejects invalid Preview metadata, candidate mismatches, non-HTTPS targets, and absent runner-only bypass material before traffic.
2. Added a one-run supervisor that applies protection transport to lifecycle, page, and context API requests; runs the existing student journey in-process; disables trace, screenshot, and video diagnostics; and delegates exact lifecycle cleanup.
3. Extracted the existing student journey into a shared E2E helper so the regular Playwright spec and protected supervisor exercise the same path without forwarding secrets into a child process.

## Verification

- `node --test scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs` — passed (6 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.

## Task Commits

1. **RED: add failing Preview tracer guards** — `0dc027e`
2. **GREEN: run protected Preview release tracer** — `ef0f881`

## Deviations from Plan

### Authorized Scope Expansion

**1. Extracted the student journey into an in-process callable helper**
- **Found during:** Task 1
- **Issue:** The existing Playwright spec runs in a child process, so it cannot inherit a protection cookie/context while the bypass material remains absent from child environments and arguments.
- **Fix:** Added `scripts/student-release-journey.mjs` and made the existing spec delegate to it; the Preview supervisor invokes the same helper through its own protected browser context.
- **Files modified:** `scripts/student-release-journey.mjs`, `apps/web/e2e/student-release-journey.spec.ts`, `scripts/run-preview-release-tracer.mjs`
- **Commit:** `ef0f881`

## Known Stubs

None.

## Threat Flags

None. The tracer is runner-owned, rejects non-Preview targets before traffic, and keeps bypass material/cookies outside child environments, diagnostics, and committed evidence.

## Self-Check: PASSED

- Confirmed the protected Preview modules, shared journey helper, adapted spec, lifecycle integration, and summary exist.
- Confirmed commits `0dc027e` and `ef0f881` exist in repository history.
- No stubs, skipped tests, or unrun required verification remain.
