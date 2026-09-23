---
phase: 10-curated-import-and-governed-staff-publication
plan: 03
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, catalogue, snapshots, cas, audit]
requires:
  - phase: 10-02
    provides: approved private candidate revisions and independent staff review
provides:
  - bounded, deterministic weekly and emergency catalogue snapshots with retained manifests
  - administrator-only non-mutating weekly release preview and redacted staff snapshot history
  - cloned active-snapshot read seam for future learner discovery without provider calls
affects: [10-04, 10-05, phase-11-learner-discovery]
tech-stack:
  added: []
  patterns: [canonical digest, server-owned New York release clock, append-only snapshot lineage, cloned public DTO]
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/lib/server/programme-records.ts
    - apps/web/app/api/admin/catalogue-publications/route.ts
key-decisions:
  - "Normal releases derive their period and schedule from a server-owned America/New_York instant; client clocks and periods are never accepted."
  - "Emergency snapshots are separately reasoned and authorized, while leaving the normal weekly release slot available."
  - "The learner boundary clones only the active stored public snapshot and never reads candidates, audits, or provider integrations."
patterns-established:
  - "Build release manifests from stable-ID-sorted public records and a canonical SHA-256 digest."
  - "Preview repeats release-time validation without a conditional write; publication always repeats the validation inside its CAS mutation."
requirements-completed: [EVID-03, EVID-04, PUB-02, PUB-03]
coverage:
  - id: D1
    description: Administrator-controlled weekly snapshots are bounded, canonical, schedule-gated, and retain prior versions.
    requirement: PUB-03
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#weekly catalogue publication
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#weekly catalogue release schedule
        status: pass
    human_judgment: false
  - id: D2
    description: Release-time rechecks quarantine only invalid records, retain factual media fallbacks, and preserve retirement lineage.
    requirement: PUB-02
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#quarantines only a stale final recheck and continues publishing an unaffected candidate
        status: pass
    human_judgment: false
  - id: D3
    description: Administrator preview is non-mutating, snapshot history is redacted, and the future learner read seam returns a clone of only the active stored snapshot.
    requirement: EVID-04
    verification:
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#previews the current release outcome without a mutation and reports server-derived schedule eligibility
        status: pass
      - kind: integration
        ref: apps/web/__tests__/lib/server/catalogue-publications.test.ts#returns only a cloned active public snapshot and redacted manifest history
        status: pass
      - kind: integration
        ref: apps/web/__tests__/api/admin-catalogue-publications.test.ts#denies preview publication before parsing the request body when the actor lacks administrator capability
        status: pass
    human_judgment: false
duration: 1h 20m
completed: 2026-09-23
status: complete
---

# Phase 10 Plan 03: Deterministic Weekly Catalogue Snapshots Summary

**Approved candidate revisions now become bounded, append-only weekly or emergency catalogue snapshots with canonical manifests, safe quarantine, and a provider-independent public read seam.**

## Performance

- **Duration:** 1h 20m
- **Completed:** 2026-09-23
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added fixed America/New_York Monday 09:00–17:00 weekly scheduling, ISO-week duplicate protection, deterministic ordering, canonical SHA-256 digests, and retained manifest lineage.
- Added release-time checklist rechecks that quarantine only failed records, preserve media fallbacks, support private retirement in the next snapshot, and never retry a conditional-write conflict.
- Added administrator-only release preview/publish actions, concise redacted snapshot history, and a cloned active-snapshot seam for later learner discovery.

## Task Commits

1. **Task 1: Build deterministic weekly snapshot, retirement, and manifest command** — `67d5fe8` (test), `53a1515` (feat)
2. **Task 2: Wire administrator preview/release, history, and snapshot-only read boundary** — `a29379b` (test), `f47241c` (feat)

## Files Created/Modified

- `apps/web/lib/catalogue-publication.ts` — snapshot, manifest, schedule, validation, and canonical-digest contracts.
- `apps/web/lib/server/catalogue-publications.ts` — CAS-backed release, preview, redacted history, and cloned read commands.
- `apps/web/lib/server/programme-records.ts` — governed future-catalogue snapshot boundary.
- `apps/web/app/api/admin/catalogue-publications/route.ts` — administrator-only preview/publish and authorized history handling.
- `apps/web/__tests__/lib/catalogue-publication.test.ts` — New York release-window and ISO-period coverage.
- `apps/web/__tests__/lib/server/catalogue-publications.test.ts` — release, quarantine, retirement, preview, history, and clone-isolation coverage.
- `apps/web/__tests__/api/admin-catalogue-publications.test.ts` — request authorization-before-parsing coverage.

## Decisions Made

- A normal release receives its time zone, period, and duplicate guard entirely from the server-owned clock.
- Emergency releases require a reason and do not consume or bypass the normal weekly slot.
- The public read seam only exposes cloned records from the active stored snapshot; it does not expose candidates, rights-review metadata, checklists, or audit history.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Normalized legacy publication state before snapshot release commands**
- **Found during:** Task 1
- **Issue:** Existing persisted/test state from earlier Phase 10 work did not yet contain snapshot arrays, causing release code to dereference absent fields.
- **Fix:** Added an internal compatibility normalizer that supplies empty snapshot/manifest collections before every release command while preserving existing candidates and audits.
- **Files modified:** `apps/web/lib/catalogue-publication.ts`, `apps/web/lib/server/catalogue-publications.ts`
- **Verification:** Focused publication tests, typecheck, lint, and full Jest suite passed.
- **Committed in:** `53a1515`

**Total deviations:** 1 auto-fixed (Rule 1)

## Issues Encountered

- The worktree's direct package-script invocation did not display Jest results reliably, so verification used the workspace-local Jest executable from `apps/web`, which ran and reported the focused suites directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 10-04 can build conflict-resolution, emergency-correction, restoration, and staff-console interactions against retained snapshot manifests and the safe public-read seam.

## Self-Check: PASSED

- Confirmed every Plan 10-03 implementation/test file and this summary exist.
- Confirmed task commits `67d5fe8`, `53a1515`, `a29379b`, and `f47241c` exist.

---
*Phase: 10-curated-import-and-governed-staff-publication*
*Completed: 2026-09-23*
