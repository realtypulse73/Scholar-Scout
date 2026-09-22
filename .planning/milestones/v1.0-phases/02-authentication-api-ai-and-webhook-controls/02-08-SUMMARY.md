---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 08
subsystem: advisor-api
tags: [nextjs, openai-responses, rate-limiting, privacy, jest]
requires:
  - phase: 02-02
    provides: Atomic advisor quota reservations
  - phase: 02-03
    provides: Opaque account and guest student actors
provides:
  - Exact bounded advisor request and structured reply contracts
  - Actor-scoped server context, quota controls, direct Responses call, and safe fallback paths
  - Synthetic advisor policy-evaluation cases and route/client regression coverage
affects: [advisor, authentication, ai-safety, student-privacy]
tech-stack:
  added: []
  patterns: [server-owned advisor context, strict Responses JSON validation, bounded direct provider request]
key-files:
  created:
    - apps/web/lib/advisor-contract.ts
    - apps/web/lib/server/advisor-context.ts
    - apps/web/__tests__/fixtures/advisor-eval-cases.ts
  modified:
    - apps/web/app/api/advisor-chat/route.ts
    - apps/web/components/advisor/AdvisorChat.tsx
key-decisions:
  - "Keep the advisor as a single-turn native Responses fetch with no tools, browsing, or browser-selected context."
  - "Fail closed on a missing limiter and use a fixed redacted fallback for provider failures or malformed output."
  - "Preserve a migrated guest quota window when a student signs in so account access cannot bypass the daily limit."
patterns-established:
  - "Advisor routes parse exact byte-bounded request envelopes before actor, quota, context, or provider access."
  - "Provider text.format JSON Schema output is revalidated at runtime before returning it to the browser."
requirements-completed: [SEC-03]
coverage:
  - id: D1
    description: Exact bounded advisor request, reply, model, context, and crisis contracts
    requirement: SEC-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/advisor-guardrails.test.ts#advisor guardrails
        status: pass
    human_judgment: false
  - id: D2
    description: Actor-isolated quota reservation and direct Responses failure handling
    requirement: SEC-03
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/advisor-chat.test.ts#advisor chat route
        status: pass
    human_judgment: false
  - id: D3
    description: Browser sends only the student message and renders safe advisor outcomes
    requirement: SEC-03
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/advisor/AdvisorChat.test.tsx#AdvisorChat
        status: pass
    human_judgment: false
  - id: D4
    description: Qualitative student-safety and agency behavior across the synthetic evaluation fixture
    requirement: SEC-03
    verification: []
    human_judgment: true
    rationale: Protected maintainer evaluation and qualified human review are required when model, instructions, or context policy changes.
duration: 13 min
completed: 2026-07-28
status: complete
---

# Phase 02 Plan 08: Advisor Hardening Summary

**A quota-reserved, actor-isolated direct Responses advisor with strict JSON output, deterministic crisis/fallback paths, and an exact browser message contract.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-28T05:03:00Z
- **Completed:** 2026-07-28T05:15:47Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Added exact 1--3,000-character request parsing, an 8,000-character reply validator, model allowlist, fixed fallback, and acute-crisis handoff.
- Built capped actor-keyed context from only approved memory and the top three recommendations; browser-supplied identity, context, and history are rejected.
- Replaced the advisor route with byte-bounded parsing, active guest/account quota reservation, migrated guest-window carry-over, 10-second direct Responses calls, strict JSON Schema validation, one schema retry, and redacted telemetry.
- Updated the browser to send exactly `{ message }` and render validation, quota-reset, unavailable, fallback, and crisis states.
- Checked in fourteen synthetic privacy, quota, safety, provider-resilience, stale-fact, agency, and referral cases with focused route, component, and guardrail tests.

## Task Commits

1. **Task 1: Define advisor contracts, context selection, and synthetic evaluation data** - `c1eb4d3` (test), `cbc1979` (feat)
2. **Task 2: Implement the bounded direct Responses route** - `065fab2` (test), `bc7480b` (test repair), `0f80628` (feat)

## Files Created/Modified

- `apps/web/lib/advisor-contract.ts` - Exact request/reply validators, limits, model selection, and fixed safe strings.
- `apps/web/lib/server/advisor-context.ts` - Server-only capped summary and top-three recommendation selection.
- `apps/web/app/api/advisor-chat/route.ts` - Ordered advisor trust boundary, quota reservation, Responses request, failure handling, and redacted telemetry.
- `apps/web/components/advisor/AdvisorChat.tsx` - Exact request body plus student-safe UI states.
- `apps/web/__tests__/fixtures/advisor-eval-cases.ts` - Fourteen synthetic evaluation cases and fixture-integrity check.
- `apps/web/__tests__/lib/advisor-guardrails.test.ts` - Contract, context, crisis, and fixture coverage.
- `apps/web/__tests__/api/advisor-chat.test.ts` - Route ordering, quota, provider payload, retry, and carry-over coverage.
- `apps/web/__tests__/components/advisor/AdvisorChat.test.tsx` - Browser payload and safe UI outcome coverage.

## Decisions Made

- Retained a direct, single-turn native `fetch` to the Responses API; agent frameworks, tools, browsing, history, and SDK-agent abstractions remain out of scope.
- Used a server-only HMAC safety identifier and existing redacted analytics storage rather than routine route `console` logging, per repository conventions.
- Kept the provider model configurable only through a server-side allowlist; an unapproved override falls back to `gpt-4.1-mini`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Preserved the migrated guest quota window for signed-in advisor users**
- **Found during:** Task 2
- **Issue:** Reserving only by account ID would let a student bypass their active guest daily window after sign-in.
- **Fix:** Read the existing account-to-guest quota binding solely to select the reservation key before provider context or provider work.
- **Files modified:** `apps/web/app/api/advisor-chat/route.ts`, `apps/web/__tests__/api/advisor-chat.test.ts`
- **Verification:** Focused route test proves the guest window reaches `reserveAdvisorAccount`.
- **Committed in:** `0f80628`, `bc7480b`

**2. [Rule 3 - Blocking] Made the required TypeScript fixture compatible with default Jest discovery**
- **Found during:** Task 2 full-suite verification
- **Issue:** Jest treats every TypeScript file under `__tests__` as a suite, so the required fixture failed with no tests.
- **Fix:** Added a minimal fixture-integrity assertion and aligned test mocks with the repository's relative-module convention.
- **Files modified:** `apps/web/__tests__/fixtures/advisor-eval-cases.ts`, `apps/web/__tests__/api/advisor-chat.test.ts`, `apps/web/__tests__/lib/advisor-guardrails.test.ts`, `apps/web/__tests__/components/advisor/AdvisorChat.test.tsx`
- **Verification:** Full Jest suite passed: 33 suites, 189 tests.
- **Committed in:** `bc7480b`

**Total deviations:** 2 auto-fixed (1 Rule 2, 1 Rule 3).
**Impact on plan:** Both changes enforce locked quota correctness and make the required regression fixture compatible with the existing test harness; no scope expansion.

## Issues Encountered

- The prescribed `corepack pnpm` command could not start because Corepack is absent from PATH. The only PATH pnpm is 11.9.0 and runs on Node 24.14.0, while this repository requires Corepack-selected pnpm 10.34.5 on Node 20.
- To verify the implementation without modifying dependencies or project configuration, the available bundled Node runtime executed the installed Jest and TypeScript binaries directly. This completed successfully: 33 Jest suites / 189 tests and `tsc --project apps/web/tsconfig.json` both passed. Re-run the documented Corepack command in a supported Node 20 environment before release.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The advisor now enforces the Phase 2 identity, context, quota, output, and fallback controls needed by follow-on authentication work.
- Run the protected qualitative fixture with qualified reviewers whenever the model, instructions, or server-context policy changes.

## Self-Check: PASSED

- Created advisor contract, context, fixture, and test files are present.
- Task commits `c1eb4d3`, `cbc1979`, `065fab2`, `bc7480b`, and `0f80628` exist in Git history.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
