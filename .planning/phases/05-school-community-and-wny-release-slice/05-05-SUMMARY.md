---
phase: 05-school-community-and-wny-release-slice
plan: 05
subsystem: community inbox API safety
tags: [nextauth, rate-limit, upstash, dto, jest]
requires:
  - phase: 05-01
    provides: shared community reservation policy and author-safe public boundary
provides:
  - Session-derived, quota-protected inbox submission route
  - Explicit sender-safe inbox response DTO
  - Shared rolling-window quota regression coverage for notes and inbox requests
affects: [05-04, peer-community, campus-community]
tech-stack:
  added: []
  patterns: [validate-before-reserve, session-derived quota key, explicit public DTO mapping]
key-files:
  created: []
  modified:
    - apps/web/app/api/peer-connections/route.ts
    - apps/web/lib/campus-community.ts
    - apps/web/lib/server/rate-limit.ts
    - apps/web/__tests__/api/campus-community.test.ts
    - apps/web/__tests__/lib/rate-limit.test.ts
key-decisions:
  - "Inbox requests share the account-keyed community reservation before any persistence write."
  - "The inbox route maps stored requests to an explicit public DTO that omits sender_id."
  - "Provider outage fails closed with a safe 503 response and no write."
patterns-established:
  - "Authenticate first, validate browser input, reserve server capacity, then persist a narrowed server-owned draft."
  - "Use algorithm-aware limiter cache keys so sliding community policy cannot reuse a fixed-window limiter."
requirements-completed: [PROD-02, PROD-03]
coverage:
  - id: D1
    description: "Authenticated inbox requests validate before reserving shared community capacity and never persist after quota denial or provider outage."
    requirement: PROD-03
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/campus-community.test.ts#campus community API safety boundary"
        status: pass
    human_judgment: false
  - id: D2
    description: "Inbox responses expose an explicit DTO without a sender identifier or contact detail."
    requirement: PROD-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/campus-community.test.ts#reserves session-keyed shared capacity before creating an inbox request and returns a public DTO"
        status: pass
    human_judgment: false
  - id: D3
    description: "Community submission policy remains a five-per-hour sliding limiter with an algorithm-aware cache key distinct from fixed-window policies."
    requirement: PROD-03
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/rate-limit.test.ts#keeps the rolling community limiter separate from fixed-window caches at a boundary"
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-08-29
status: complete
---

# Phase 05 Plan 05: Protected Inbox Extension Summary

**Opt-in peer inbox requests now share the five-per-hour rolling community reservation, derive ownership from the session, and return a sender-safe public DTO.**

## Performance

- **Duration:** 20 min
- **Completed:** 2026-08-29
- **Tasks:** 1/1
- **Files modified:** 5

## Accomplishments

- Validated inbox payloads before consuming quota, narrowed the data passed to persistence, and derived both ownership and quota identity from the authenticated session.
- Joined inbox writes to the same sliding community reservation as campus notes, returning safe 429 or 503 outcomes before persistence.
- Mapped stored inbox requests to an explicit response DTO that cannot serialize `sender_id`.
- Added focused quota, outage, input-validation, response-shape, and cache-algorithm regression coverage.

## Task Commits

1. **Task 1: Bind opt-in inbox requests to the shared protected submission boundary** - `6ab3d9e` (feat; includes the TDD regression coverage and implementation)

## Files Created/Modified

- `apps/web/app/api/peer-connections/route.ts` - validates requests, reserves shared capacity, and returns an explicit public DTO.
- `apps/web/lib/campus-community.ts` - defines inbox draft/public DTO types, type guard, and response mapper.
- `apps/web/lib/server/rate-limit.ts` - uses an algorithm-aware limiter cache key.
- `apps/web/__tests__/api/campus-community.test.ts` - covers inbox validation, reservation outcomes, persistence ordering, and private-field exclusion.
- `apps/web/__tests__/lib/rate-limit.test.ts` - covers the sliding community policy and cache-key separation.

## Decisions Made

- Inbox route validation occurs before capacity reservation so invalid requests never consume shared quota.
- Only a narrowed `uploader_username`, `program_id`, and `body` draft reaches persistence; browser-supplied sender fields are ignored.
- Quota-provider unavailability is treated as a safe submission failure rather than a bypass.

## Deviations from Plan

None - plan executed as specified. The parent executor committed the task because this shared worktree's branch guard prohibits subagent commits on `codex/phase-5-discussion`.

## Issues Encountered

The subagent worktree guard correctly prevented an unsafe direct commit because the shared worktree is not on a `worktree-agent-*` branch. The parent executor committed the verified task atomically as `6ab3d9e`.

## Known Stubs

None.

## Next Phase Readiness

Plan 05-04 can consume the protected inbox route without owning submission limits, identity, or persistence authority.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand -- rate-limit campus-community` — passed (24 tests).
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/lib` — passed (23 suites, 165 tests).
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/api` — passed (12 suites, 84 tests).
- `pnpm --filter @scholar-scout/web test --runInBand -- __tests__/components` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.

## Self-Check: PASSED

- Verified task commit `6ab3d9e` exists.
- Verified all five implementation and test files above exist.

