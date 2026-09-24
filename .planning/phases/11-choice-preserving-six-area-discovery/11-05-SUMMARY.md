---
phase: 11-choice-preserving-six-area-discovery
plan: 05
subsystem: public-catalogue-discovery
tags: [nextjs, react, typescript, catalogue, evidence, comparison]
requires:
  - phase: 11-01
    provides: reviewed public discovery model and controlled URL helpers
  - phase: 11-02
    provides: source-first public cards and focused snapshot detail
  - phase: 11-03
    provides: browser-local reviewed saved-choice comparison
  - phase: 11-04
    provides: accessible responsive discovery surface contracts
provides:
  - bounded reviewed factual reasons on each public discovery item
  - source-first reason rendering across cards, detail, and comparison
  - controlled six-area saved-choice detail URLs
affects: [phase-11-verification, phase-12-qualification-lens, phase-13-provider-details]
tech-stack:
  added: []
  patterns: [snapshot-derived-factual-reasons, direct-fact-source-action, metro-preserving-detail-link]
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-discovery.ts
    - apps/web/components/catalogue/CatalogueOpportunityCard.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/components/catalogue/CatalogueComparison.tsx
    - apps/web/__tests__/lib/catalogue-discovery.test.ts
    - apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
    - apps/web/__tests__/components/CatalogueComparison.test.tsx
    - apps/web/__tests__/app/programmes/[id]/page.test.tsx
key-decisions:
  - "Reasons to consider are limited to reviewed skill, delivery, and training-payer facts, preserving each fact's evidence rather than making a learner-specific claim."
  - "Comparison detail URLs use the selected reviewed item's controlled region and fixed neutral filters, never browser or profile state."
requirements-completed: [DISC-02]
coverage:
  - id: D1
    description: Public discovery items derive no more than three source-backed factual reasons or an honest empty collection.
    requirement: DISC-02
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-discovery.test.ts#derives at most three neutral factual reasons from reviewed public facts with their original evidence
        status: pass
    human_judgment: false
  - id: D2
    description: Overview cards and focused detail expose factual reason source, date, state, verification guidance, and direct source actions.
    requirement: DISC-02
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx#shows one source-backed factual reason with a direct fact source separate from details
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueFocusView.test.tsx#renders every factual reason with source evidence state date and a direct verification path
        status: pass
    human_judgment: false
  - id: D3
    description: Saved comparison cards show factual reasons and preserve each controlled six-area metro in the detail route.
    requirement: DISC-02
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueComparison.test.tsx#builds the controlled metro detail URL for its saved record
        status: pass
      - kind: integration
        ref: apps/web/__tests__/app/programmes/[id]/page.test.tsx#resolves a reviewed non-Houston record when its controlled metro is supplied
        status: pass
    human_judgment: false
metrics:
  duration: 12min
  completed: 2026-09-24
  tasks: 3
  files: 9
status: complete
---

# Phase 11 Plan 05: Source-First Discovery Gap Closure Summary

**Every reviewed discovery option now carries a bounded set of verifiable factual reasons through its cards, detail screen, and saved comparison, while saved choices retain their own six-area detail context.**

## Accomplishments

- Derived up to three neutral factual reasons only from reviewed public skill, delivery, and training-payer facts, preserving source, date, state, and verification guidance with an honest empty state.
- Added direct fact-source actions on overview cards and full source-first factual reason sections on focused detail and saved-choice comparison.
- Replaced comparison's incomplete detail path with controlled metro-preserving URLs and proved all six metro IDs plus a reviewed Buffalo record resolve correctly.

## Task Commits

1. **Task 1: Derive a bounded, source-backed factual-reasons DTO from the reviewed snapshot** — `dc9f7cc` (RED test), `81c749c` (implementation)
2. **Task 2: Render source-first factual reasons on overview cards and focused detail** — `68da079` (RED test), `aa2fb6f` (implementation)
3. **Task 3: Complete comparison reasons and preserve each saved item's controlled metro** — `169d316` (RED test), `3bbd305` (implementation)

## Verification

- Focused discovery model, card, focus, and comparison suites: **25 tests passed**.
- Dynamic detail route regression: **3 tests passed**, including Greater Buffalo resolution.
- Full in-band web Jest suite: passed.
- `corepack pnpm --filter @scholar-scout/web run typecheck` — passed.
- `corepack pnpm --filter @scholar-scout/web run lint` — passed.
- Jest reports only the inherited multiple-lockfile workspace-root warning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated existing typed discovery fixtures for the required reasons field**
- **Found during:** Task 1
- **Issue:** Existing card, focus, and comparison fixtures could not typecheck after `reasonsToConsider` became a required public DTO field.
- **Fix:** Added explicit reviewed reason fixtures to those existing tests.
- **Files modified:** component test fixtures listed above
- **Committed in:** `81c749c`

## Known Stubs

None. The non-media preview remains intentional Phase 13 scope and does not affect the factual reasons contract.

## Next Phase Readiness

The Phase 11 code gaps are closed. The remaining Phase 11 human acceptance is the existing responsive keyboard, screen-reader, and reduced-motion browser procedure in `11-VALIDATION.md`.

## Self-Check: PASSED

- Confirmed the summary and all four repaired production modules exist in the active worktree.
- Confirmed all six TDD commits exist in git history.
