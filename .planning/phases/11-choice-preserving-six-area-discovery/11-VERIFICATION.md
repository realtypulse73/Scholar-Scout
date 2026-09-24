---
phase: 11-choice-preserving-six-area-discovery
verified: 2026-09-24T01:03:42Z
status: gaps_found
score: 4/6 must-haves verified
behavior_unverified: 1
overrides_applied: 0
gaps:
  - truth: "Every detailed opportunity surface presents the complete governed discovery contract, including factual reasons and a working detail action for a saved record."
    status: failed
    reason: "The public discovery DTO has no reasons-to-consider field and no discovery surface renders one. In addition, comparison cards construct detail links without the item's metro, so a saved record outside Greater Houston resolves against the default Houston model and reaches notFound."
    artifacts:
      - path: apps/web/lib/catalogue-discovery.ts
        issue: "CatalogueDiscoveryItem drops all reason-to-consider content; no safe derived or published reason is exposed."
      - path: apps/web/components/catalogue/CatalogueComparison.tsx
        issue: "detailHref is /programmes/<id> without the selected item's metro; the detail route defaults to Greater Houston."
    missing:
      - "Add a bounded factual reasons-to-consider representation (or an approved equivalent) through the published record and discovery DTO, then render it source-first on cards, focus, and comparison."
      - "Build comparison detail links with the item's controlled metro (and add a non-Houston regression proving the detail route resolves the saved record)."
behavior_unverified_items:
  - truth: "Discovery, focused detail, and comparison have no document-level horizontal overflow and remain screen-reader usable at 320px/400% zoom, 375px, and 768px."
    test: "Use the Phase 11 acceptance procedure in 11-VALIDATION.md at each viewport with keyboard-only operation, a screen reader, and prefers-reduced-motion enabled."
    expected: "Focus, announcements, factual status, preview disclosure, save/compare/remove, and official links remain understandable; primary document content never requires horizontal scrolling."
    why_human: "Jest verifies semantic names and responsive class contracts, but cannot measure rendered overflow, focus visibility, or assistive-technology announcements in a browser."
---

# Phase 11: Choice-Preserving Six-Area Discovery Verification Report

**Phase Goal:** Let any student browse, filter, save, compare, and verify the governed six-area catalogue through accessible, source-first discovery surfaces.

**Verified:** 2026-09-24T01:03:42Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Visitors can browse the stored reviewed snapshot, select a metro, filter, save, compare, and open a stored official verification action without signing in. | ✓ VERIFIED | `/programmes` reads only `getPublishedCatalogueSnapshot()` and passes its records into the controlled model; cards and comparison expose browser-local save/remove and stored official links. The focused Phase 11 matrix passed 15 tests. |
| 2 | Every covered metro keeps all six pathway classes visible with honest coverage, including no-reviewed-record states. | ✓ VERIFIED | `CatalogueDiscoveryOverview` maps the fixed six coverage cells for the selected region regardless of result count. `catalogue-discovery.test.ts` verifies six cells and truthful empty states. |
| 3 | Ordering and filters are reversible, controlled, and do not use residence, profile, score, or passive signals. | ✓ VERIFIED | `parseCatalogueDiscoveryFilters()` accepts only metro/pathway/delivery/status/q/page; the model stable-sorts public IDs and route scans show no profile/session/score import in public discovery paths. |
| 4 | Cards, comparison, and detail surfaces expose the complete governed provider/pathway/place/status/reasons/facts/evidence/alternate/action contract. | ✗ FAILED | `CatalogueDiscoveryItem` has no reasons field and none of the discovery components render one. Comparison’s `Details and sources` href omits its item’s metro, breaking records outside the default metro. |
| 5 | Learner discovery and metadata are snapshot-only with no legacy seed fallback, provider request, or early media rendering. | ✓ VERIFIED | Browse/detail/shortlist call `getPublishedCatalogueSnapshot()`; detail is dynamic and has no `generateStaticParams`; focused route tests reject legacy seed IDs. `DiscoveryPreviewSlot` takes no media URL and renders no player/embed/image. |
| 6 | Keyboard, screen-reader, narrow-layout, and reduced-motion behavior works at the supported viewports. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Native controls, textual status, focus classes, `min-w-0`/bounded layouts, and reduced-motion decoration rules exist and focused component tests pass, but browser/assistive-technology acceptance was not executed as part of this verification. |

**Score:** 4/6 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-discovery.ts` | Public snapshot mapper, strict filters, deterministic ordering, coverage model | ⚠️ PARTIAL | Substantive and wired to browse/detail/shortlist, but omits the required reasons-to-consider representation. |
| `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` | Public metro/filter overview and result explanation | ✓ VERIFIED | Uses native form controls, coverage state, factual cards, reset link, and source-first snapshot model. |
| `apps/web/components/catalogue/CatalogueOpportunityCard.tsx` | Source-first factual discovery card | ✓ VERIFIED | Provider/type/place/facts/status/source/official action/save/compare/alternate route are visible and keyboard-native. |
| `apps/web/components/catalogue/CatalogueFocusView.tsx` | Finite, snapshot-backed detail and navigation | ⚠️ PARTIAL | Evidence and finite navigation are substantive; it cannot render a reason because the shared DTO does not contain one. |
| `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` | Explicit non-media future boundary | ✓ VERIFIED | No props for media and no media element; plainly explains the rights/accessibility fallback. |
| `apps/web/components/catalogue/CatalogueComparison.tsx` | Public saved-choice comparison | ✗ PARTIAL | Resolves only supplied public items and retains unavailable IDs, but the displayed detail link is invalid for five of six metros and no reason/alternate representation exists. |
| `apps/web/app/programmes/[id]/page.tsx` | Current-snapshot detail/metadata seam | ✓ VERIFIED | Rebuilds the controlled model from the current snapshot and calls `notFound()` for absent IDs; no legacy seed fallback. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `/programmes` page | published snapshot → discovery model | `getPublishedCatalogueSnapshot()` then `buildCatalogueDiscoveryModel()` | ✓ WIRED | Reads a stored, reviewed snapshot only. |
| Detail page/metadata | published snapshot → controlled focused model | `getDiscoveryModel()` | ✓ WIRED | Shared dynamic path has no static legacy parameters. |
| Overview card | browser shortlist | `ShortlistButton` keyed by public ID | ✓ WIRED | Existing client save action remains unauthenticated. |
| Shortlist page | all regional snapshot models → comparison | region-scoped public models | ✓ WIRED | Each saved ID is resolved only against supplied public items. |
| Comparison card | detail page | hard-coded href | ✗ NOT_WIRED | Omits `?metro=<item.regionId>`; non-Houston IDs cannot resolve under the detail page’s default Houston filter. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `ProgrammesPage` | `model` | Phase 10 active public snapshot | Stored reviewed records only | ✓ FLOWING |
| `ProgrammeDetailPage` | `item`, previous/next | Rebuilt current snapshot model | Stored reviewed records only | ✓ FLOWING |
| `ShortlistPage` / `CatalogueComparison` | `items`, local saved IDs | Public snapshot models plus browser shortlist | Real public records; unmatched IDs remain unavailable | ⚠️ PARTIAL — detail context is dropped at the final link. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 11 discovery matrix | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` with six named Phase 11 suites | 5 suites, 15 tests passed | ✓ PASS |
| Type safety | `corepack pnpm --filter @scholar-scout/web run typecheck` | Passed | ✓ PASS |
| Lint | `corepack pnpm --filter @scholar-scout/web run lint` | Passed with zero warnings | ✓ PASS |
| Complete web suite | `corepack pnpm --filter @scholar-scout/web test --runInBand` | No final Jest result returned during this verification session; do not treat plan-summary narration as substitute evidence. | ? INCONCLUSIVE |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DISC-01 | 11-01, 11-03 | Public browse/filter/save/compare/official action | ✓ SATISFIED | Snapshot-only browse and comparison have unauthenticated local save and direct official actions. |
| DISC-02 | 11-02 | Detail surfaces expose complete source-first decision information | ✗ BLOCKED | No reasons-to-consider model/surface exists, and cross-metro comparison details link to a not-found route. |
| DISC-03 | 11-01 | Reversible filters/order without inference or suppression | ✓ SATISFIED | Controlled query parser, fixed coverage disclosure, public ID order, and reset behavior are tested. |
| DISC-04 | 11-04 | Keyboard/screen-reader/reflow access | ? NEEDS HUMAN | Structural test evidence is present, but supported browser/AT acceptance has not been independently performed. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/web/components/catalogue/CatalogueComparison.tsx` | 107 | Detail URL discards controlled metro | 🛑 Blocker | Five regional saved-choice detail links lead to ordinary not-found behavior. |
| `apps/web/lib/catalogue-discovery.ts` | 27–54 | DTO lacks required factual reasons representation | 🛑 Blocker | The requirement’s reasons-to-consider content cannot flow to any discovery surface. |

No `TBD`, `FIXME`, `XXX`, placeholder, or disconnected-media stub was found in the Phase 11 implementation files. The non-media preview is intentional and correctly bounded for Phase 13.

### Human Verification Required

1. **Responsive keyboard and assistive technology journey**

**Test:** Follow `11-VALIDATION.md` at 320 CSS pixels/400% zoom, 375px, and 768px using keyboard-only navigation, a screen reader, and reduced-motion mode.

**Expected:** All factual content and controls remain in reading order with visible focus and understandable announcements; primary document content does not horizontally scroll.

**Why human:** Component tests cannot prove actual browser layout overflow, visual focus, or screen-reader announcements.

### Gaps Summary

Phase 11 has a real, focused completeness gap rather than a broad architectural failure. The snapshot-only, source-first, reversible discovery foundation is present and its focused tests pass. However, two directly observable contract breaks prevent calling the phase complete:

1. The published/discovery contract never carries or displays the required factual “reasons to consider” information.
2. A saved comparison choice in any metro other than Greater Houston has a visible details action that routes without its metro context and therefore cannot resolve in the dynamic detail page.

Repair these two items, add explicit cross-metro/reasons regressions, re-run the final web suite to a captured result, then complete the browser accessibility acceptance before advancing the phase.

---

_Verified: 2026-09-24T01:03:42Z_  
_Verifier: the agent (gsd-verifier)_
