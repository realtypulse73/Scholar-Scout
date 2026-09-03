---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 04
subsystem: testing
tags: [jest, node-test, api, webhook, persistence, rate-limiting]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: fail-closed advisor, community, and webhook boundaries
  - phase: 04-incremental-durable-persistence-boundaries
    provides: conditional-write persistence contract
provides:
  - Deterministic route and service tests for unavailable, malformed, and conflict failure paths.
  - Preview-only community outage proof that stops requests before writes.
affects: [06-05-release-gate, OPS-04]
tech-stack:
  added: []
  patterns: [environment-restoring route tests, no-side-effect service failure assertions]
key-files:
  created:
    - apps/web/__tests__/api/campus-notes.test.ts
    - apps/web/__tests__/api/peer-connections.test.ts
  modified:
    - apps/web/__tests__/api/advisor-chat.test.ts
    - apps/web/__tests__/api/account-guest-routes.test.ts
    - services/codex-webhook-runner/test/server.test.mjs
    - services/http-data-service/test/server.test.mjs
key-decisions:
  - "Keep Preview outage validation at the route boundary with the real outage predicate and an injected in-memory limiter."
  - "Assert only stable public error categories and no side effects; never expose provider, token, or stored-student details in test output."
patterns-established:
  - "Failure-path tests pair an exact response assertion with an explicit no-write or no-dispatch assertion."
requirements-completed: [OPS-04]
coverage:
  - id: D1
    description: Advisor and student persistence failures return safe public outcomes without provider access or stored student state.
    requirement: OPS-04
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/advisor-chat.test.ts and apps/web/__tests__/api/account-guest-routes.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Preview-only community limiter outage blocks campus-note and peer-inbox writes and is ignored outside Preview.
    requirement: OPS-04
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/campus-notes.test.ts and apps/web/__tests__/api/peer-connections.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Webhook and HTTP persistence malformed-input failures preserve safe, non-disclosing, no-side-effect boundaries.
    requirement: OPS-04
    verification:
      - kind: integration
        ref: services/codex-webhook-runner/test/server.test.mjs and services/http-data-service/test/server.test.mjs
        status: pass
    human_judgment: false
duration: 24min
completed: 2026-09-01
status: complete
---

# Phase 6 Plan 04: High-Risk Failure Coverage Summary

**Deterministic API and real-service tests prove unavailable, malformed, and conflict paths fail closed without writes, dispatches, provider details, or stored student data.**

## Performance

- **Duration:** 24 min
- **Completed:** 2026-09-01
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- Hardened advisor and student-route assertions so unavailable/transition-conflict outcomes cannot be mistaken for success or disclose private state.
- Added isolated Preview community outage suites that prove both submission paths return 503 before persistence and that the switch is ineffective outside Preview.
- Extended webhook and HTTP data-service tests to preserve no-dispatch and no-write guarantees for malformed input.

## Task Commits

1. **Task 1: Lock down student-route and provider failure outcomes** — `8a8b7f3` (test)
2. **Task 2: Prove the Preview-only community outage branches fail before writes** — `378024a` (test)
3. **Task 3: Prove webhook and HTTP persistence failures have no external side effects** — `f4cc5bf` (test)

## Files Created/Modified

- `apps/web/__tests__/api/advisor-chat.test.ts` — no-provider/no-telemetry unavailable assertions.
- `apps/web/__tests__/api/account-guest-routes.test.ts` — conflict response redaction assertions.
- `apps/web/__tests__/api/campus-notes.test.ts` — Preview outage and no-write coverage.
- `apps/web/__tests__/api/peer-connections.test.ts` — Preview outage and no-write coverage.
- `services/codex-webhook-runner/test/server.test.mjs` — signed malformed-payload no-dispatch coverage.
- `services/http-data-service/test/server.test.mjs` — invalid-write winning-document preservation coverage.

## Decisions Made

- Used the real Preview outage predicate with a test limiter, retaining the production-only protection rather than duplicating failure injection in browser automation.
- Asserted stable public JSON categories only; tests do not print credentials, provider identifiers, raw persisted data, or student identity fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test fixture isolation] Removed the invalid-write sentinel after its preservation assertion.**
- **Found during:** Task 3
- **Issue:** The sentinel document intentionally created for the invalid-write assertion caused the following first-create scenario to receive `412`.
- **Fix:** Removed only that temporary fixture after asserting it remained unchanged.
- **Files modified:** `services/http-data-service/test/server.test.mjs`
- **Verification:** Full HTTP data-service suite passes.
- **Committed in:** `f4cc5bf`

**Total deviations:** 1 auto-fixed (Rule 1)

## Issues Encountered

- The default shell exposed Node 24 and pnpm 11, which violate the repository contract. Verification used the available Node 20.20.2 runtime and Corepack-selected pnpm 10.34.5.

## Known Stubs

None.

## Next Phase Readiness

- OPS-04’s lower-level failure contracts are covered by deterministic route and real-service tests; Plan 06-05 can use them as the release-gate evidence layer.

## Self-Check: PASSED

- All six owned test files exist and all three task commits are present in Git history.

---
*Phase: 06-end-to-end-hardening-and-release-readiness*
*Completed: 2026-09-01*
