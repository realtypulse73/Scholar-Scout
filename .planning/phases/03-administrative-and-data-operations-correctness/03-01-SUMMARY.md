---
phase: 03-administrative-and-data-operations-correctness
plan: 01
subsystem: data-recovery
tags: [nextjs, persistence, recovery, authorization, jest]
requires:
  - phase: 02-authentication-api-ai-and-webhook-controls
    provides: fresh active-staff authorization and completed Preview credential-limiter UAT
provides:
  - Staff-authorized, fresh data capability tracer with safe outage responses
  - Typed fail-closed read errors for JSON, HTTP, and Vercel Blob adapters
  - Privacy-minimal operational evidence independent of unhealthy persisted data
affects: [03-02, 03-03, 03-04, 03-05, 03-06, data-operations]
tech-stack:
  added: []
  patterns:
    - verified absence is distinct from unavailable or invalid persisted data
    - capability availability is server-authored after one fresh validated read
key-files:
  created:
    - apps/web/lib/server/data-recovery.ts
    - apps/web/app/api/admin/data/capabilities/route.ts
    - apps/web/__tests__/lib/data-recovery.test.ts
    - apps/web/__tests__/components/ProgrammeAdminManager.test.tsx
  modified:
    - apps/web/lib/server/data-store.ts
    - apps/web/__tests__/lib/data-store.test.ts
    - apps/web/__tests__/api/admin-data-routes.test.ts
key-decisions:
  - "Treat only JSON ENOENT, HTTP 404, and a confirmed missing Blob as empty storage."
  - "Return stable safe failure categories and random incident IDs without preserving provider error details."
  - "Keep operational failure evidence independent from the ScholarScout document and limited to privacy-minimal fields."
patterns-established:
  - "Validated read boundary: every successful adapter payload is structurally validated before normalization or use."
  - "Recovery evidence sink: authorized failed/no-write operations emit a safe record outside the unhealthy store."
requirements-completed: [OPS-02, OPS-03]
coverage:
  - id: D1
    description: "Authorized staff capability requests return fresh verified counts and server-owned operation availability."
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/api/admin-data-routes.test.ts#returns fresh staff-authorized capabilities without exposing provider errors"
        status: pass
      - kind: unit
        ref: "apps/web/__tests__/lib/data-recovery.test.ts#returns a fresh verified snapshot and server-owned operation capabilities"
        status: pass
    human_judgment: false
  - id: D2
    description: "Storage outages return a safe retryable 503 and privacy-minimal independent evidence."
    requirement: OPS-02
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-recovery.test.ts#emits privacy-minimal evidence and throws a safe retryable outage"
        status: pass
      - kind: integration
        ref: "apps/web/__tests__/api/admin-data-routes.test.ts#returns fresh staff-authorized capabilities without exposing provider errors"
        status: pass
    human_judgment: false
  - id: D3
    description: "JSON, HTTP, and Blob adapters return empty data only for verified absence and reject failed or invalid reads."
    requirement: OPS-03
    verification:
      - kind: unit
        ref: "apps/web/__tests__/lib/data-store.test.ts#adapter read safety tests"
        status: pass
    human_judgment: false
duration: 25min
completed: 2026-08-28
status: complete
---

# Phase 3 Plan 1: Fail-Closed Capability Tracer Summary

**A staff-authorized capability endpoint now validates one fresh persisted document and fails closed with safe incident evidence instead of presenting outages as empty data.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-28T19:45:00Z
- **Completed:** 2026-08-28T20:10:34Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added the canonical `/api/admin/data/capabilities` tracer, protected by the existing fresh active-staff boundary and backed by a fresh validated read.
- Added safe typed recovery failures, retryable incident responses, and an injected privacy-minimal evidence sink that remains available when storage is unhealthy.
- Hardened JSON, HTTP, and Vercel Blob reads so only confirmed absence produces an empty document; malformed, timed-out, provider-failed, and structurally invalid reads fail closed.
- Established deterministic loading, unavailable, retry, last-known read-only, and ready accessibility fixtures for the later administrative UI plan.

## Task Commits

Each task was committed atomically using RED then GREEN:

1. **Task 1 RED: capability and recovery contracts** - `103dc17` (test)
2. **Task 1 GREEN: fail-closed capability tracer** - `ed39d69` (feat)
3. **Task 2 RED: adapter read-safety contracts** - `e03fe2d` (test)
4. **Task 2 GREEN: validated adapter reads** - `a315303` (feat)

## Files Created/Modified

- `apps/web/lib/server/data-recovery.ts` - Defines capability DTOs, safe failures, and the independent operational-evidence sink.
- `apps/web/app/api/admin/data/capabilities/route.ts` - Serves the staff-authorized capability tracer and safe 503 contract.
- `apps/web/lib/server/data-store.ts` - Distinguishes verified absence from typed unavailable, timeout, and invalid-data reads.
- `apps/web/__tests__/lib/data-recovery.test.ts` - Covers fresh reads, authoritative operations, safe failures, and evidence redaction.
- `apps/web/__tests__/lib/data-store.test.ts` - Covers JSON, HTTP, and Blob absence/failure/validation semantics.
- `apps/web/__tests__/api/admin-data-routes.test.ts` - Covers the capability route's safe outage response.
- `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` - Supplies accessible recovery-state fixtures for Phase 3 UI work.

## Decisions Made

- Provider messages and causes are not carried into safe read errors; support receives only a stable category and random incident ID.
- A missing Blob is represented only by the provider's null result; non-success provider responses and missing streams are unavailable or invalid, not empty.
- Existing governed programme fixtures were upgraded to the full validated persisted-document contract rather than weakening validation for legacy partial records.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected the pnpm 10 Jest argument form**
- **Found during:** Task 1 RED verification
- **Issue:** The plan's extra `--` caused Jest to treat the remaining arguments as separated input and did not produce executable test evidence.
- **Fix:** Used the repository's recorded pnpm 10 form: `pnpm --filter @scholar-scout/web run test --runInBand ...`.
- **Files modified:** None
- **Verification:** Focused suites executed 37 tests and passed.
- **Committed in:** No source change required

**2. [Rule 3 - Blocking] Added the capability route through a legacy broad ignore rule**
- **Found during:** Task 1 GREEN commit
- **Issue:** `.gitignore` entry `data/` ignored the new source directory even though sibling administrative data routes are tracked.
- **Fix:** Explicitly staged only the new capability route and amended the Task 1 GREEN commit.
- **Files modified:** `apps/web/app/api/admin/data/capabilities/route.ts`
- **Verification:** The route is present in commit `ed39d69` and its integration test passes.
- **Committed in:** `ed39d69`

**3. [Rule 3 - Blocking] Upgraded adapter fixtures to valid governed programme records**
- **Found during:** Task 2 GREEN verification
- **Issue:** Older adapter fixtures used partial programme records that correctly failed the new complete document validation.
- **Fix:** Added all required governance/source-verification fields to the stored programme fixtures.
- **Files modified:** `apps/web/__tests__/lib/data-store.test.ts`
- **Verification:** The data-store suite passes 22/22 tests.
- **Committed in:** `a315303`

---

**Total deviations:** 3 auto-fixed (3 blocking execution issues). **Impact on plan:** All fixes were necessary to produce trustworthy test evidence and preserve fail-closed validation; no feature scope was added.

## Issues Encountered

- The full web test command completed successfully, while the focused Plan 03-01 suites provided explicit 37/37 test evidence and typecheck completed without errors.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None. Empty collections in tests and initial data are intentional verified-empty fixtures, not UI or production placeholders.

## Verification

- Plan-focused suites: 4 suites, 37 tests passed in 3.521 seconds.
- Data-store suite: 22 tests passed.
- Full web Jest suite: command completed successfully.
- Web TypeScript typecheck: passed.

## Self-Check: PASSED

- All seven created/modified plan files exist.
- RED/GREEN commits `103dc17`, `ed39d69`, `e03fe2d`, and `a315303` exist in git history.
- Both task acceptance criteria and the plan-level verification commands passed.

## Next Phase Readiness

- Plan 03-02 can build signed recovery envelopes, bound plans, retention, and audit policy on the validated read/failure contract.
- No blocker remains for the next Phase 3 plan.

---
*Phase: 03-administrative-and-data-operations-correctness*
*Completed: 2026-08-28*
