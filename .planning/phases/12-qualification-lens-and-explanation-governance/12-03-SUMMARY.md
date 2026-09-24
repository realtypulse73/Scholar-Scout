---
phase: 12-qualification-lens-and-explanation-governance
plan: 03
subsystem: programmes qualification lens interface
tags: [nextjs, react, typescript, jest, accessibility, catalogue, qualification-governance]
requires:
  - phase: 12-01
    provides: private account qualification records and shared editor
  - phase: 12-02
    provides: serializable source-preserving qualification lens DTOs and all-visible ordering
  - phase: 12-04
    provides: reviewed qualification evidence in governed catalogue snapshots
provides:
  - Programmes qualification editor entry with focus restoration
  - Transient normal and qualifications-first all-visible catalogue ordering
  - Source-first card explanations with explicit verification guidance
affects: [12-05, programmes, catalogue-discovery, qualification-lens]
tech-stack:
  added: []
  patterns:
    - Server pages pass only structured qualification keys and keywords into the serializable lens DTO
    - Qualification ordering remains a local presentation choice that never removes filtered results
    - Factual source rows communicate uncertainty before optional details
key-files:
  created:
    - apps/web/components/qualifications/QualificationExplanation.tsx
  modified:
    - apps/web/app/programmes/page.tsx
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/components/catalogue/CatalogueOpportunityCard.tsx
    - apps/web/components/qualifications/QualificationRecordForm.tsx
    - apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx
    - apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx
key-decisions:
  - "Keep normal catalogue order as the Programmes default and make qualifications-first a transient local radio choice."
  - "Render missing, stale, unknown, and conflicting factual connections as visible verification work rather than a student or opportunity verdict."
  - "Retain only the serializable lens DTO on Programmes so private notes and proxy fields cannot reach cards or URL state."
patterns-established:
  - "Qualification explanations present checked requirements, literal keyword connections, source/date/action evidence, and conditional documented support before optional detail."
requirements-completed: [MATCH-01, MATCH-02, MATCH-03, MATCH-04]
metrics:
  duration: 34m
  completed: 2026-09-24
status: complete
---

# Phase 12 Plan 03: Programmes Qualification Lens Summary

**Programmes now lets a signed-in student use their private, source-bounded qualification record to reorder—but never hide—reviewed opportunities and inspect factual connections with direct verification actions.**

## Performance

- **Duration:** 34m
- **Completed:** 2026-09-24
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Loaded the account qualification record server-side, supplied only structured qualification keys and explicit keywords to the lens, and kept private notes and proxy data outside the Programmes client surface.
- Added a normal-default, native `Order opportunities` radio group with live all-visible result feedback, an Account-equivalent editor entry, and focus restoration after saving or closing.
- Added a reusable short-first factual explanation before general card details: checked requirements, literal keywords, source/date/action rows, documented supports, and explicit non-color `Needs verification` treatment.
- Kept existing reviewed card actions available and made loading and recoverable qualification-lens failures fall back to ordinary browsing with a retry control.

## Task Commits

1. **Task 1: Let a signed-in student choose Qualifications first on Programmes and verify one checked requirement**
   - `c9cd0a7` — test(12-03): cover programmes qualification tracer
   - `c14eb44` — feat(12-03): add programmes qualification tracer
2. **Task 2: Render complete factual explanation states without changing availability or choice actions**
   - `ad78e1d` — test(12-03): cover programme explanation states
   - `811b56b` — feat(12-03): render factual programme explanation states
3. **Task 3: Cover Programmes accessibility, responsive, loading, and recoverable-error backstops**
   - `642d937` — test(12-03): cover programmes lens accessibility states
   - `a351790` — feat(12-03): add programmes lens recovery states

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand QualificationRecordForm CatalogueOpportunityCard CatalogueDiscoveryOverview` — passed: 3 suites, 14 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` — passed at wave completion.

## Decisions Made

- Normal catalogue remains the default; qualifications-first changes only the displayed order of the existing filtered reviewed set.
- Every displayed qualification connection includes a review source, date, and action; uncertainty is visible with words and an icon, never blue alone.
- Loading or an unavailable lens disables the alternative order while preserving normal browsing, existing student actions, and a clear retry path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used the project-standard direct Jest flag for the complete suite.**
- **Found during:** Wave-end verification.
- **Issue:** pnpm 10 forwards an extra delimiter as a literal Jest filter when the complete suite has no test-name pattern.
- **Fix:** Used `corepack pnpm --filter @scholar-scout/web test --runInBand` for aggregate verification.
- **Files modified:** None.
- **Verification:** The corrected complete-suite command exited successfully.

**Total deviations:** 1 auto-fixed verification-command correction.

## Known Stubs

None.

## Threat Flags

None. The Programmes UI consumes only the existing account-only, note-free lens DTO and reviewed snapshot evidence; it adds no route, storage write, external request, or decision authority.

## Next Phase Readiness

Plan 12-05 can reuse the same lens DTO and explanation component on opportunity detail and comparison surfaces without recalculating private data or changing availability.

## Self-Check: PASSED

- Confirmed all seven planned product and test files exist and all six task commits are reachable in Git history.
- Confirmed focused Programmes tests, lint, typecheck, and the direct complete-suite command passed.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Completed: 2026-09-24*
