---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 03
subsystem: release-testing
tags: [playwright, chromium, nextjs, github-actions, e2e]
requires:
  - phase: 06-end-to-end-hardening-and-release-readiness
    provides: isolated HTTPS fixture launcher and approved Playwright provenance
provides:
  - Cookie-jar-authenticated student release journey in Chromium
  - Managed Chromium CI gate with retained private diagnostics
  - Windows-safe Corepack fixture launcher behavior
affects: [OPS-04, PROD-04, release-readiness, ci]
tech-stack:
  added: [@playwright/test@1.63.0]
  patterns:
    - Browser release tests establish a guest actor only through the page context cookie jar.
    - CI owns the fixture server, Chromium browser, and bounded diagnostic artifacts.
key-files:
  created:
    - playwright.config.ts
    - apps/web/e2e/student-release-journey.spec.ts
  modified:
    - package.json
    - pnpm-lock.yaml
    - scripts/run-e2e-fixture.mjs
    - scripts/run-e2e-fixture.test.mjs
    - .github/workflows/ci.yml
key-decisions:
  - "Use one serial Chromium journey with the page request context to prove HttpOnly guest-cookie continuity without exposing the credential."
  - "Run the fixture through a direct Node/Corepack entrypoint on Windows, avoiding unsafe batch-shell argument handling."
  - "Upload browser reports and retry diagnostics on every CI outcome with seven-day retention."
patterns-established:
  - "Release browser tests assert visible state transitions instead of complete ranking or catalogue snapshots."
  - "Windows fixture cleanup terminates the owned child process tree so later runs do not retain Next.js build locks."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: "A generated student completes governed discovery, onboarding, local shortlist persistence, recommendations, and one simulation through one browser context."
    requirement: PROD-04
    verification:
      - kind: e2e
        ref: "node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium (host runner, twice)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CI provides a serialized managed-Chromium release gate with bounded diagnostics."
    requirement: OPS-04
    verification:
      - kind: other
        ref: ".github/workflows/ci.yml#browser-release"
        status: pass
    human_judgment: false
duration: 1d
completed: 2026-09-09
status: complete
---

# Phase 6 Plan 03: Student Browser Release Journey Summary

**A serial Chromium release tracer now carries one generated student through discovery, cookie-backed onboarding, shortlist persistence, recommendations, and a simulation, with a dedicated CI gate and private diagnostics.**

## Performance

- **Duration:** 1 day
- **Completed:** 2026-09-09
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added the maintainer-approved exact `@playwright/test@1.63.0` dependency and a one-worker Chromium configuration with bounded timeouts, retry traces, HTML reporting, and HTTPS-only certificate tolerance.
- Added a student-only browser journey that establishes its actor solely by `page.request.get('/api/account/onboarding')`, then proves onboarding, local shortlist reload persistence, recommendations, and one visible simulation result.
- Added a distinct `ScholarScout / Browser release journey` CI job that installs managed Chromium after the frozen Corepack-pnpm install and uploads reports/traces on every outcome for seven days.

## Verification

- `node --test scripts/run-e2e-fixture.test.mjs` — passed (7 tests).
- `node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium` — passed twice from the host runner.
- The agent sandbox could not itself run the spawned Next.js child because it denied writes to `apps/web/.next/trace`; host-level verification supplied the required fixture evidence without changing application build-output behavior.

## Task Commits

1. **Task 1: Run one cookie-jar-authenticated student release journey in Chromium** — `8f17e27` (test), `55c0574`, `5a986ae`, `25118fc` (fix)
2. **Task 2: Publish the owned browser release signal separately in CI** — `0045d39` (ci)

## Files Created/Modified

- `playwright.config.ts` - Serial Chromium configuration bound to the owned HTTPS fixture URL.
- `apps/web/e2e/student-release-journey.spec.ts` - Cookie-context student release tracer.
- `package.json` and `pnpm-lock.yaml` - Exact approved Playwright dependency and resolved lock data.
- `scripts/run-e2e-fixture.mjs` and `scripts/run-e2e-fixture.test.mjs` - Windows-safe Corepack launch and fixture process-tree cleanup coverage.
- `.github/workflows/ci.yml` - Separate managed-Chromium release gate and retained diagnostics.

## Decisions Made

- The browser journey uses only the shared Playwright request/page context to receive the HttpOnly guest cookie; it never supplies or logs identity credentials.
- Windows invokes pnpm through Node's installed Corepack JavaScript entrypoint, avoiding a batch shell and ensuring cleanup reaches the owned child process tree.
- The local agent sandbox limitation is recorded as infrastructure evidence only; the host runner passed the exact release command twice.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repaired Windows fixture launch and cleanup behavior**
- **Found during:** Task 1
- **Issue:** Windows ESM entrypoint comparison and package-manager batch shims prevented the owned launcher from executing reliably; failed children could retain a Next.js build trace lock.
- **Fix:** Normalized the entrypoint URL, used a direct Node/Corepack invocation, and terminated only the owned Windows process tree during cleanup.
- **Files modified:** `scripts/run-e2e-fixture.mjs`, `scripts/run-e2e-fixture.test.mjs`
- **Verification:** Direct launcher suite passed 7 tests.
- **Committed in:** `55c0574`, `5a986ae`, `25118fc`

**Total deviations:** 1 auto-fixed (Rule 3 blocking issue).

## Issues Encountered

- The agent shell sandbox blocks spawned Next.js processes from writing the generated `.next/trace` file. The unchanged exact fixture command passed twice from the host runner, where that process boundary is permitted.

## Known Stubs

None.

## Next Phase Readiness

- The protected-main CI workflow has a failing, serialized browser release signal with bounded diagnostics.
- Future browser coverage should keep staff, community, Phase 999.1 search, and alternative simulation entry points outside this student-only tracer unless independently scoped.

## Self-Check: PASSED

- All planned release-test, fixture-launcher, and CI files exist.
- All five task commits exist in repository history.
- No release-tracer stubs or placeholder markers were found.

---

*Phase: 06-end-to-end-hardening-and-release-readiness*
*Plan: 03*
*Completed: 2026-09-09*
