---
phase: 13-provider-detail-transition-stories-and-media-safety
verified: 2026-09-26T23:02:00Z
status: human_needed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Review local-preview behavior in a real browser"
    expected: "Only the visible card nearest the viewport center can loop muted media; it stops after scrolling away or moving center, the visible control pauses/plays it, and reduced motion prevents playback."
    why_human: "Jest exercises the observer and media branches with mocks, but real scrolling, browser autoplay policy, and operating-system motion preference need device confirmation."
  - test: "Review provider detail media states, source order, and actions"
    expected: "A local preview or labelled Scholar Scout illustration appears before Facts and sources; About this media opens and closes with a keyboard; invalid rights show the complete factual fallback; Compare and the official site actions are equally prominent, with the official site opening separately."
    why_human: "Visual hierarchy, disclosure clarity, and responsive layout are presentation judgments not provable by DOM assertions."
  - test: "Review the public Stories route at narrow width and with keyboard"
    expected: "The visible Skip action and all six factual destinations are reachable in order, non-affiliation wording is clear beside each context, and the page cannot be mistaken for provider testimony or a personal submission surface."
    why_human: "The route's semantic and content boundaries are covered in tests; clarity and mobile presentation require human review."
---

# Phase 13: Provider Detail, Transition Stories, and Media Safety Verification Report

**Phase Goal:** Pair factual source-first provider pages with inclusive, finite, accessible Scholar Scout transition stories while preserving strict media rights and content boundaries.

**Verified:** 2026-09-26T23:02:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Provider pages display attributable factual details and official sources, rendering only an approved local or labelled illustrative projection from the reviewed snapshot. | ✓ VERIFIED | `toPublishedRecord` resolves candidates before persisting `renderableMedia`; `mapPublicRecord` forwards that projection only; `CatalogueFocusView` passes it to `DiscoveryPreviewSlot` immediately before Facts and sources. The projection type permits only local paths and non-embed rights bases. |
| 2 | Unknown, expired, revoked, stale, remote-only, or unsupported media becomes a factual text-and-source fallback. | ✓ VERIFIED | `resolveRenderableMedia` rejects invalid candidates, future/stale reviews, expiration, status failures, and non-local paths. The Phase 13 suite covers the adverse cases; the full suite covers the release preview audit fallback. |
| 3 | Approved embeds never produce a learner-facing embed instruction or renderer; an eligible illustration may follow a non-renderable embed. | ✓ VERIFIED | The only `embedUrl` field stays in the staff candidate model. The resolver never calls `toRenderableMedia` for an embed and `DiscoveryPreviewSlot` has no iframe or remote-media branch. Unit coverage proves embed-to-illustration continuation. |
| 4 | Visual exploration is optional and does not alter the six-area factual catalogue, filters, ordering, or identity boundaries. | ✓ VERIFIED | `CatalogueDiscoveryOverview` retains its filter form, coverage matrix, factual cards, and reset action, while the fixed `/stories` link carries no state. Focused overview tests cover a non-default metro and retained ordinary controls. |
| 5 | The narrow media-motion exception is bounded to the nearest visible local-preview card, has a pause/play control, stops on reduced motion or viewport/center loss, and has no timer/feed behavior. | ✓ VERIFIED | The overview owns `IntersectionObserver` arbitration and passes one `shouldPlay` flag; `DiscoveryPreviewSlot` pauses on false/reduced motion and catches rejected playback. Focused component tests exercise center transfer, manual pause, and reduced-motion branches. |
| 6 | Provider detail keeps factual sources authoritative, discloses media provenance in-page, and gives equal access to comparison and the official provider action. | ✓ VERIFIED | The preview disclosure includes source, permission basis, reviewed month/year, optional attribution, and non-affiliation language. `CatalogueFocusView` renders Facts and sources below it, matched action styling, and a `_blank`/`noreferrer` official link. |
| 7 | Scholar Scout transition stories are finite, inclusive, public, skippable, and connect only to controlled factual catalogue destinations. | ✓ VERIFIED | `TRANSITION_STORIES` is a fixed six-record local array whose URLs are built with `buildCatalogueDiscoveryHref`; `/stories` reads only that local array and exposes the fixed Skip link. |
| 8 | Stories contain no provider/personal testimony, attendance, placement, endorsement, outcome claim, upload, sign-in, persistence, or playback requirement. | ✓ VERIFIED | The text-first `TransitionStoryList` uses native links and articles only, repeats non-affiliation language, and has no API/store/account imports. Story tests assert controlled links and absence of forms, inputs, media, iframe, and testimonial/submission copy. |

**Score:** 8/8 truths verified (0 present but behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/lib/catalogue-publication.ts` | Safe candidate validation and deterministic resolver | ✓ VERIFIED | Validates bounded rights evidence, local paths, ISO review dates, freshness, expiry, and candidate precedence. |
| `apps/web/lib/server/catalogue-publications.ts` | Snapshot-time public projection | ✓ VERIFIED | `toPublishedRecord` resolves candidates once and writes only `renderableMedia` plus fallback state. |
| `apps/web/lib/catalogue-discovery.ts` | Learner DTO boundary | ✓ VERIFIED | Maps public records to discovery items without raw media candidates or embed URLs. |
| `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` | Local-only accessible media/fallback presenter | ✓ VERIFIED | Renders only native local video or local `next/image`; contains disclosure dialog and complete no-media fallback. |
| `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` | Optional explorer and bounded playback arbitration | ✓ VERIFIED | Owns motion preference, visibility selection, and fixed `/stories` companion navigation. |
| `apps/web/components/catalogue/CatalogueFocusView.tsx` | Source-first provider-detail wiring | ✓ VERIFIED | Wires only `item.renderableMedia` before the factual region and retains official/compare actions. |
| `apps/web/lib/transition-stories.ts` | Finite controlled editorial records | ✓ VERIFIED | Six stable local records, each with a controlled approved-region catalogue destination. |
| `apps/web/components/stories/TransitionStoryList.tsx` and `apps/web/app/stories/page.tsx` | Public, keyboard-first story-to-facts route | ✓ VERIFIED | Fixed server route renders semantic local context with visible skip and non-affiliation disclosure. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Candidate media evidence | Published snapshot | `resolveRenderableMedia` in `toPublishedRecord` | ✓ WIRED | Raw candidate data does not cross the snapshot projection boundary. |
| Published record | Detail/overview media | `renderableMedia` → discovery DTO → component props | ✓ WIRED | The lookup preserves only the selected safe projection. |
| Overview visibility | Local video playback | observer-selected ID → `shouldPlay` → video effect | ✓ WIRED | One overview controller gates all preview slots; slots pause when permission is removed. |
| Discovery companion action | Public Stories route | fixed internal `/stories` link | ✓ WIRED | The link preserves existing factual controls and carries no query/profile data. |
| Story records | Reviewed factual browsing | controlled `buildCatalogueDiscoveryHref` URLs | ✓ WIRED | Skip and per-story links point to approved catalogue queries. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Provider detail | `item.renderableMedia` | Reviewed candidate → resolver → published snapshot → discovery model | Candidate-derived and fail-closed | ✓ FLOWING |
| Media disclosure | `sourceLabel`, `sourceUrl`, `rightsBasis`, `reviewedAt`, attribution | Selected immutable projection | Narrow factual rights metadata only | ✓ FLOWING |
| Story route | `TRANSITION_STORIES` | Fixed local editorial collection | Six deterministic controlled destination records | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 13 resolver, DTO, provider/detail, visual explorer, playback, stories, and page integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath` on 9 Phase 13 paths | 9 suites, 80 tests passed | ✓ PASS |
| Whole web workspace | `corepack pnpm --filter @scholar-scout/web test --runInBand` | 95 suites, 666 tests passed | ✓ PASS |
| Type safety | `corepack pnpm --filter @scholar-scout/web run typecheck` | Exit 0 | ✓ PASS |
| Lint | `corepack pnpm --filter @scholar-scout/web run lint` | Exit 0 | ✓ PASS |

Jest still reports the pre-existing multiple-lockfile workspace-root warning, but all 95 suites completed successfully.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| MEDIA-01 | 13-01, 13-02, 13-04 | ✓ SATISFIED | Safe snapshot media projection, source-led provider detail, provenance disclosure, optional local visual cards, bounded media control, and passing focused/full suites. |
| MEDIA-02 | 13-01, 13-02, 13-04 | ✓ SATISFIED | Invalid/missing/stale/revoked/expired/unsupported cases resolve to factual fallback; no embed renderer or remote-only presentation path exists. |
| MEDIA-03 | 13-03, 13-04 | ✓ SATISFIED | Public fixed six-story route is finite, text-first, source-bound, non-affiliating, and reduced-motion safe with no submission or persistence surface. |

No orphaned Phase 13 requirements were found in `REQUIREMENTS.md`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `CatalogueDiscoveryOverview.tsx` | visual-card empty guard | `return null` | ℹ️ Info | Intentional: a visual-card component returns nothing when the parent has no safe selected projection; factual cards remain rendered. |
| Phase 13 source files | — | `TBD`/`FIXME`/`XXX` | ✓ None | No unresolved debt markers found in modified product files. |
| Learner presentation files | — | iframe/embed renderer or remote media URL | ✓ None | No learner-facing external renderer or remote media branch found. |

### Human Verification Required

### 1. Local-preview playback and control

**Test:** In a safe local fixture with at least two reviewed local previews, scroll the discovery page through both cards. Use the visible pause/play button, then enable the operating system/browser reduced-motion preference and repeat.

**Expected:** Only the nearest visible center card can loop muted media; it pauses when it leaves that position or the user pauses it; reduced motion prevents playback entirely.

**Why human:** Mocked observer/media tests cannot confirm real scrolling, autoplay policy, or device preference behavior.

### 2. Detail media and factual fallback

**Test:** Review a safe local preview, a labelled Scholar Scout illustration selected after an approved-but-unrenderable embed, and a record with invalid rights.

**Expected:** Each visual is followed immediately by Facts and sources; About this media is keyboard-operable and clear; the invalid record shows only complete factual fallback; Compare and official actions remain equally prominent and the official link opens separately.

**Why human:** Visual hierarchy, wording clarity, and responsive presentation are human UX judgments.

### 3. Stories route

**Test:** Open `/stories` in a narrow viewport and navigate with Tab/Enter.

**Expected:** The Skip action and all six factual destinations are reachable in order; the non-affiliation statement remains understandable beside each context; no element appears to solicit a personal story or imply provider testimony.

**Why human:** The DOM and content boundary are tested, but the rendered presentation and interpretation need reviewer confirmation.

---

_Verified: 2026-09-26T23:02:00Z_
_Verifier: gsd-verifier_
