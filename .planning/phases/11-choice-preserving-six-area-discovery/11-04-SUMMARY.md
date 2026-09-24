---
phase: 11-choice-preserving-six-area-discovery
plan: 04
subsystem: public-catalogue-discovery
tags: [nextjs, react, accessibility, responsive-design, reduced-motion, catalogue]
requires:
  - phase: 11-01
    provides: reviewed snapshot discovery overview and controlled filters
  - phase: 11-02
    provides: source-first opportunity cards and focused detail routes
  - phase: 11-03
    provides: browser-local snapshot-driven comparison
provides:
  - accessible named controls and textual evidence states across discovery
  - narrow-viewport reflow safeguards for overview, focus, preview, and comparison
  - reduced-motion-safe focused detail decoration with unchanged factual reading order
affects: [phase-11-verification, phase-12-qualification-lens, phase-13-provider-details]
tech-stack:
  added: []
  patterns: [native-controls, aria-live-filter-summary, source-first-status-prose, stacked-responsive-cards, reduced-motion-decoration]
key-files:
  created:
    - .planning/phases/11-choice-preserving-six-area-discovery/11-04-SUMMARY.md
  modified:
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/components/catalogue/CatalogueOpportunityCard.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/components/catalogue/DiscoveryPreviewSlot.tsx
    - apps/web/components/catalogue/CatalogueComparison.tsx
    - apps/web/app/globals.css
    - apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx
    - apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
    - apps/web/__tests__/components/CatalogueComparison.test.tsx
key-decisions:
  - "Discovery result changes announce the selected factual filters in readable prose while preserving native form controls."
  - "The focused-route decoration is optional and disappears for reduced-motion visitors without removing, reordering, or animating facts or controls."
  - "Comparison remains a labelled stack of factual cards at phone and tablet widths; unavailable saved IDs stay visible and removable."
metrics:
  completed: 2026-09-24
  tasks: 3
  files: 10
status: complete
---

# Phase 11 Plan 04: Accessible Discovery Reflow Summary

**The six-area discovery journey now keeps factual status, official verification actions, and student-controlled choices accessible by keyboard, assistive technology, reduced-motion settings, and narrow viewports.**

## Accomplishments

- Added labelled native filters, a concise live result summary, readable active-filter prose, and bounded overview/card layout structures.
- Gave opportunity cards meaningful article/action names, explicit leaving-site context for official verification, textual fact states, and wrapping action rows.
- Added finite focus-route decoration that is hidden by `prefers-reduced-motion` while the source-first detail, non-media preview, and reading order remain unchanged.
- Bound focus/detail and preview widths so factual rows and student controls stack safely on phone and tablet layouts.
- Labelled the saved-opportunity comparison-card region and retained independent, named current and unavailable saved choices with native removal, details, source, date, and verification actions.

## Task Commits

1. **Task 1: Make overview and card evidence/actions semantic and keyboard-native** — `474ad0e` (`feat`)
2. **Task 2: Make focused detail and its non-media preview motion-safe and reflow-safe** — `4e9ebc6` (`feat`)
3. **Task 3: Make factual comparison responsive and close the cross-surface regression matrix** — `3090c55` (`feat`)

## Verification

- Overview/card focused suite: **4 tests passed**.
- Focused-detail suite: **2 tests passed**.
- Cross-surface Phase 11 matrix: **15 tests passed** across discovery model, overview, card, focus, comparison, and detail-route suites.
- Full web Jest suite: passed with `corepack pnpm --filter @scholar-scout/web test --runInBand`.
- Typecheck: passed.
- Lint: passed.
- Jest continues to report the inherited multiple-lockfile workspace-root warning only; it did not affect test results.

## Responsive and Assistive-Technology Acceptance Procedure

Use a reviewed public snapshot containing at least two records, one non-current fact, and one saved ID missing from the current snapshot. No provider-site visit, provider editing, or account is required.

At **320 CSS pixels with 400% zoom**, **375px**, and **768px**:

1. Open `/programmes` and use only `Tab`, `Shift+Tab`, `Enter`, `Space`, and the native selects to change metro and filters, reset them, open a record, save it, visit its official source, and open comparison.
2. Confirm every interactive element shows focus; result and empty-state messages are readable text; and `See all facts and sources` is reachable without a pointer.
3. On a focused record, tab through Back, Previous, Next, Save, comparison, alternate-route, and official-source actions. Confirm no record changes until its named link is activated.
4. On comparison, verify current and unavailable saved choices are separately labelled; each factual row names its status, source, date, and verification action; and removal changes only the selected saved ID.
5. Confirm the overview, cards, focused route, preview disclosure, and comparison have no document-level horizontal scrolling. Any future desktop data table must be separately labelled if it introduces an intentional internal scroll region.
6. With a screen reader, confirm understandable landmark, heading, filter/result, fact-status, preview-boundary, unavailable-choice, and leaving-site link names. No material state may rely on color alone.
7. Emulate `prefers-reduced-motion: reduce`; confirm focus decoration is absent while the same facts, controls, and non-media preview stay visible in the same reading order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking verification command] Used the established pnpm 10 full-suite argument form**
- **Found during:** Task 3 verification.
- **Issue:** The plan's `test -- --runInBand` form made Jest interpret `--runInBand` as a test-path pattern and exit with “No tests found.”
- **Fix:** Ran the repository-established compatible command: `corepack pnpm --filter @scholar-scout/web test --runInBand`.
- **Files modified:** None.

## Known Stubs

None. The preview remains intentionally non-media and is an explicit factual/rights-review boundary, not a missing media implementation.

## Self-Check: PASSED

- Confirmed all ten planned source/test files and this summary exist in the active worktree.
- Confirmed task commits `474ad0e`, `4e9ebc6`, and `3090c55` exist in git history.
