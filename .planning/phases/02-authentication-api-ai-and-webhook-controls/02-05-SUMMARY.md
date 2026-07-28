---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 05
subsystem: engagement-api-security
tags: [authorization, student-actor, request-validation, referrals, analytics, tdd]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Opaque account and guest actors with server-derived storage keys."
provides:
  - "Actor-scoped referral reads and referral creation."
  - "Bounded actor-owned feed, share, and experiment-assignment writes."
  - "Regression coverage for cross-actor engagement request tampering."
affects: [02-08, 02-12, account-ownership, analytics]
tech-stack:
  added: []
  patterns:
    - "Resolve the trusted student actor before every engagement read or write."
    - "Use byte-bounded exact JSON contracts for actor-owned engagement routes."
key-files:
  created:
    - apps/web/__tests__/api/engagement-routes.test.ts
  modified:
    - apps/web/app/api/referrals/route.ts
    - apps/web/app/api/feed-events/route.ts
    - apps/web/app/api/share/route.ts
    - apps/web/app/api/ab-testing/assign/route.ts
key-decisions:
  - "Referral collections are filtered by the resolved actor rather than exposed as a global list."
  - "Feed events and shares ignore bounded legacy identity fields while assignments reject identity-bearing requests; all ownership remains actor-derived."
patterns-established:
  - "Public engagement actions may issue or reuse an opaque guest actor, but never accept a browser-selected storage key."
requirements-completed: [SEC-01]
coverage:
  - id: D1
    description: "Referral records and feed engagement are attributed only to the resolved student actor."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/engagement-routes.test.ts#engagement route ownership"
        status: pass
    human_judgment: false
  - id: D2
    description: "Shares and experiment assignment reject identity-steering and malformed bounded inputs."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/engagement-routes.test.ts#engagement route ownership"
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-07-27
status: complete
---

# Phase 2 Plan 05: Secure Engagement Ownership Summary

**Referral, feed, sharing, and experiment endpoints now derive all ownership from the trusted student actor, so browser-supplied identities cannot steer records.**

## Accomplishments

- Filtered referral GET responses to the resolved actor and created referral records with that actor as referrer.
- Replaced unbounded feed-event parsing with a finite feed ID/event-type contract and bounded integer watch time.
- Scoped share and A/B assignment analytics to the actor while allowing only finite target types and supported experiment IDs.
- Added adversarial route tests for foreign identity fields, foreign referral records, invalid IDs, invalid values, and extra metadata.

## Task Commits

1. **Task 1: Scope referrals and feed engagement to the actor** - `4bce7f0` (TDD RED), `bd2a691` (implementation)
2. **Task 2: Scope shares and experiment assignment to the actor** - `2e5bec5` (TDD RED), `4debe5f` (implementation)
3. **Compatibility correction** - `2c54627` (fix)

## Verification

- `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/engagement-routes.test.ts` - passed (4 tests).
- `corepack pnpm --filter @scholar-scout/web run typecheck` - passed.
- `corepack pnpm --filter @scholar-scout/web run lint` - passed.

## Files Created/Modified

- `apps/web/app/api/referrals/route.ts` - filters referral reads and creation by the trusted actor.
- `apps/web/app/api/feed-events/route.ts` - validates bounded feed events before actor-owned persistence.
- `apps/web/app/api/share/route.ts` - accepts finite, bounded share targets and derives the owner server-side.
- `apps/web/app/api/ab-testing/assign/route.ts` - assigns only the supported experiment to the trusted actor.
- `apps/web/__tests__/api/engagement-routes.test.ts` - regression tests for ownership and malformed request handling.

## Decisions Made

- Public engagement routes resolve account or opaque guest actors with `allowGuest: true`; no shared guest identity remains.
- Referral GET is an actor-scoped collection response, not an operational or public discovery API.
- Engagement request shapes are exact and bounded; legacy referral/feed/share identity fields are ignored for compatibility, while unsupported fields and assignment identities are rejected before store calls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved existing engagement clients without restoring browser-controlled ownership**
- **Found during:** Final verification
- **Issue:** Existing referral, feed, and share clients send legacy identity fields that the new exact route schemas rejected, causing valid actor-owned actions to return `400`.
- **Fix:** Accepted only length-bounded legacy identity fields on those routes and ignored them; all persistence and analytics continue using `actor.storageKey`. Assignment retains its stricter identity rejection because no existing client depends on the field.
- **Files modified:** `apps/web/app/api/referrals/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/share/route.ts`, `apps/web/__tests__/api/engagement-routes.test.ts`
- **Verification:** Focused Jest coverage, TypeScript, and ESLint passed.
- **Committed in:** `2c54627`

**Total deviations:** 1 auto-fixed (1 Rule 1 compatibility bug). No ownership or trust-boundary scope expansion.

## Known Stubs

None.

## Self-Check: PASSED

- All five plan-owned route/test files exist.
- TDD, implementation, and compatibility commits `4bce7f0`, `bd2a691`, `2e5bec5`, `4debe5f`, and `2c54627` exist in Git history.
- Focused Jest coverage, TypeScript, and ESLint verification passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-27*
