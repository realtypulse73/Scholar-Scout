---
phase: 12-qualification-lens-and-explanation-governance
plan: 05
subsystem: catalogue detail and comparison qualification lens
tags: [nextjs, react, typescript, jest, accessibility, catalogue, qualification-governance]
requires:
  - phase: 12-03
    provides: shared source-first qualification explanation renderer and Programmes lens behavior
  - phase: 12-02
    provides: serializable note-free qualification lens DTOs
provides:
  - Detail-page composition of account qualifications and reviewed snapshot evidence
  - Comparison composition of the same per-item factual explanations
  - Cross-surface accessibility and action-preservation regression coverage
affects: [phase-13, catalogue-detail, shortlist, qualification-lens]
tech-stack:
  added: []
  patterns:
    - Detail and comparison pages build the shared lens server-side from only structured choices and explicit keywords
    - The same shared explanation component preserves wording, source metadata, and verification actions on every learner surface
key-files:
  created: []
  modified:
    - apps/web/app/programmes/[id]/page.tsx
    - apps/web/app/shortlist/page.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/components/catalogue/CatalogueComparison.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
    - apps/web/__tests__/components/CatalogueComparison.test.tsx
key-decisions:
  - "Build note-free qualification explanations at each server page seam from the reviewed snapshot and account-held structured choices and keywords."
  - "Use the existing shared explanation renderer on detail and comparison surfaces so factual copy, source dates, and verification actions cannot drift."
patterns-established:
  - "Learner-facing qualification facts are an optional explanatory layer that never changes saved order, visibility, navigation, or student-controlled choice actions."
requirements-completed: [MATCH-02, MATCH-03, MATCH-04]
metrics:
  duration: 28m
  completed: 2026-09-24
status: complete
---

# Phase 12 Plan 05: Detail and Comparison Qualification Lens Summary

**Programme detail and saved-choice comparison now render the same source-backed, note-free qualification explanation as Programmes while keeping every existing verification, navigation, save, and removal action intact.**

## Performance

- **Duration:** 28m
- **Completed:** 2026-09-24
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Built the account qualification lens on the detail server page and passed the exact explanation for its reviewed item into the shared focus component.
- Built a per-item explanation map server-side for the saved-choice comparison without exposing private notes or adding a browser persistence path.
- Reused the shared explanation renderer before general reasons on both surfaces, preserving checked requirement, literal keyword, documented support, `Needs verification`, source/date/action, and expandable-detail behavior.
- Added focused regression coverage for long factual text, visible non-color uncertainty, keyboard expansion, direct verification links, and retained detail, official-source, save, and remove controls.

## Task Commits

1. **Task 1: Show one Programmes explanation unchanged on its detail view**
   - `09db77c` — test(12-05): cover detail qualification explanation
   - `4e83b62` — feat(12-05): show qualification facts on detail pages
2. **Task 2: Carry the shared explanation into comparison and close cross-surface accessibility states**
   - `d14fb28` — test(12-05): cover comparison qualification explanation
   - `4b364ec` — feat(12-05): add comparison qualification facts

## Verification

- `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueFocusView.test.tsx` — passed: 1 suite, 5 tests.
- `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/components/CatalogueFocusView.test.tsx __tests__/components/CatalogueComparison.test.tsx` — passed: 2 suites, 18 tests.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web test --runInBand` — passed at wave completion.

## Decisions Made

- Detail and shortlist pages pass only `structured` qualification keys and explicit `keywords` into the lens builder; private note text never becomes a component prop, URL value, or comparison state.
- The shared explanation component remains the sole presenter of qualification evidence so its factual labels, blue supplemental verification row, icon, source date, and direct action stay consistent.
- Qualification explanations remain optional information: comparison retains visitor-saved order and unavailable IDs, while detail retains existing alternate, official-source, shortlist, and comparison controls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test reliability] Focused the intended expander before testing Enter-key activation.**
- **Found during:** Task 2 focused comparison verification.
- **Issue:** A generic Tab traversal reached the preceding browse link in jsdom and attempted navigation instead of testing the targeted expander.
- **Fix:** Explicitly focused `Show details`, then activated it with Enter.
- **Files modified:** `apps/web/__tests__/components/CatalogueComparison.test.tsx`.
- **Verification:** Focused detail and comparison tests passed with `aria-expanded` changing to the visible `Hide details` state.

**2. [Rule 3 - Blocking] Used the project-standard direct Jest flag for the complete suite.**
- **Found during:** Wave-end verification.
- **Issue:** pnpm 10 forwards an extra delimiter as a literal Jest filter when the complete suite has no test-name pattern.
- **Fix:** Used `corepack pnpm --filter @scholar-scout/web test --runInBand` for aggregate verification.
- **Files modified:** None.
- **Verification:** The corrected complete-suite command exited successfully.

**Total deviations:** 2 auto-fixed (one test-reliability correction and one verification-command correction).

## Known Stubs

None.

## Threat Flags

None. The plan adds only server-side composition of the existing account-bound, note-free DTO and its established shared renderer; it introduces no route, provider request, storage mutation, or eligibility/outcome authority.

## Next Phase Readiness

Phase 12 is complete. Phase 13 can build provider detail and transition-story surfaces on the governed factual catalogue, without reintroducing qualification predictions or private-data propagation.

## Self-Check: PASSED

- Confirmed all six planned product and test files exist and all four task commits are reachable in Git history.
- Confirmed focused detail/comparison tests, lint, typecheck, and the direct complete-suite command passed.

---
*Phase: 12-qualification-lens-and-explanation-governance*
*Completed: 2026-09-24*
