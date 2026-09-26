---
phase: 13-provider-detail-transition-stories-and-media-safety
plan: 01
subsystem: public-catalogue-media-safety
tags: [nextjs, react, typescript, catalogue, media-rights, accessibility]
requires:
  - phase: 10-curated-import-and-governed-staff-publication
    provides: immutable reviewed catalogue snapshots
  - phase: 11-choice-preserving-six-area-discovery
    provides: source-first factual provider detail route
provides:
  - deterministic reviewed media projection for published catalogue records
  - local-only provider detail preview with accessible rights disclosure
  - factual fallback for unsafe, incomplete, or deferred media
affects: [phase-13-02, phase-13-04, provider-detail, discovery-media]
tech-stack:
  added: []
  patterns: [publication-time-media-projection, local-only-media-rendering, source-first-factual-fallback]
key-files:
  created: []
  modified:
    - apps/web/lib/catalogue-publication.ts
    - apps/web/lib/server/catalogue-publications.ts
    - apps/web/lib/catalogue-discovery.ts
    - apps/web/components/catalogue/DiscoveryPreviewSlot.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
key-decisions:
  - "Resolve public media at publication time and expose only a serializable local preview or illustration projection."
  - "Treat approved embeds as reviewed evidence only in Phase 13; never return an embed URL or renderer to the learner surface."
  - "Keep the provider-detail visual immediately before the existing Facts and sources region with visible non-affiliation disclosure."
patterns-established:
  - "Media candidates remain staff-side input while learner DTOs carry only renderableMedia."
  - "A missing or rejected projection renders the established factual source-first fallback."
requirements-completed: [MEDIA-01, MEDIA-02]
coverage:
  - id: D1
    description: Reviewed local media travels from a published snapshot through the provider detail page with an accessible disclosure and factual source order.
    requirement: MEDIA-01
    verification:
      - kind: automated_ui
        ref: apps/web/__tests__/components/CatalogueFocusView.test.tsx#presents a reviewed local preview with disclosure before the factual source region
        status: pass
      - kind: integration
        ref: apps/web/__tests__/app/programmes/[id]/page.test.tsx#renders only the reviewed snapshot media projection before factual detail
        status: pass
    human_judgment: true
    rationale: Visual meaning, real media selection, and disclosure clarity still need browser review.
  - id: D2
    description: Unsafe candidates fail closed and a valid-but-unrenderable embed continues to a labelled Scholar Scout illustration without exposing embed instructions.
    requirement: MEDIA-02
    verification:
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-publication.test.ts#reviewed media projection
        status: pass
      - kind: unit
        ref: apps/web/__tests__/lib/catalogue-discovery.test.ts#exposes only the selected safe media projection from a published record
        status: pass
    human_judgment: false
metrics:
  duration: 45min
  completed: 2026-09-26
  tasks: 2
  files: 9
status: complete
---

# Phase 13 Plan 01: Provider Detail Media Safety Summary

**Reviewed local provider media and Scholar Scout illustrations now reach factual provider detail through a narrow, rights-evidenced snapshot projection with a complete factual fallback.**

## Performance

- **Duration:** 45min
- **Completed:** 2026-09-26T21:57:29Z
- **Tasks:** 2/2
- **Files modified:** 9

## Accomplishments

- Added bounded media-candidate validation and deterministic D-03 resolution: local preview, deferred embed, labelled illustration, then factual fallback.
- Persisted only `renderableMedia` and `mediaFallback` into new public snapshot records; discovery and detail consume no raw candidates or embed payloads.
- Replaced the structural detail slot with a local-only presenter, accessible About this media dialog, reviewed month/year, attribution, and nearby non-affiliation wording.
- Preserved the Facts and sources section immediately after the visual and all existing factual, qualification, shortlist, and navigation controls.

## Task Commits

1. **Task 1: Deliver one selected reviewed media projection from published snapshot to factual detail** — `50a036f` (RED tests), `328ccf7` (implementation)
2. **Task 2: Make every unsafe media state fail closed before publication and presentation** — `d832d7f` (implementation and coverage)

## Verification

- PASS — focused catalogue publication, discovery, focus-detail, and provider-page suites: 47 tests.
- PASS — `corepack pnpm --filter @scholar-scout/web run typecheck`.
- PASS — `corepack pnpm --filter @scholar-scout/web run lint`.
- Jest emitted only the inherited multiple-lockfile workspace-root warning.

## Files Created/Modified

- `apps/web/lib/catalogue-publication.ts` — media candidate contracts, resolver, and strict public-record validation.
- `apps/web/lib/server/catalogue-publications.ts` — snapshot-time projection of only the selected safe media result.
- `apps/web/lib/catalogue-discovery.ts` — forwards the safe projection without raw candidate state.
- `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` — local preview/illustration presentation, disclosure dialog, and factual fallback.
- `apps/web/components/catalogue/CatalogueFocusView.tsx` — passes the safe item projection immediately before facts.
- `apps/web/__tests__/lib/catalogue-publication.test.ts`, `apps/web/__tests__/lib/catalogue-discovery.test.ts`, `apps/web/__tests__/components/CatalogueFocusView.test.tsx`, and `apps/web/__tests__/app/programmes/[id]/page.test.tsx` — resolver, DTO, detail, and page regressions.

## Decisions Made

- Valid external embeds are recognized as reviewed evidence but cannot render in this phase; resolution continues to an eligible Scholar Scout illustration.
- Only local `/media/` or `/images/` paths with explicit current rights evidence can become public visual presentation data.
- Rights disclosure remains in-page and close to the visual while factual provider sources remain the authoritative content.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type safety] Narrowed unknown persisted media fields before ISO-date validation.**
- **Found during:** Task 1 typecheck.
- **Issue:** TypeScript rejected direct ISO validation of untrusted persisted record fields.
- **Fix:** Added explicit string narrowing before validating reviewed dates.
- **Files modified:** `apps/web/lib/catalogue-publication.ts`
- **Verification:** typecheck and focused suites passed.
- **Committed in:** `328ccf7`

**2. [Rule 1 - Test correctness] Used accessible video labels rather than a non-standard ARIA video role.**
- **Found during:** Task 1 focused component test.
- **Issue:** Native video does not expose the queried role in the test environment.
- **Fix:** Asserted the labelled media element and its local source instead.
- **Files modified:** detail and provider-page tests.
- **Verification:** focused suites passed.
- **Committed in:** `328ccf7`

**Total deviations:** 2 auto-fixed Rule 1 corrections. No scope expansion.

## Issues Encountered

- The package script preserved a literal `--` before Jest flags in this Windows worktree, so the focused checks were run with the workspace-local Jest executable. The equivalent suites completed successfully.

## Known Stubs

None. The no-media presenter is the intentional factual fallback, not a stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 13 Plans 02 and 04 can consume the narrow `renderableMedia` projection while retaining its local-only and factual-fallback rules. Browser review remains needed for selected media clarity, responsive presentation, and the disclosure dialog in context.

## Self-Check: PASSED

- Confirmed all nine implementation/test files exist in the active worktree.
- Confirmed commits `50a036f`, `328ccf7`, and `d832d7f` exist in Git history.

---
*Phase: 13-provider-detail-transition-stories-and-media-safety*
*Completed: 2026-09-26*
