---
phase: 02-authentication-api-ai-and-webhook-controls
plan: 12
subsystem: authentication-api
tags: [nextjs, next-auth, opaque-guest, validation, shortlist, onboarding]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: "Opaque guest actors, trusted storage keys, and same-device migration."
provides:
  - "Actor-scoped onboarding profile reads and validated writes for accounts and opaque guests."
  - "Actor-scoped shortlist and decision-plan reads and bounded all-or-nothing request validation."
affects: [02-10, account-ownership, onboarding, shortlist]
tech-stack:
  added: []
  patterns:
    - "Resolve actor ownership server-side before every account-data store operation."
    - "Use byte-bounded exact JSON contracts before multi-write account route changes."
key-files:
  created:
    - apps/web/__tests__/api/account-guest-routes.test.ts
  modified:
    - apps/web/app/api/account/onboarding/route.ts
    - apps/web/app/api/account/shortlist/route.ts
key-decisions:
  - "Account onboarding and shortlist routes permit guest trials only through resolveStudentActor({ allowGuest: true }) and never body-selected ownership."
  - "Onboarding writes require a fully valid finite-enum profile; shortlist plans must be bounded and belong to submitted shortlist IDs."
patterns-established:
  - "Expected actor-resolution outages return a non-sensitive 503 while missing actors return 401."
  - "Validate each complete persistence request before either shortlist store write to avoid invalid-request partial changes."
requirements-completed: [SEC-01]
coverage:
  - id: D1
    description: "Opaque guests and accounts read/write onboarding profiles only through their server-resolved storage key."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/account-guest-routes.test.ts#account guest routes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Opaque guests and accounts read/write bounded shortlist IDs and decision plans without browser-selected ownership."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/account-guest-routes.test.ts#account guest routes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Migrated activity is visible through the account actor and unavailable after guest-credential invalidation."
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/account-guest-routes.test.ts#account guest routes"
        status: pass
    human_judgment: false
duration: 40min
completed: 2026-07-28
status: complete
---

# Phase 02 Plan 12: Guest-Aware Onboarding and Shortlist Summary

**Onboarding and shortlist APIs now use only opaque guest or account actor storage keys, with bounded exact contracts before private state changes.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-07-28T00:47:00-04:00
- **Completed:** 2026-07-28T01:27:46-04:00
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Replaced session-only onboarding access with actor-scoped account/guest access and validated complete finite onboarding profiles before saves.
- Replaced session-only shortlist access with actor-scoped account/guest access, bounded programme IDs and decision-plan entries, and validation before either write.
- Added route-contract coverage for guest isolation, attempted identity substitution, invalid payloads, and account visibility after Plan 03 migration.

## Task Commits

1. **Task 1: Route onboarding profiles through the resolved student actor** - `630efe5` (TDD RED), `d3620c0` (feat)
2. **Task 2: Route shortlists and decision plans through the resolved student actor** - `b5b3e73` (TDD RED), `3600885` (feat)

## Files Created/Modified

- `apps/web/app/api/account/onboarding/route.ts` - Resolves trusted student actors and validates complete bounded onboarding payloads.
- `apps/web/app/api/account/shortlist/route.ts` - Resolves trusted student actors and validates bounded shortlist/plan payloads before writes.
- `apps/web/__tests__/api/account-guest-routes.test.ts` - Verifies guest/account isolation, validation boundaries, and post-migration access behavior.

## Decisions Made

- Permit guest access on these private student routes only via Plan 03's server-side `resolveStudentActor({ allowGuest: true })`; request bodies never nominate a storage key, account, or guest.
- Treat fully completed onboarding data and a shortlist-associated plan map as the exact persistence contracts, rejecting malformed, oversized, unknown, and out-of-domain input before any write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowed an untrusted affordability value before numeric validation**
- **Found during:** Task 1 verification
- **Issue:** TypeScript correctly rejected numeric comparisons on an `unknown` request value.
- **Fix:** Added a runtime number guard before integer and range checks.
- **Files modified:** `apps/web/app/api/account/onboarding/route.ts`
- **Verification:** Focused test suite and web typecheck passed.
- **Committed in:** `d3620c0`

### Execution Environment

- The default runtime exposed Node 24/pnpm 11, which violates the repository's Node 20/pnpm 10.34.5 engine contract. Verification used the pre-provisioned Node 20 Corepack runtime; no package, lockfile, or global-tool changes were made.

**Total deviations:** 1 auto-fixed Rule 1 correctness issue. No scope expansion.

## Issues Encountered

None after using the repository-compatible Node 20/Corepack verification runtime.

## Known Stubs

None.

## Threat Flags

None - the routes are existing plan-declared account trust boundaries; this plan narrowed them without adding a new endpoint or trust boundary.

## Verification

- `pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/account-guest-routes.test.ts` - passed (6 tests).
- `pnpm --filter @scholar-scout/web test --runInBand` - passed (34 suites, 195 tests).
- `pnpm --filter @scholar-scout/web run typecheck` - passed.
- `pnpm --filter @scholar-scout/web run lint` - passed.

## Next Phase Readiness

- Plan 03's migration path now has actor-scoped onboarding and shortlist consumers, so Plan 10 can trigger guest migration after sign-in without restoring a browser-selected identity path.

## Self-Check: PASSED

- All three plan-owned source and test files exist.
- All four TDD and implementation commits exist in Git history.
- Focused and full web verification passed.

---
*Phase: 02-authentication-api-ai-and-webhook-controls*
*Completed: 2026-07-28*
