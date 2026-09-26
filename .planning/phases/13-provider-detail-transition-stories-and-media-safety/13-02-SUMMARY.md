---
phase: 13-provider-detail-transition-stories-and-media-safety
plan: 02
subsystem: catalogue-discovery-ui
tags: [nextjs, react, typescript, catalogue, media-safety, accessibility]
requires:
  - phase: 13-provider-detail-transition-stories-and-media-safety
    provides: reviewed local-only renderableMedia projection and factual fallback
provides:
  - optional governed visual explorer beside all existing factual catalogue controls
  - center-visible local preview arbitration with user pause and reduced-motion safety
  - equal provider-detail comparison and official-source actions
affects: [phase-13-04, catalogue-discovery, provider-detail, media-safety]
tech-stack:
  added: []
  patterns: [overview-owned-playback-arbitration, local-only-preview-slot, paired-student-choice-actions]
key-files:
  created:
    - apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx
  modified:
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/components/catalogue/DiscoveryPreviewSlot.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
key-decisions:
  - "Keep visual discovery additive: filtering, coverage, factual cards, and all six metro controls remain independent of media."
  - "Let the overview arbitrate one local preview at a time; preview slots receive no external media or embed contract."
  - "Present comparison and the labelled official provider source as matched detail actions so students retain their Scholar Scout context."
patterns-established:
  - "A visual card routes to Scholar Scout provider detail first and never directly to a provider or remote media surface."
  - "Local preview playback is observer- and viewport-coordinated, muted, pauseable, reduced-motion-safe, and never timer-driven."
requirements-completed: [MEDIA-01, MEDIA-02]
coverage:
  - id: D1
    description: Optional visual explorer preserves factual six-area browsing and routes a visual card to Scholar Scout detail.
    requirement: MEDIA-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx#adds an optional visual explorer without removing ordinary six-area factual browsing
        status: pass
    human_judgment: true
    rationale: Visual hierarchy and clarity across responsive layouts require browser review.
  - id: D2
    description: One local preview nearest the visible viewport center may play, with manual pause and reduced-motion stop.
    requirement: MEDIA-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx#allows only the visible visual card nearest the viewport center to play and retains a manual pause
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx#uses a local preview only when overview playback permits it and catches rejected playback
        status: pass
    human_judgment: true
    rationale: Real scrolling, media permissions, and device motion preferences need browser confirmation.
  - id: D3
    description: Illustration and no-media states remain local-only factual presentation with no iframe or embed renderer.
    requirement: MEDIA-02
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx#shows a labelled Scholar Scout illustration or complete factual fallback without an embed surface
        status: pass
    human_judgment: false
  - id: D4
    description: Detail presents matched Compare this option and Visit the official provider site actions, with the official source opened securely in a new tab.
    requirement: MEDIA-02
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueFocusView.test.tsx#pairs comparison with the official provider source using equal actions
        status: pass
    human_judgment: false
metrics:
  duration: 55min
  completed: 2026-09-26
  tasks: 2
  files: 6
status: complete
---

# Phase 13 Plan 02: Visual Discovery and Safe Preview Summary

**Optional reviewed visual cards now lead into Scholar Scout detail while local previews remain single-card, muted, pauseable, reduced-motion-safe, and never expose an embed renderer.**

## Performance

- **Duration:** 55min across checkpoint-resumed execution
- **Completed:** 2026-09-26
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Added an optional visual explorer using only reviewed `renderableMedia`; every existing metro, pathway, filter, coverage cell, factual card, and shortlist workflow remains available without media or personal data.
- Routed visual cards to Scholar Scout provider detail first and paired `Compare this option` with `Visit the official provider site` using equivalent action treatment; the official source uses a secure new tab.
- Centralized local video arbitration in the discovery overview: only the visible card nearest the viewport center can request muted playback, with scroll/center exits, a visible pause/play control, reduced-motion stop, and safe playback-rejection handling.
- Kept the preview slot local-only: reviewed local previews and labelled Scholar Scout illustrations render, while missing media remains a complete factual fallback with no iframe, embed URL, timer, or auto-advance behavior.

## Task Commits

1. **Task 1: Add optional governed visual cards and equal provider-detail next steps** — `844a5c8` (RED tests), `070fce5` (implementation)
2. **Task 2: Enforce the single-card motion and factual-fallback interaction contract** — `725f411` (RED tests), `c9960f5` (implementation), `05c0956` (lint correction)

## Verification

- PASS — focused catalogue discovery, preview-slot, and focus-detail suites: 17 tests across 3 suites.
- PASS — `corepack pnpm --filter @scholar-scout/web run typecheck`.
- PASS — `corepack pnpm --filter @scholar-scout/web run lint`.
- Jest emitted only the inherited multiple-lockfile workspace-root warning.

## Files Created/Modified

- `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` — optional visual-card explorer and overview-owned IntersectionObserver playback coordinator.
- `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` — local preview control/status, rejected-play handling, illustration rendering, and no-media fallback.
- `apps/web/components/catalogue/CatalogueFocusView.tsx` — equivalent Compare and official-provider detail actions.
- `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx` — optional browsing and central-preview behavior coverage.
- `apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx` — local-only playback, illustration, and factual-fallback coverage.
- `apps/web/__tests__/components/CatalogueFocusView.test.tsx` — equivalent detail-action treatment coverage.

## Decisions Made

- Visual discovery is an additive entry point, never a replacement for factual browsing or an input gate.
- An eligible media projection is rendered only as a local preview or labelled illustration; approved embeds remain unrenderable reviewed evidence in this phase.
- A single overview controller owns autoplay eligibility, while slots only execute the already-arbitrated local playback decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Lint correctness] Derived stable playback flags for the local media effect.**
- **Found during:** Final verification after Task 2.
- **Issue:** The preview effect referenced the playback object directly, causing an exhaustive-dependencies warning that blocked the zero-warning lint gate.
- **Fix:** Derived explicit playback-control, play, and reduced-motion flags and used them as effect dependencies.
- **Files modified:** `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx`
- **Verification:** Focused 17-test suite, typecheck, and lint passed.
- **Committed in:** `05c0956`

**Total deviations:** 1 auto-fixed Rule 1 correction.
**Impact on plan:** Required for the mandated lint gate; no scope expansion.

## Issues Encountered

- Worktree Git index writes intermittently required parent coordination; all task commits were ultimately recorded before this summary.

## Known Stubs

None. The no-media UI is the intentional source-first factual fallback, not a placeholder.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 13 Plan 04 can use the visual-discovery and preview regressions for cross-surface validation. Browser review remains appropriate for real playback permissions, responsive hierarchy, and disclosure clarity.

## Self-Check: PASSED

- Confirmed all six plan-owned implementation and test files exist.
- Confirmed commits `844a5c8`, `070fce5`, `725f411`, `c9960f5`, and `05c0956` exist in Git history.

---
*Phase: 13-provider-detail-transition-stories-and-media-safety*
*Completed: 2026-09-26*
