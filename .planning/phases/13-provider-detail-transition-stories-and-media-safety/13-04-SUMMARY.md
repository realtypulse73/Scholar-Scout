---
phase: 13-provider-detail-transition-stories-and-media-safety
plan: "04"
subsystem: catalogue-media-safety-regression
tags: [nextjs, react, typescript, jest, accessibility, media-rights, catalogue]
requires:
  - phase: 13-provider-detail-transition-stories-and-media-safety
    provides: reviewed local-only media projection, bounded visual discovery, and finite local transition contexts
provides:
  - optional fixed Stories navigation from ordinary factual discovery
  - adversarial media-rights, projection, disclosure, and factual-fallback regression coverage
  - finite Story-route boundary coverage for controlled factual exits and no personal submissions
affects: [provider-detail, catalogue-discovery, stories, media-safety, phase-14]
tech-stack:
  added: []
  patterns: [fixed internal companion navigation, stale-rights-review fallback, cross-surface media regression matrix]
key-files:
  created: []
  modified:
    - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
    - apps/web/lib/catalogue-publication.ts
    - apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx
    - apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx
    - apps/web/__tests__/components/CatalogueFocusView.test.tsx
    - apps/web/__tests__/lib/catalogue-publication.test.ts
    - apps/web/__tests__/lib/catalogue-discovery.test.ts
    - apps/web/__tests__/components/TransitionStoryList.test.tsx
    - apps/web/__tests__/app/stories/page.test.tsx
key-decisions:
  - "Expose Stories with a fixed internal link that does not carry filters, identity, residence, qualification, or activity state."
  - "Treat a media-rights review older than the existing 183-day operational freshness boundary as ineligible presentation evidence."
  - "Keep Story regressions separate from provider-media fixtures so editorial-boundary failures stay diagnosable."
patterns-established:
  - "Media fallback preserves every factual source and official verification action when no safe projection remains."
  - "Transition contexts remain a fixed local six-record set with keyboard-first factual exits and no submission controls."
requirements-completed: [MEDIA-01, MEDIA-02, MEDIA-03]
coverage:
  - id: D1
    description: Optional Stories navigation remains a parameter-free companion to six-area factual browsing.
    requirement: MEDIA-03
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx#links to Stories from a non-default metro without changing factual browsing controls
        status: pass
    human_judgment: false
  - id: D2
    description: Media candidates fail closed for stale, missing, prohibited, unsupported, or deferred evidence while factual sources and safe local or illustrative projections survive.
    requirement: MEDIA-01
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#reviewed media projection
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx#discloses the reviewed source permission attribution and review date without adding an embed renderer
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueFocusView.test.tsx#wires a labelled illustration into detail while preserving the factual and official actions
        status: pass
    human_judgment: true
    rationale: Real-browser review is still needed for media permissions, visual clarity, responsive layout, and reduced-motion behavior.
  - id: D3
    description: Stories remain six fixed local Scholar Scout contexts with controlled factual destinations, visible non-affiliation language, and no testimony or personal-submission surface.
    requirement: MEDIA-03
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/TransitionStoryList.test.tsx#keeps six fixed general contexts keyboard-first factual exits and no testimony or submission surface
        status: pass
      - kind: automated_ui
        ref: apps/web/__tests__/app/stories/page.test.tsx#ships only the fixed local catalogue destinations never a provider-specific or personal submission route
        status: pass
    human_judgment: true
    rationale: A reviewer must still confirm that real rendered transition context cannot be mistaken for provider testimony.
metrics:
  duration: 15min
  completed: 2026-09-26
status: complete
---

# Phase 13 Plan 04: Cross-Surface Safety Regression Summary

**Optional Stories discovery, stale-rights fallback, and finite editorial-story boundaries are now guarded together with source-first provider-media regressions.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-26T18:36:05-04:00
- **Completed:** 2026-09-26T18:51:00-04:00
- **Tasks:** 3/3
- **Files modified:** 9

## Accomplishments

- Added a fixed `/stories` companion link that leaves the active factual catalogue, six approved metros, filters, coverage, and ordering intact.
- Expanded the provider-media matrix across rights states, evidence gaps, prohibited paths, D-03 precedence, disclosures, illustration labelling, factual fallback, and provider detail actions.
- Added independent Story-route checks for the fixed six local contexts, controlled factual destinations, DOM/keyboard order, visible non-affiliation, and absence of personal-submission or provider-testimony surfaces.

## Task Commits

1. **Task 1: Expose visual exploration as an optional factual-browse companion** — `ba68084` (RED test), `e4c6253` (feature)
2. **Task 2: Run the cross-surface provider-media safety regression matrix** — `64e1c24` (regression coverage and stale-review correction)
3. **Task 3: Verify finite story boundaries and factual exits** — `102dccf` (regression coverage)

## Files Created/Modified

- `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` — fixed accessible `/stories` companion action beside ordinary browse controls.
- `apps/web/lib/catalogue-publication.ts` — rejects stale media-rights reviews using the existing operational freshness policy.
- `apps/web/__tests__/components/CatalogueDiscoveryOverview.test.tsx` — preserves non-default metro factual browsing around the Stories entry.
- `apps/web/__tests__/lib/catalogue-publication.test.ts` and `apps/web/__tests__/lib/catalogue-discovery.test.ts` — cover adversarial projection selection and complete factual fallback.
- `apps/web/__tests__/components/DiscoveryPreviewSlot.test.tsx` and `apps/web/__tests__/components/CatalogueFocusView.test.tsx` — cover disclosures, illustrative presentation, no embeds, and paired provider actions.
- `apps/web/__tests__/components/TransitionStoryList.test.tsx` and `apps/web/__tests__/app/stories/page.test.tsx` — cover finite Story records, controlled destinations, keyboard order, and no personal/provider narrative surface.

## Decisions Made

- Kept the Stories entry parameter-free and internal so it cannot carry learner data or alter factual discovery state.
- Reused the existing 183-day operational evidence freshness limit for media-rights reviews rather than creating a new policy.
- Retained human review for responsive media behavior, disclosure clarity, reduced motion, and non-affiliation interpretation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Safety gap] Rejected stale media-rights reviews.**
- **Found during:** Task 2
- **Issue:** A 184-day-old review was still eligible for local visual presentation.
- **Fix:** Applied the existing 183-day operational freshness policy before selecting a renderable media candidate.
- **Files modified:** `apps/web/lib/catalogue-publication.ts`, `apps/web/__tests__/lib/catalogue-publication.test.ts`
- **Verification:** Focused provider-media matrix passed (4 suites, 57 tests); full Jest, typecheck, and lint passed.
- **Committed in:** `64e1c24`

**Total deviations:** 1 auto-fixed Rule 1 correction.
**Impact on plan:** Required for current rights evidence; no scope expansion.

## Issues Encountered

- Worktree index writes are coordinator-owned in this session; the coordinator completed the Task 3 atomic test commit after focused verification.
- Jest reports the inherited multiple-lockfile workspace-root warning; it does not affect the passing suites.

## Known Stubs

None. The no-media state is the intentional factual fallback, not a placeholder.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 14 can rely on a safer provider-media boundary and finite internal storytelling. Before release, complete the specified browser review for a local preview, illustration continuation, total factual fallback, narrow viewport, keyboard disclosure, and reduced-motion behavior.

## Self-Check: PASSED

- Confirmed all nine Plan-owned implementation and test files plus this summary exist.
- Confirmed Task commits `ba68084`, `e4c6253`, `64e1c24`, and `102dccf` exist in Git history.
- Confirmed no stub patterns in the Plan-owned source and test files.

---
*Phase: 13-provider-detail-transition-stories-and-media-safety*
*Completed: 2026-09-26*
