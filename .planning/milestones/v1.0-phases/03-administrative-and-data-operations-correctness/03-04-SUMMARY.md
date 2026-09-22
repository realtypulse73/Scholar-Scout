---
phase: 03-administrative-and-data-operations-correctness
plan: 04
subsystem: admin-data-import-recovery
tags: [nextjs, hmac, import, recovery, production-readiness]
requires:
  - phase: 03-03
    provides: authorized signed backup recovery routes and common recovery application service
provides:
  - Staff-authorized byte-bounded signed import validation with count-only previews
  - Exact staged import application through the common actor-bound recovery service
  - Fail-closed production readiness checks for dedicated current and optional previous recovery signing material
affects: [03-05, 03-06, admin-data-routes, production-readiness]
tech-stack:
  added: []
  patterns: [authorize-before-read, bounded signed envelope, opaque staged import token, dedicated signing configuration]
key-files:
  created: []
  modified:
    - apps/web/app/api/admin/data/import/validate/route.ts
    - apps/web/app/api/admin/data/import/restore/route.ts
    - apps/web/__tests__/api/admin-data-routes.test.ts
    - scripts/production-env-check.mjs
    - scripts/test-production-tooling.mjs
    - .env.production.example
key-decisions:
  - "Carry the already signed import envelope inside an encoded plan token so apply accepts only the staged token contract and never trusts a second raw snapshot field."
  - "Require dedicated recovery-signing material in production readiness and accept previous verification material only as a complete key ID/secret pair."
requirements-completed: [OPS-02, OPS-03, DATA-03]
duration: 8min
completed: 2026-08-28
status: complete
---

# Phase 3 Plan 4: Signed Import Recovery and Readiness Summary

**Bounded signed import packages now produce actor-bound count-only recovery plans, apply only through the shared one-write recovery service, and fail production readiness without dedicated recovery signing keys.**

## Performance

- **Duration:** 8 min
- **Completed:** 2026-08-28
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced browser-parsed raw snapshot validation with a five-MiB bounded request reader and authoritative signed-envelope verification after staff authorization.
- Returned count-only impact rows and a short-lived actor/state-bound staged plan while leaving application data unchanged.
- Replaced raw import restore semantics with an exact `{ planToken, reason, confirmation }` contract using the common recovery application service.
- Added production checks and an environment template for dedicated current recovery signing material plus an optional complete previous verification pair, with no `NEXTAUTH_SECRET` fallback.
- Added deterministic route and tooling coverage for size, tampering, missing signing, storage failure, exact DTOs, one-write apply, response redaction, and sanitized readiness output.

## Task Commits

1. **Task 1 RED: Signed import validation contracts** - `8580966`
2. **Task 1 GREEN: Bounded signed import validation** - `ea00bab`
3. **Task 2 RED: Staged apply and readiness contracts** - `9e91775`
4. **Task 2 GREEN: Staged import apply and signing readiness** - `05923c3`

## Files Created/Modified

- `apps/web/app/api/admin/data/import/validate/route.ts` - Authorization-first bounded signed-envelope validation and count-only plan issuance.
- `apps/web/app/api/admin/data/import/restore/route.ts` - Exact staged-plan decoding and shared recovery application with safe status mapping.
- `apps/web/__tests__/api/admin-data-routes.test.ts` - Signed import, byte-limit, unavailable, exact-contract, and apply coverage.
- `scripts/production-env-check.mjs` - Dedicated current and optional previous recovery signing readiness checks.
- `scripts/test-production-tooling.mjs` - Sanitized child-process signing configuration cases.
- `.env.production.example` - Non-secret recovery key variable names and rotation guidance.

## Decisions Made

- The staged import token contains a base64url-encoded copy of the already HMAC-signed envelope alongside the signed recovery plan. This keeps the top-level apply DTO exact and server-verifiable without introducing mutable server-local staging state.
- Recovery signing is a separate cryptographic purpose from authentication session signing; production readiness therefore rejects `NEXTAUTH_SECRET`-only configuration.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The documented pnpm command form inserted an extra argument delimiter that Jest interpreted as a test pattern. Final full-suite verification used the repository-compatible direct `--runInBand` form.

## User Setup Required

Before enabling recovery operations in a deployed environment, configure `SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID` and `SCHOLARSCOUT_RECOVERY_SIGNING_SECRET`. During a controlled rotation, configure both previous-key variables together. No secret value was generated or committed.

## Verification

- Focused admin data route suite: 13 tests passed.
- Production tooling suite: 19 tests passed.
- Full web suite: 40 suites and 243 tests passed.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.
- Responses expose only safe plan/count metadata; provider, credential, and student content remains absent from error output.

## Self-Check: PASSED

- All six modified implementation, test, and configuration files exist.
- All four required RED/GREEN task commits exist in git history.
- Both task acceptance criteria and plan-level verification passed.
- No stubs, skipped tests, or unrun verification remain.

## Next Phase Readiness

- Plan 03-05 can connect the capability-driven admin UI to the signed import preview/apply contract.
- Phase 3 is 4 of 6 plans complete with no blocker from Plan 03-04.

---
*Phase: 03-administrative-and-data-operations-correctness*
*Completed: 2026-08-28*
