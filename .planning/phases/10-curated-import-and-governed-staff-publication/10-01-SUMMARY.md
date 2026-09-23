---
phase: 10-curated-import-and-governed-staff-publication
plan: 01
subsystem: catalogue-publication
tags: [nextjs, typescript, jest, staff-authorization, cas, catalogue]
requires:
  - phase: 09-catalogue-foundations-and-source-contracts
    provides: controlled catalogue regions, facts, source metadata, and freshness contracts
provides:
  - server-only capability-aware staff authorization for catalogue mutations
  - private CAS-backed candidate staging with editorial completeness feedback
  - additive validated catalogue-publication persistence state
affects: [10-02, catalogue-review, catalogue-publication]
tech-stack:
  added: []
  patterns: [server-side capability check before body parsing, private correction-ready drafts, additive state normalization]
key-files:
  created:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/app/api/admin/catalogue-publications/route.ts
  modified:
    - apps/web/lib/server/active-staff.ts
    - apps/web/lib/server/data-store.ts
key-decisions:
  - "Catalogue staging requires the current active allowlist and editor capability before request parsing."
  - "Checklist pass represents editorial completeness only, never provider truth, eligibility, or outcomes."
  - "Unusable media yields a factual text-and-source fallback rather than blocking an otherwise complete record."
patterns-established:
  - "Use one conditional document mutation for each bounded catalogue state change."
  - "Reject malformed stored publication state instead of silently repairing it."
requirements-completed: [EVID-03, PUB-01, PUB-02]
coverage:
  - id: D1
    description: Active editor-capable staff can stage a private catalogue draft through the guarded API.
    requirement: PUB-01
    verification:
      - kind: integration
        ref: apps/web/__tests__/api/admin-catalogue-publications.test.ts#stages a private candidate for an active actor
        status: pass
    human_judgment: false
  - id: D2
    description: Checklist feedback is ordered, safe, and explicitly limited to editorial completeness.
    requirement: EVID-03
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#returns the ordered six-category completeness summary and disclosure
        status: pass
    human_judgment: false
  - id: D3
    description: Missing or unusable media rights retains factual information through a media fallback.
    requirement: PUB-02
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#uses factual text-and-source fallback for media rights
        status: pass
    human_judgment: false
duration: 42min
completed: 2026-09-23
status: complete
---

# Phase 10 Plan 01: Checked Private Catalogue Drafts Summary

**Server-authorized editors can stage source-backed private catalogue drafts with a deterministic editorial-completeness checklist, recoverable corrections, and additive CAS-backed persistence.**

## Performance

- **Duration:** 42 min
- **Completed:** 2026-09-23T03:04:40Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- Added a guarded `POST /api/admin/catalogue-publications` staging seam that authorizes an editor capability before parsing the request body.
- Added a server-only, strict active-email capability resolver that supports combined editor/reviewer/administrator capabilities without trusting browser or JWT roles.
- Added private candidate state, a six-category editorial-completeness checklist, media-rights fallback, concise audit records, and additive store validation/normalization.

## Task Commits

1. **Task 1: Stage one checked editor candidate end to end** — `f969e6e` (test), `b2e89cb` (feat)
2. **Task 2: Complete the reusable checklist and privacy-minimal state invariants** — `573579f` (test), `f335041` (fix)

## Files Created/Modified

- `apps/web/lib/catalogue-publication.ts` — publication state, checklist, rights, and audit contracts.
- `apps/web/lib/server/catalogue-publications.ts` — one-shot CAS private-draft staging command.
- `apps/web/app/api/admin/catalogue-publications/route.ts` — staff-only staging route with safe errors.
- `apps/web/lib/server/active-staff.ts` — strict capability-map parsing after current allowlist authorization.
- `apps/web/lib/server/data-store.ts` — additive publication state normalization and invalid-state rejection.
- `apps/web/__tests__/api/admin-catalogue-publications.test.ts` — route authorization-before-body and capability-combination coverage.
- `apps/web/__tests__/lib/catalogue-publication.test.ts` — checklist, media fallback, and audit-redaction coverage.
- `apps/web/__tests__/lib/data-store.test.ts` — legacy and malformed-publication-state coverage.

## Decisions Made

- Capability configuration is a server-only JSON map from normalized email to a nonempty, duplicate-free capability array.
- Missing, expired, revoked, or uncertain rights remove media through a fallback status; they do not turn factual opportunity details into a publication blocker.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tightened claim-boundary detection and audit validation**
- **Found during:** Task 2
- **Issue:** The initial claim filter missed the word “eligibility,” and publication-audit validation allowed extra private fields.
- **Fix:** Expanded prohibited claim wording and made audit records reject undeclared fields.
- **Files modified:** `apps/web/lib/catalogue-publication.ts`
- **Verification:** Focused catalogue-publication and data-store tests pass.
- **Committed in:** `f335041`

**2. [Rule 3 - Blocking] Preserved existing active-staff test compatibility**
- **Found during:** Task 1
- **Issue:** Existing privileged routes mock staff actors with only an ID; making new capability fields required prevented repository typechecking.
- **Fix:** Kept the new runtime actor fields populated while making their interface optional for unrelated existing routes.
- **Files modified:** `apps/web/lib/server/active-staff.ts`
- **Verification:** Typecheck and lint pass.
- **Committed in:** `b2e89cb`

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/api/admin-catalogue-publications.test.ts __tests__/lib/catalogue-publication.test.ts __tests__/lib/data-store.test.ts` — 45 tests passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.

## Next Phase Readiness

Plan 10-02 can add bounded intake and independent review using the private draft state, reusable checklist, capability resolver, and one-shot conditional mutation pattern.

## Self-Check: PASSED

- Confirmed all eight implementation/test files and this summary exist.
- Confirmed task commits `f969e6e`, `b2e89cb`, `573579f`, and `f335041` exist.

---
*Phase: 10-curated-import-and-governed-staff-publication*
*Completed: 2026-09-23*
