---
phase: 06-end-to-end-hardening-and-release-readiness
plan: "03"
subsystem: testing
tags: [playwright, chromium, nextjs, e2e, fixture-lifecycle, ci]
requires:
  - phase: 06-01
    provides: Approved @playwright/test provenance decision
  - phase: 06-02
    provides: Server-owned generated fixture lifecycle
provides:
  - One isolated HTTPS Chromium release journey using an opaque guest cookie jar
  - A protected-main CI job that owns the browser, fixture runner, and retained reports
affects: [release-readiness, ci, e2e]
tech-stack:
  added: ["@playwright/test 1.55.0"]
  patterns: ["owned HTTPS fixture runner", "browser-context guest journey", "always-uploaded Playwright reports"]
key-files:
  created: [playwright.config.ts, apps/web/e2e/student-release-journey.spec.ts]
  modified: [scripts/run-e2e-fixture.mjs, .github/workflows/ci.yml, apps/web/app/api/internal/e2e-fixture/route.ts]
key-decisions:
  - "Use an isolated local HTTPS server and browser cookie jar rather than caller-provided identities or external base URLs."
  - "Run Chromium separately in protected-main CI and retain Playwright reports on every outcome."
patterns-established:
  - "Owned browser fixtures receive no browser-visible capability, fixture selector, or production adapter setting."
  - "Browser locators use exact accessible names where development tooling can introduce overlapping labels."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: Guest student completes discovery, shortlist, onboarding, recommendations, and a simulation in one protected browser context.
    requirement: PROD-04
    verification:
      - kind: e2e
        ref: node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium
        status: pass
    human_judgment: false
  - id: D2
    description: Protected-main CI independently runs the owned Chromium release tracer and retains its diagnostics.
    requirement: OPS-04
    verification:
      - kind: other
        ref: .github/workflows/ci.yml#browser-release-tracer
        status: pass
    human_judgment: false
duration: 50min
completed: 2026-09-02
status: complete
---

# Phase 6 Plan 03: Student Chromium Release Tracer Summary

**An isolated HTTPS Chromium journey proves an opaque guest context can retain shortlist and onboarding state through discovery, recommendations, and simulation without touching production data.**

## Performance

- **Duration:** 50 min
- **Completed:** 2026-09-02
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Added the approved Playwright Chromium tracer for the normal student release journey, including browser-context cookie continuity and visible simulation completion.
- Kept the fixture runner server-owned, temporary, JSON-only, and HTTPS-bound; creation, verification, and deletion are acknowledged before the runner exits.
- Added a distinct protected-main CI job that installs Chromium, executes only the owned tracer, and uploads browser diagnostics on every outcome.

## Verification

- `node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium` — passed twice with observed process exit code 0; the final run reported `1 passed (15.0s)` and a successful fixture DELETE.
- `node --test scripts/e2e-fixture-lifecycle.test.mjs scripts/run-e2e-fixture.test.mjs` — 6 passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts __tests__/lib/server/e2e-programme-fixture.test.ts` — 8 passed.
- `corepack pnpm --filter @scholar-scout/web typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web lint` — passed.
- `corepack pnpm install --frozen-lockfile --ignore-scripts` — passed.

## Task Commits

1. **Task 1: Run one cookie-jar-authenticated student release journey in Chromium** — `431e92c` (feat)
2. **Task 2: Publish the owned browser release signal separately in CI** — `707b4a1` (chore)

## Decisions Made

- Use exact accessible-name matching for the simulation’s “Next” action, preventing Next development tooling from becoming a second matching control.
- Preserve strict fixture request boundaries while accepting Next’s actual zero-byte POST stream only when the request declares `content-length: 0`; non-empty bodies remain denied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the ambiguous simulation Next locator.**
- **Found during:** Task 1
- **Issue:** Next development tooling exposed a second button whose accessible name also matched `Next`.
- **Fix:** Used `exact: true` for both simulation transitions.
- **Files modified:** `apps/web/e2e/student-release-journey.spec.ts`
- **Verification:** The owned Chromium trace passed twice.
- **Committed in:** `431e92c`

**2. [Rule 1 - Bug] Allowed the runner’s transport-level empty lifecycle request without admitting caller input.**
- **Found during:** Task 1
- **Issue:** Next’s Node adapter represents a zero-byte POST as an empty stream rather than `null`, preventing the owned launcher from creating its fixture.
- **Fix:** Accepted only an explicit zero content-length request, rejected transfer encoding and non-empty request bodies, and added regression tests.
- **Files modified:** `apps/web/app/api/internal/e2e-fixture/route.ts`, `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts`
- **Verification:** Fixture route tests passed; the real HTTPS lifecycle POST/GET/DELETE passed.
- **Committed in:** `431e92c`

**3. [Rule 3 - Blocking] Preserved required Windows process environment and HTTPS transport handling for the owned launcher.**
- **Found during:** Task 1
- **Issue:** The isolated child process could not reliably resolve its launcher on Windows, and the Node lifecycle client used an HTTP-only request path against the owned HTTPS server.
- **Fix:** Preserved Windows executable-resolution variables, invoked Corepack’s pnpm entry point where required, and used the scoped HTTPS request helper only for the self-signed local fixture.
- **Files modified:** `scripts/run-e2e-fixture.mjs`, `scripts/run-e2e-fixture.test.mjs`
- **Verification:** Runner unit tests passed and the real owned HTTPS trace exited 0.
- **Committed in:** `431e92c`

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3).
**Impact on plan:** Each fix was required for an honest, isolated browser result; no production, identity, or external-target scope was added.

## Issues Encountered

- The local self-signed HTTPS server emitted development-only NextAuth configuration warnings. The tracer intentionally uses its generated guest actor and no credentials; these warnings did not affect the passing journey.
- `state.advance-plan` could not parse the repository’s pre-existing `Plan: Not started` / missing total-plan state format. Other GSD state, requirements, roadmap, metrics, decision, and session updates completed; no manual state edit was used.

## User Setup Required

None — Chromium is installed by the new CI job and the local trace owns its temporary server and data file.

## Next Phase Readiness

The proven tracer unblocks dependent Preview and release-evidence plans. Generated Playwright reports and test results are ignored locally and retained only by CI artifacts.

## Self-Check: PASSED

- Verified commits `431e92c` and `707b4a1` exist in Git history.
- Verified `playwright.config.ts`, `apps/web/e2e/student-release-journey.spec.ts`, and `.github/workflows/ci.yml` exist.
