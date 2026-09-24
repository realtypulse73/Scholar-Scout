---
phase: 11-choice-preserving-six-area-discovery
verified: 2026-09-24T01:35:11Z
status: human_needed
score: 5/6 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/6
  gaps_closed:
    - "Every detailed opportunity surface presents factual reasons and a working detail action for saved records."
    - "Saved comparison records preserve their controlled metro when opening details."
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "Discovery, focused detail, and comparison have no document-level horizontal overflow and remain screen-reader usable at 320px/400% zoom, 375px, and 768px."
    test: "Follow the Phase 11 browser acceptance procedure in 11-VALIDATION.md using a reviewed fixture with a non-current fact and an unavailable saved ID."
    expected: "Keyboard focus, factual status, source/official-link context, preview disclosure, comparison removal, and reduced-motion reading order remain understandable; the document itself never scrolls horizontally."
    why_human: "Component tests prove semantic and responsive class contracts, but cannot measure final browser overflow, visible focus, or screen-reader announcements."
human_verification:
  - test: "Run the exact responsive keyboard, screen-reader, and reduced-motion acceptance procedure below at 320px/400% zoom, 375px, and 768px."
    expected: "All factual discovery actions remain usable with no document-level horizontal overflow; color or motion is never the only way to understand a material state."
    why_human: "These are browser and assistive-technology outcomes that source inspection and Jest cannot faithfully observe."
---

# Phase 11: Choice-Preserving Six-Area Discovery Verification Report

**Phase Goal:** Let any student browse, filter, save, compare, and verify the governed six-area catalogue through accessible, source-first discovery surfaces.

**Verified:** 2026-09-24T01:35:11Z
**Status:** human_needed
**Re-verification:** Yes — after Plan 11-05 gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Visitors can browse the stored reviewed snapshot, select a metro, filter, save, compare, and open a stored official verification action without signing in. | ✓ VERIFIED | `/programmes` reads `getPublishedCatalogueSnapshot()` and builds the public model; overview cards expose browser-local save, comparison, stored official actions, and source-first detail. The overview/comparison suites passed 27 focused tests. |
| 2 | Every covered metro keeps all six pathway classes visible with honest coverage, including no-reviewed-record states. | ✓ VERIFIED | `CatalogueDiscoveryOverview` maps the controlled coverage list for the selected region regardless of results. `catalogue-discovery.test.ts` covers the six choices and truthful empty states. |
| 3 | Ordering and filters are reversible, controlled, and do not use residence, profile, score, or passive signals. | ✓ VERIFIED | `parseCatalogueDiscoveryFilters()` accepts only metro/pathway/delivery/status/q/page. `buildCatalogueDiscoveryModel()` stable-sorts public IDs after explicit filters; its mapper receives only snapshot records and an injected clock. |
| 4 | Cards, comparison, and detail surfaces expose the complete governed provider/pathway/place/status/reasons/facts/evidence/alternate/action contract. | ✓ VERIFIED | Plan 11-05 adds at most three neutral reasons derived from reviewed skill/delivery/training-payer facts, preserves each fact's evidence, and renders them on card, detail, and comparison. The exact non-Houston detail path is regression-tested for all six metro IDs. |
| 5 | Learner discovery and metadata are snapshot-only with no legacy seed fallback, provider request, or early media rendering. | ✓ VERIFIED | Browse, detail, and shortlist obtain only `getPublishedCatalogueSnapshot()` data; the dynamic detail test rejects legacy IDs. `DiscoveryPreviewSlot` has no record/media props or media element and presents the factual rights-review fallback. |
| 6 | Keyboard, screen-reader, narrow-layout, and reduced-motion behavior works at the supported viewports. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Native controls, named landmarks, text states, focus classes, bounded/min-width layouts, and the `prefers-reduced-motion` rule are present and covered by component tests. Real viewport overflow, visible focus, and screen-reader announcement behavior still need browser acceptance. |

**Score:** 5/6 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-discovery.ts` | Public snapshot mapper, strict filters, coverage/order model, bounded reasons | ✓ VERIFIED | Exports the required model/filter helpers and derives only factual, evidence-preserving reasons from the reviewed public record. |
| `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` | Public metro/filter overview with governed cards | ✓ VERIFIED | Native controls, result status, all-pathway coverage, honest empty states, and source-first cards are composed from the public model. |
| `apps/web/components/catalogue/CatalogueOpportunityCard.tsx` | Scannable source-first factual card | ✓ VERIFIED | Shows practical facts, status, one direct evidence-backed reason, separate full-detail action, alternate route, save/compare, and official action. |
| `apps/web/components/catalogue/CatalogueFocusView.tsx` | Finite snapshot-only focused detail | ✓ VERIFIED | Renders all fact and reason evidence, explicit previous/next/back navigation, alternate route, official action, and intentional non-media preview. |
| `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` | Factual non-media boundary | ✓ VERIFIED | Explicitly renders a rights/accessibility fallback and no image, embed, map, or player. |
| `apps/web/components/catalogue/CatalogueComparison.tsx` | Public saved-choice comparison | ✓ VERIFIED | Resolves only supplied public records, retains unavailable IDs, renders fact/reason evidence, and builds detail URLs with each item’s controlled `regionId`. |
| `apps/web/app/programmes/[id]/page.tsx` | Current-snapshot focused route/metadata | ✓ VERIFIED | Rebuilds the model from the current snapshot, uses the supplied controlled metro, and calls `notFound()` when no matching reviewed record exists. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `/programmes` page | published snapshot → discovery model | `getPublishedCatalogueSnapshot()` → `buildCatalogueDiscoveryModel()` | ✓ WIRED | Page source directly performs both steps. |
| Detail page/metadata | published snapshot → controlled focused model | `getDiscoveryModel()` | ✓ WIRED | Dynamic route rebuilds the current snapshot model; no static/seed fallback exists. |
| Overview card | browser shortlist | `ShortlistButton` | ✓ WIRED | Card passes only the public record ID to the existing student-controlled save control. |
| Shortlist page | six regional public models → comparison | one model per `catalogueRegions` entry | ✓ WIRED | All six controlled metros are resolved from the current public snapshot before browser comparison. |
| Reasons DTO | card, focus, comparison | `reasonsToConsider` | ✓ WIRED | The mapper exposes preserved fact evidence; all three renderers consume it, with direct stored source actions. |
| Comparison card | dynamic detail page | `buildCatalogueDetailHref(item.id, { metro: item.regionId, ... })` | ✓ WIRED | Parameterized regression covers all six regions; the dynamic page resolves a Greater Buffalo record when `metro=greater-buffalo`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `ProgrammesPage` | `model` | Phase 10 active public snapshot | Reviewed stored records only | ✓ FLOWING |
| `ProgrammeDetailPage` | `item`, previous, next | Rebuilt current snapshot model | Reviewed stored records only | ✓ FLOWING |
| `ShortlistPage` / `CatalogueComparison` | public items, local saved IDs | Six snapshot-derived regional models plus browser shortlist | Public records resolve; unmatched IDs remain explicit unavailable choices | ✓ FLOWING |
| Reason components | `reasonsToConsider` | Reviewed material facts on the mapped public record | Finite factual values retain the original state/evidence; empty stays empty | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 11 focused discovery matrix | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` with five named suites | 5 suites, 27 tests passed | ✓ PASS |
| Full web regression suite | `corepack pnpm --filter @scholar-scout/web test --runInBand` | Completed successfully; the terminal emitted only the inherited multiple-lockfile warning rather than Jest’s final summary. | ✓ PASS |
| Type safety | `corepack pnpm --filter @scholar-scout/web run typecheck` | Passed | ✓ PASS |
| Lint | `corepack pnpm --filter @scholar-scout/web run lint` | Passed with zero warnings | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DISC-01 | 11-01, 11-03 | Browse, filter, save, compare, official action without sign-in | ✓ SATISFIED | Snapshot-only overview and comparison retain visitor-controlled local save and stored official links. |
| DISC-02 | 11-02, 11-05 | Complete source-first detailed opportunity information | ✓ SATISFIED | Provider/type/place/delivery/status/reasons/facts/source-date-state/alternate/action are wired on card, focus, and comparison; factual reasons and six-area details were independently rechecked. |
| DISC-03 | 11-01 | Reversible filters/order without inference or suppression | ✓ SATISFIED | Allowlisted parser, fixed all-pathway coverage, stable public ordering, and reset behavior are directly implemented and tested. |
| DISC-04 | 11-04 | Keyboard/screen-reader/reflow access | ? NEEDS HUMAN | Semantic/responsive/reduced-motion contracts are present and tested; required browser/assistive-technology acceptance remains. |

### Anti-Patterns Found

No blocking debt markers, placeholders, empty production implementations, provider-fetch code, legacy-seed fallback, or media renderer were found in Phase 11 production artifacts. The only `Not available` text is the intentional factual value fallback in comparison.

### Human Verification Required

Use a fixture or reviewed public snapshot with at least two records, one non-current fact, and one saved ID unavailable from the current snapshot. No provider-site access or editing is required.

1. At **320 CSS pixels with 400% zoom**, **375px**, and **768px**, open `/programmes`. Use only `Tab`, `Shift+Tab`, `Enter`, `Space`, and native selects to change metro/filters, reset, open details, save a choice, use its official action, and reach comparison.
2. Confirm every control has visible focus, statuses and empty messages are readable text, and `See all facts and sources` can be reached without a pointer.
3. On the detail route, tab through Back, Previous, Next, Save, comparison, alternate-route, and official-source actions. A record must change only when its named link is activated.
4. On comparison, confirm current and unavailable saved choices are separately labelled; factual evidence is readable; and removal changes only the selected saved ID.
5. Confirm overview, card, detail, preview disclosure, and comparison need **no document-level horizontal scrolling**. An explicitly labelled future desktop-only data region is the sole permitted internal-scroll exception.
6. With a screen reader, confirm landmark/headings, filter/result announcements, fact-status text, preview disclosure, unavailable-choice notice, and official links’ leaving-site context have understandable names. Material state must not rely on color alone.
7. Emulate `prefers-reduced-motion: reduce`; the same facts, controls, and non-media preview must remain in the same reading order while optional focus decoration is absent.

### Re-verification Summary

The two prior blockers are closed in the real implementation:

1. `CatalogueDiscoveryItem` now has a finite `reasonsToConsider` DTO derived solely from reviewed facts, preserving source/date/state/guidance through cards, details, and comparisons.
2. Comparison now calls `buildCatalogueDetailHref` with the saved record’s controlled metro. Tests cover all six metro IDs and a Greater Buffalo route resolution.

No code gap remains. Phase 11 now awaits the prescribed browser accessibility acceptance only.

---

_Verified: 2026-09-24T01:35:11Z_
_Verifier: the agent (gsd-verifier)_
