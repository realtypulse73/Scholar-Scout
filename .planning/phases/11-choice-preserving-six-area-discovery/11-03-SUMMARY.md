---
phase: 11-choice-preserving-six-area-discovery
plan: 03
subsystem: catalogue-comparison
tags: [nextjs, react, shortlist, public-snapshot, accessibility]
requires:
  - phase: 11-01
    provides: Reviewed public snapshot discovery model and controlled catalogue item data.
provides:
  - Browser-local saved-choice comparison resolved only against reviewed public snapshot items.
  - Retained unavailable saved IDs with explicit student-controlled removal.
  - Fact-by-fact source, status, date, detail, and official verification actions.
affects: [phase-11-discovery, phase-12-qualification-lens, phase-13-provider-details]
tech-stack:
  added: []
  patterns:
    - Compare browser-held IDs only against the supplied public snapshot model.
    - Preserve unmatched saved IDs as unavailable; never substitute a different opportunity.
key-files:
  created:
    - apps/web/components/catalogue/CatalogueComparison.tsx
    - apps/web/__tests__/components/CatalogueComparison.test.tsx
  modified:
    - apps/web/app/shortlist/page.tsx
key-decisions:
  - "Shortlist comparison gathers one public discovery model per approved metro so a saved choice from any reviewed regional snapshot remains resolvable."
  - "Unavailable IDs remain visible until the visitor removes them; no legacy record lookup or automatic replacement occurs."
  - "Comparison remains fact-first and student-controlled, with no fit, eligibility, outcome, ranking, or winner language."
patterns-established:
  - "Source-first comparison cards use stacked definition lists and max-width/min-width safeguards instead of forcing phone pages into a wide table."
requirements-completed: [DISC-01]
coverage:
  - id: D1
    description: Saved public opportunities resolve in the unauthenticated comparison view with factual detail and official verification actions.
    requirement: DISC-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueComparison.test.tsx#shows one saved public item with source-first factual actions without sign-in
        status: pass
    human_judgment: false
  - id: D2
    description: Missing saved IDs remain visible and removable without substituting a different public record.
    requirement: DISC-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueComparison.test.tsx#keeps missing IDs and cards in saved order
        status: pass
    human_judgment: false
  - id: D3
    description: Comparison cards reflow as semantic, viewport-safe cards on phone and tablet widths.
    verification:
      - kind: unit
        ref: apps/web/__tests__/components/CatalogueComparison.test.tsx#keeps missing IDs and cards in saved order
        status: pass
    human_judgment: true
    rationale: Visual reflow at supported device widths still needs final browser inspection.
duration: 25min
completed: 2026-09-23
status: complete
---

# Phase 11 Plan 03: Snapshot-Driven Saved Choice Comparison Summary

**A public-snapshot shortlist now compares student-held saved choices fact by fact, retains retired IDs honestly, and never decides which opportunity is better.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-23T20:17:00-04:00
- **Completed:** 2026-09-23T20:42:43-04:00
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Replaced the legacy programme shortlist route with current, reviewed snapshot data across all six approved regional models.
- Added an unauthenticated, optional-account-sync comparison UI that preserves saved IDs, including records absent from the active snapshot.
- Shows every material fact with its own status, source, source date, and verification link in responsive stacked cards.
- Added regression coverage for one and multiple saved cards, unavailable choices, evidence states, removal, neutral wording, and responsive class contracts.

## Task Commits

1. **Task 1: Prove one saved public opportunity reaches source-first comparison** — `ecf33ba` (test), `47775ad` (feat)
2. **Task 2: Preserve missing choices and responsive multi-record factual comparison** — `7ba3f2e` (test)

## Files Created/Modified

- `apps/web/app/shortlist/page.tsx` — Builds all regional public discovery models from the stored reviewed snapshot before rendering comparison.
- `apps/web/components/catalogue/CatalogueComparison.tsx` — Renders source-first saved-choice cards, unavailable states, and local student-controlled removal.
- `apps/web/__tests__/components/CatalogueComparison.test.tsx` — Covers public records, evidence states, unavailable IDs, removal, neutral language, and viewport-safe class contracts.

## Decisions Made

- Resolve saved choices from the supplied public snapshot only, which prevents a stale or forged ID from exposing a legacy/private record.
- Keep unavailable saved IDs visible until a visitor removes them, rather than silently dropping or replacing their choice.
- Use vertically stacked semantic cards at every viewport width so factual comparison never requires document-level horizontal scrolling.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first shared-worktree typecheck ran while Plan 11-02's new test referenced a component that had not yet been written. Re-running after that concurrent task's component commit passed typecheck and lint; no change to this plan was needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 11 discovery surfaces can now hand off visitor-selected public record IDs to later provider-detail and qualification-lens work without reintroducing legacy programme comparison logic.
- Final Phase 11 review should include a manual phone/tablet reflow inspection of the comparison cards.

## Self-Check: PASSED

- Confirmed `CatalogueComparison.tsx`, its component test, and the snapshot-driven shortlist route exist.
- Confirmed task commits `ecf33ba`, `47775ad`, and `7ba3f2e` exist in git history.
