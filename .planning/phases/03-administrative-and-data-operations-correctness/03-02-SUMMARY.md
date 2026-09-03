---
phase: 03-administrative-and-data-operations-correctness
plan: 02
subsystem: data-recovery
tags: [hmac, sha256, recovery, retention, audit, typescript]
requires:
  - phase: 03-01
    provides: fail-closed validated storage reads and recovery capability tracer
provides:
  - Canonical versioned 5 MiB recovery envelopes with explicit current/previous HMAC key rotation
  - Count-only ten-minute recovery plans bound to actor, source package, and current document digest
  - One-write recovery apply with pre-change backup, idempotent outcome, retention hold, and privacy-minimal audit
  - Deterministic 10-backup/30-day retention and authorized incident-hold release
affects: [03-03, 03-04, admin-data-routes, recovery-operations]
tech-stack:
  added: []
  patterns: [canonical JSON HMAC signing, server-bound recovery plans, compose-then-write mutation]
key-files:
  created: []
  modified:
    - apps/web/lib/server/data-recovery.ts
    - apps/web/lib/server/data-store.ts
    - apps/web/__tests__/lib/data-recovery.test.ts
key-decisions:
  - "Use dedicated current and optional previous recovery keys; never fall back to NEXTAUTH_SECRET."
  - "Persist successful plan outcomes in the restored document so retries return the recorded result without another write."
  - "Preserve unresolved incident-held backups regardless of count or age, while pruning ordinary backups at exact policy boundaries."
patterns-established:
  - "Recovery mutations validate package, token, actor, expiry, and fresh state before composing one store write."
  - "Recovery previews and lifecycle evidence contain counts and safe identifiers, never snapshot records."
requirements-completed: [OPS-03, DATA-03]
coverage:
  - id: D1
    description: "Signed recovery envelopes and count-only actor/state-bound plans"
    requirement: OPS-03
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-recovery.test.ts#signed recovery envelopes and bound plans"
        status: pass
    human_judgment: false
  - id: D2
    description: "One-write idempotent recovery apply with pre-change backup and privacy-minimal lifecycle audit"
    requirement: DATA-03
    verification:
      - kind: integration
        ref: "pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-recovery.test.ts __tests__/lib/data-store.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Deterministic retention and freshly authorized incident-hold release"
    requirement: DATA-03
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-recovery.test.ts#retains ten fresh backups and releases an incident hold"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-08-28
status: complete
---

# Phase 3 Plan 2: Signed Recovery Policy Summary

**Canonical HMAC-signed recovery packages now produce short-lived count-only plans and apply exactly once with bounded retention, incident holds, and privacy-minimal evidence.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-28T20:10:00Z
- **Completed:** 2026-08-28T20:24:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Enforced exact versioned recovery envelopes, 5 MiB/depth/time bounds, canonical SHA-256 digests, timing-safe HMAC checks, and explicit current/previous key rotation.
- Issued non-mutating ten-minute previews containing only counts and safe identifiers, bound to actor, source digest, current document digest, expiry, and one-use outcome.
- Composed restored data, a non-nested pre-change backup, unresolved incident hold, idempotent outcome, and minimal lifecycle audit into one store write.
- Added stable newest-first retention that keeps ten ordinary backups for less than 30 days while preserving every unresolved incident hold.

## Task Commits

Each task was committed atomically using TDD:

1. **Task 1 RED: Signed envelope and bound-plan tests** - `16a71b4`
2. **Task 1 GREEN: Signed envelopes and bound plans** - `360fadd`
3. **Task 2 RED: Apply, retention, and hold tests** - `4f96939`
4. **Task 2 GREEN: One-write apply, retention, and audit** - `d6d3628`

## Files Created/Modified

- `apps/web/lib/server/data-recovery.ts` - Canonical envelope signing/validation, plan issuance, one-write apply, retention, evidence, and hold-release policy.
- `apps/web/lib/server/data-store.ts` - Persisted recovery lifecycle events, plan outcomes, and incident-hold metadata.
- `apps/web/__tests__/lib/data-recovery.test.ts` - Tampering, rotation, expiry, replay, one-write, retention, and authorization coverage.

## Decisions Made

- Dedicated recovery signing configuration is mandatory; authentication secrets are never reused as recovery keys.
- The current key signs all new packages and plans; one explicitly configured previous key may verify retained packages during the bounded grace period.
- Successful outcomes are stored with the restored document, enabling an identical retry to return the same result without a second write.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected strict TypeScript narrowing in validated recovery DTOs**
- **Found during:** Task 2 wave typecheck
- **Issue:** Runtime validation correctly narrowed the envelope, but TypeScript retained a generic record type for the source object and nullable object helper.
- **Fix:** Constructed the typed source DTO explicitly and converted the exact-object helper to an early-return type guard.
- **Files modified:** `apps/web/lib/server/data-recovery.ts`
- **Verification:** Strict typecheck, lint, focused tests, and full suite pass.
- **Committed in:** `d6d3628`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** Type-only correctness fix; no scope expansion or policy change.

## Issues Encountered

- The global Node 24/pnpm 11 installation does not meet the repository's pinned engine contract. Verification used the documented portable Node 20/Corepack pnpm wrapper.

## User Setup Required

None for this plan. Later operational routing must configure the dedicated recovery signing key ID/secret before package capabilities are enabled.

## Verification

- Focused recovery/store suites: 32 tests passed.
- Full web suite: 40 suites and 239 tests passed.
- Strict TypeScript: passed.
- ESLint with zero warnings: passed.

## Self-Check: PASSED

- All three modified files exist.
- All four TDD task commits exist in git history.
- Task acceptance criteria and plan-level verification passed.
- No stubs, skipped tests, or unrun verification remain.

## Next Phase Readiness

- Plan 03-03 can build privileged backup and incident-hold routes on these recovery-domain contracts.
- No blocker remains from Plan 03-02.

---
*Phase: 03-administrative-and-data-operations-correctness*
*Completed: 2026-08-28*
