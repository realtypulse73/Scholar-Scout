---
phase: 11-choice-preserving-six-area-discovery
plan: 02
subsystem: public-catalogue-discovery
tags: [nextjs, react, catalogue, evidence, accessibility, snapshot]
requires:
  - phase: 11
    provides: reviewed-snapshot-only discovery model and reversible public filters
provides:
  - source-first opportunity cards shared by catalogue overview surfaces
  - finite snapshot-only factual detail routes with explicit adjacent navigation
  - a non-media rights-review preview boundary for Phase 13
affects: [phase-11-plan-03, phase-11-plan-04, public-programmes]
tech-stack:
  added: []
  patterns: [source-first-card, finite-explicit-navigation, snapshot-only-detail, non-media-preview-boundary]
key-files:
  created:
    - apps/web/components/catalogue/CatalogueOpportunityCard.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/components/catalogue/DiscoveryPreviewSlot.tsx
    - apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
    - apps/web/__tests__/app/programmes/[id]/page.test.tsx
  modified:
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/app/programmes/[id]/page.tsx
key-decisions:
  - "Overview cards stay scannable while their facts needing attention and direct official action remain visible."
  - "Detail routes are force-dynamic, rebuild only the stored reviewed snapshot model, and never fall back to legacy programme seeds."
  - "The Phase 11 preview slot accepts no media data and renders no media until Phase 13 rights and accessibility controls exist."
requirements-completed: [DISC-02]
coverage:
  - id: D1
    description: "Source-first cards expose a practical factual summary, source state, official verification, save/compare, detail, and controlled alternate routes."
    requirement: DISC-02
    verification:
      - kind: automated_ui
        ref: "apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx#keeps source-first factual actions and facts needing verification visible"
        status: pass
    human_judgment: false
  - id: D2
    description: "Snapshot-only opportunity detail exposes all evidence and finite explicit navigation without rendering provider or learner media."
    requirement: DISC-02
    verification:
      - kind: integration
        ref: "apps/web/__tests__/app/programmes/[id]/page.test.tsx#uses a snapshot record absent from legacy seeds for page and metadata"
        status: pass
      - kind: automated_ui
        ref: "apps/web/__tests__/components/CatalogueFocusView.test.tsx#keeps complete evidence and finite visitor-controlled navigation visible without media"
        status: pass
    human_judgment: true
    rationale: "Visual reflow, keyboard focus, and reduced-motion behavior require Phase 11 browser acceptance at supported viewports."
metrics:
  completed: 2026-09-23
  tasks: 2
  files: 8
status: complete
---

# Phase 11 Plan 02: Source-First Focused Discovery Summary

**Reviewed opportunity cards and detail routes now preserve factual evidence, explicit student-controlled navigation, and a safe non-media preview boundary.**

## Accomplishments

- Extracted a compact source-first card with practical facts, verification states, official source action, save/compare actions, a detail link, and an alternate-pathway link.
- Replaced the legacy programme detail route with a current reviewed-snapshot-only route and metadata path; unknown IDs use the normal not-found response.
- Added a complete focused evidence surface with all material source/status/date/guidance records and finite Back, Previous, and Next links.
- Added a labelled rights-review-only preview slot that consumes no media data and renders no player, image, map, embed, or learner media.

## Task Commits

1. **Task 1: Render one source-first public card contract across overview and alternate routes** — `1bc021c` (RED test), `6309954` (implementation)
2. **Task 2: Build the finite focused detail and media-ready preview boundary** — `1b4d5f6` (RED test), `5fa36b3` (implementation)

## Verification

- Focused catalogue suites: **6 tests passed**.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- Jest reports only the checkout's inherited multiple-lockfile warning.

## Decisions Made

- The card shows cost or tuition plus one additional practical fact, then gives a named detail link for the full evidence set.
- The detail route uses only `getPublishedCatalogueSnapshot()` and the allowlisted discovery model; it has no static seed parameter list or governed/seed fallback.
- Visual media remains intentionally deferred: the preview component is a structural disclosure, not a media renderer.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. The empty media boundary is intentional and preserves the factual fallback until the Phase 13 rights-reviewed media contract is implemented.

## Next Phase Readiness

Phase 11 comparison and accessibility work can reuse the shared factual card language and the deterministic snapshot-only detail route.

## Self-Check: PASSED

- Confirmed all eight planned source and test files exist in the active worktree.
- Confirmed task commits `1bc021c`, `6309954`, `1b4d5f6`, and `5fa36b3` exist.
