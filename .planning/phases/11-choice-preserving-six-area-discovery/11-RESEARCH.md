# Phase 11: Choice-Preserving Six-Area Discovery - Research

**Researched:** 2026-09-23
**Domain:** Governed catalogue discovery, accessible React presentation, and source-first comparison
**Confidence:** HIGH for repository integration; MEDIUM for framework/accessibility documentation

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Hybrid discovery experience
- **D-01:** Use a deliberate hybrid of Realtor-style exploration and a TikTok-like focused view. Students begin with a scannable card-and-filter overview, then open one opportunity into a focused, vertically paced detail/story view. Both views must present the same governed factual record, source, review date/state, and direct verification action.
- **D-02:** The overview prioritizes quick visual orientation, clear pathway type, provider, location/delivery, and the practical facts a student needs before acting. It must not turn verified facts into an admissions, job, salary, enlistment, funding, or outcome prediction.
- **D-03:** The focused view may use the established Scholar Scout bright red, white, and silver visual system and motion-safe polish, but nonessential motion remains optional, finite, controllable, and respects reduced-motion preferences. It is not an infinite or autoplay feed. — **Reversibility:** costly — changing this presentation contract later touches the shared discovery cards, detail route, and accessibility expectations.

### Student choice and transparent filtering
- **D-04:** Students can select or change a covered metro, browse every pathway type before signing in or sharing personal information, and apply reversible filters. A filter can narrow the current view but must never suppress an entire pathway class or imply that omitted results are unavailable.
- **D-05:** Ordering is deterministic and factual. It may use the student-selected metro and explicit filters, but not ZIP/residence inference, GPA, test scores, prestige, passive behavior, sensitive circumstances, or engagement/conversion signals. Explain the visible sort/filter state in plain language.
- **D-06:** Unknown, stale, conflicting, empty-coverage, and external-link states must look materially different from confirmed facts and provide the next safe verification action.

### Comparison and action
- **D-07:** Keep saving and comparison as student-controlled tools. The comparison surface presents source-backed facts side by side and retains every saved route; it does not label any option eligible, ineligible, safe, realistic, best, or guaranteed.
- **D-08:** Every opportunity offers a factual official-next-action link plus a visible source/date/status. Source-first evidence is not hidden behind a decorative interaction or a card flip.

### the agent's Discretion
- Select the exact responsive card/grid, filter controls, empty states, focused-detail pacing, and route composition while preserving the hybrid interaction, all-visible pathway classes, source-first verification, keyboard operation, screen-reader support, and no-horizontal-overflow contract.
- Reuse existing governed programme, shortlist, opportunity-card, and motion-safe visual primitives where compatible; introduce only small focused components/helpers when the reviewed snapshot model requires them.

### Deferred Ideas (OUT OF SCOPE)
- Phase 12 owns private qualification highlighting and explanation governance.
- Phase 13 owns provider media display and fuller Scholar Scout transition stories.
- Phase 14 owns sensitive support referrals and military information surfaces.
</user_constraints>

## Additional Locked Founder Direction

- Discovery is primarily structured, choice-by-choice Realtor-style browsing. The finite focused view is the engaging second step, not an infinite feed. [VERIFIED: orchestrator instruction]
- Every opportunity will ultimately need an engaging moving/video preview, but Phase 11 creates only a media-ready preview slot and finite controlled focus behavior. [VERIFIED: orchestrator instruction]
- Real campus, street-view, student-uploaded, or provider media—including rights evidence, attribution, consent, moderation, captions, and render policy—belongs to Phase 13. Phase 11 must not fetch, embed, copy, or simulate that media. [VERIFIED: orchestrator instruction]

## Project Constraints (from AGENTS.md)

- Retain Next.js 15, React 18, TypeScript, NextAuth, and Vercel; do not introduce platform churn. [VERIFIED: AGENTS.md]
- Keep persistence additive and incremental; preserve unrelated in-progress work and validate CI-quality commands. [VERIFIED: AGENTS.md]
- Keep public pages/components above the server-only persistence boundary; server-only reads stay under `apps/web/lib/server/`, while browser interactions use pages/components and internal routes. [VERIFIED: AGENTS.md]
- Follow strict TypeScript, named domain exports, PascalCase React component files, `@/` imports in the web app, two-space/single-quote style, visible focus treatment, and existing Jest/Testing Library patterns. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| DISC-01 | Browse, filter, save, compare, and open an official next action without sign-in/story completion. | Server-owned snapshot query model; browser-local shortlist IDs; explicit external action. |
| DISC-02 | Detail surfaces show provider, pathway, place/delivery, status, reasons, facts to verify, evidence, and alternates. | Public-record view model that preserves per-fact evidence; finite detail route. |
| DISC-03 | Reversible ordering/filters; no residence inference, passive behavior, or pathway suppression. | Strict query parser, reset link, fixed controlled ordering, and all-six pathway coverage strip. |
| DISC-04 | Keyboard/screen-reader-accessible and no horizontal page overflow. | Native form/link semantics, status labels, responsive card layouts, and 320px reflow regression tests. |
</phase_requirements>

## Summary

Phase 11 should replace the current legacy-programme discovery read path with a small, pure catalogue-discovery view-model layer over `getPublishedCatalogueSnapshot()`. That seam already returns cloned reviewed public records or an explicit empty state and makes no provider-network request. [VERIFIED: codebase grep — `apps/web/lib/server/programme-records.ts`, `apps/web/lib/server/catalogue-publications.ts`, Phase 10 verification]

The recommended experience is a two-step hybrid: an ordinary, scannable property-style overview with visible metro/pathway/filter state, then a deterministic detail route that focuses one record at a time. The detail route may have explicit Previous/Next controls through the same filtered collection, but it must never automatically advance, load indefinitely, or read from an outside provider. [VERIFIED: 11-CONTEXT.md] [VERIFIED: orchestrator instruction]

**Primary recommendation:** build a source-preserving `catalogue-discovery.ts` mapper and use it for the `/programmes` overview, `/programmes/[id]` focus view, and `/shortlist` comparison; reserve a non-media `DiscoveryPreviewSlot` contract for Phase 13 instead of rendering `CataloguePublishedRecord.media` now. [VERIFIED: codebase grep — existing route/component seams] [VERIFIED: orchestrator instruction]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Read reviewed catalogue snapshot | Frontend Server | Database / Storage | Only the server may import the server-only stored-snapshot seam. [VERIFIED: codebase grep] |
| Parse filters and create canonical query state | Frontend Server | Browser / Client | The request URL is inspectable/reversible; client controls submit ordinary query parameters. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Map public records to cards/detail/comparison DTOs | Shared domain module | Frontend Server | A pure mapper prevents cards, detail, and comparison from disagreeing about fact status/source output. [VERIFIED: codebase conventions] |
| Save a route for later comparison | Browser / Client | API / Backend | Existing local shortlist works unauthenticated; the signed-in account route is an optional synchronization path. [VERIFIED: codebase grep — `ShortlistButton.tsx`, `ShortlistComparison.tsx`] |
| Focus/detail navigation | Frontend Server | Browser / Client | Route links give URL-addressable, keyboard-native finite movement. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Future provider/student media policy | API / Backend | CDN / Static | Phase 13, not Phase 11, must decide rights, consent, moderation, captions, and presentation. [VERIFIED: orchestrator instruction]

## Standard Stack

### Core

| Library | Version | Purpose | Why standard |
|---|---:|---|---|
| `next` | 15.5.15 | App Router server pages and route-addressable browse/detail views | Already installed; App Router pages support async `searchParams` filtering. [VERIFIED: `apps/web/package.json`] [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| `react` / `react-dom` | 18 | Focused interactive shortlist buttons and optional compact filter enhancement | Already installed project foundation; do not add a second state/routing library. [VERIFIED: `apps/web/package.json`] |
| Tailwind CSS | 3.4.1 | Responsive cards, focus states, and reduced-motion-aware visual polish | Already configured and used by the public programme surfaces. [VERIFIED: `apps/web/package.json`, `apps/web/app/globals.css`] |
| Jest + Testing Library | 30.3.0 | Pure view-model, page/component, and keyboard/accessibility-contract regression coverage | Existing test foundation; Phase 11 needs no new package. [VERIFIED: `apps/web/package.json`, `.planning/codebase/TESTING.md`] |

**Installation:** none. [VERIFIED: project scope]

## Package Legitimacy Audit

No external package is recommended or installed in this phase. [VERIFIED: research recommendation]

## Architecture Patterns

### System Architecture Diagram

```text
Student opens /programmes?metro=&pathway=&delivery=&status=
             |
             v
App Router server page -- validates canonical query -> getPublishedCatalogueSnapshot()
             |                                         |
             |                                         +-- stored, versioned, reviewed records only
             v
catalogue-discovery.ts
  +-- fixed regional fixture + coverage matrix
  +-- per-record facts/evidence/source/status view model
  +-- deterministic filter/order + visible filter explanation
             |
      +------+------+----------------+
      v             v                v
Overview cards   /programmes/[id]   /shortlist comparison
native filters   finite focus view  saved IDs, source-backed rows
      |             |                |
      +-------------+----------------+
                    |
                    v
       explicit official source / verification action (new tab)

DiscoveryPreviewSlot (Phase 11 structural placeholder only)
                    |
                    v
 Phase 13 rights/attribution/consent/moderation/captions policy and real media
```

### Recommended Project Structure

```text
apps/web/
├── app/programmes/page.tsx                   # server snapshot browse page + validated URL state
├── app/programmes/[id]/page.tsx              # server finite focus/detail page
├── app/shortlist/page.tsx                    # injects snapshot-backed comparison records
├── components/catalogue/
│   ├── CatalogueFilters.tsx                   # native labelled controls and reset link
│   ├── CatalogueOpportunityCard.tsx           # factual first-view card; no legacy fit score
│   ├── CatalogueFactStatus.tsx                # shared current/needs-confirmation/unknown/conflicting rendering
│   ├── CatalogueFocusView.tsx                 # vertical factual detail, explicit previous/next links
│   ├── CatalogueComparison.tsx                # responsive comparison cards/table wrapper
│   └── DiscoveryPreviewSlot.tsx               # no provider media; phase-13 integration seam
├── lib/catalogue-discovery.ts                 # pure DTO/filter/order/detail-neighbor helpers
└── __tests__/
    ├── lib/catalogue-discovery.test.ts
    └── components/Catalogue*.test.tsx
```

### Pattern 1: Source-preserving public DTO

**What:** Map `CataloguePublishedRecord` to one browser-safe, immutable view model; include the fact value (or explicit unresolved value), its individual `FactEvidence`, regional boundary/coverage context, source action, and `mediaFallback` flag. [VERIFIED: codebase grep — `CataloguePublishedRecord`, `CatalogueOpportunityCardFacts`, `FactEvidence`]

**When to use:** Every overview card, focus detail, related/alternate route, and comparison cell. Do not map one record differently per surface. [VERIFIED: 11-CONTEXT.md]

```typescript
// Source: repository pattern informed by apps/web/lib/catalogue-contract.ts
export function createCatalogueDiscoveryItem(
  record: CataloguePublishedRecord,
  coverage: CatalogueCoverage,
): CatalogueDiscoveryItem {
  return {
    id: record.id,
    title: record.title,
    region: record.region,
    pathway: record.facts.pathway,
    facts: record.facts,
    overallStatus: getOpportunityCardVerificationStatus(record.facts, new Date()),
    coverage,
    source: record.source,
    officialAction: record.source.sourceUrl,
    mediaState: 'reserved-for-rights-review',
  };
}
```

The implementation should accept an injected `now` for tests rather than construct a clock internally; the example shows the shape, not final clock ownership. [VERIFIED: repository testing convention]

### Pattern 2: Canonical, reversible URL state

**What:** Parse only allowlisted `metro`, `pathway`, `delivery`, `status`, `q`, and `page` parameters; ignore malformed/unknown values; create a reset link to `/programmes`; disclose the active filters and deterministic sort in a live non-assertive result summary. [VERIFIED: 11-CONTEXT.md] [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page]

**When to use:** Overview entry, focused-view Previous/Next links, alternate route links, and return-to-results navigation. [VERIFIED: 11-CONTEXT.md]

```typescript
export function orderCatalogueItems(items: CatalogueDiscoveryItem[]) {
  return [...items].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

export function filterCatalogueItems(
  items: CatalogueDiscoveryItem[],
  filters: CatalogueDiscoveryFilters,
) {
  return orderCatalogueItems(items).filter((item) => (
    (!filters.metro || item.region.id === filters.metro)
    && (!filters.pathway || item.pathway.value === filters.pathway)
    && (!filters.delivery || item.facts.delivery.value === filters.delivery)
    && (!filters.status || item.overallStatus === filters.status)
  ));
}
```

Do not reuse `rankOpportunityMatches`, `filterProgrammes`, `matchScore`, profile loading, or the legacy `Programme` type for the Phase 11 catalogue path: those are profile/legacy programme concepts and can create prohibited personalization or hide the snapshot's per-fact evidence. [VERIFIED: codebase grep — `ProgrammeResults.tsx`, `opportunity-matching.ts`, `programmes.ts`] [VERIFIED: 11-CONTEXT.md]

### Pattern 3: All-pathways-visible filter affordance

**What:** Render all six controlled `CATALOGUE_PATHWAYS` for the selected metro even when a pathway has zero published records; pair each item with the Phase 9 coverage state. Selecting a chip/select option narrows results, but the control itself stays visible and says whether zero records means `Not yet verified`, no results under current filters, or no record in the active reviewed snapshot. [VERIFIED: codebase grep — `catalogue-contract.ts`, `catalogue-fixtures.ts`] [VERIFIED: 11-CONTEXT.md]

**When to use:** Above results and in an empty-state explanation. [VERIFIED: 11-CONTEXT.md]

### Pattern 4: Finite focus view and media-ready slot

**What:** The detail route shows a single factual opportunity in a vertical sequence with explicit `Previous opportunity`, `Next opportunity`, and `Back to results` links derived from the canonical filtered ordering. `DiscoveryPreviewSlot` must show a clearly labelled neutral/owned interface treatment only; its initial contract cannot render `record.media`, a `<video>`, an iframe, a map, a provider URL, or learner-uploaded content. [VERIFIED: orchestrator instruction]

**When to use:** The focus/detail route only. Motion, if used, must be decorative, one-shot/paused by default, controllable, and disabled by `prefers-reduced-motion`; it must not hide the factual content or advance the record. [VERIFIED: 11-CONTEXT.md] [VERIFIED: `apps/web/app/globals.css`]

**Phase 13 seam:** evolve the slot from `reserved-for-rights-review` only after a Phase 13 DTO can prove approved source/rights, attribution, consent/moderation where applicable, captions/transcript, expiry/revocation fallback, and an accessible static/factual fallback. [VERIFIED: orchestrator instruction]

### Pattern 5: Responsive comparison without recommendations

**What:** Retain existing saved IDs, resolve them against the current snapshot, and render source-backed cards/definition lists on phones. A desktop table is permitted only inside its own labelled `overflow-x-auto` region, with a stacked card equivalent available at small widths; the page itself must not acquire horizontal overflow. [CITED: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html] [VERIFIED: 11-CONTEXT.md]

**When to use:** `/shortlist` and any compare action. The comparison must state missing/retired IDs instead of dropping them silently and must not show fit scores, eligibility, success likelihood, recommendations, or an auto-selected winner. [VERIFIED: 11-CONTEXT.md] [VERIFIED: docs/product-recommendation-governance.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Catalogue data acquisition | Learner-time provider crawler, map scraper, or provider API client | `getPublishedCatalogueSnapshot()` | Phase 10 already supplies a reviewed, cloned stored snapshot with no provider request. [VERIFIED: Phase 10 verification] |
| URL state/routing | Custom browser history state machine | App Router page `searchParams` plus `Link` | The project already uses server query parsing and Next documents it for filtering/pagination/sorting. [VERIFIED: `app/programmes/page.tsx`] [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Form/filter controls | Custom ARIA combobox/grid/carousel | Native `<form>`, `<select>`, `<input>`, `<button>`, and links | Native controls preserve expected keyboard/screen-reader behavior without bespoke key handling. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/] |
| Media experience | A new video/map/embed uploader or unvetted third-party player | `DiscoveryPreviewSlot` placeholder | Rights, consent, moderation, captions, and media fallback are intentionally Phase 13 work. [VERIFIED: orchestrator instruction] |
| Comparison ranking | A score, “best” badge, or inferred winner | Student-controlled save/remove and factual rows | Governance prohibits deterministic claims of personal success or suppression. [VERIFIED: docs/product-recommendation-governance.md] |

## Common Pitfalls

### Pitfall 1: Accidentally keeping legacy profile ranking

**What goes wrong:** The existing `/programmes` route loads a session/onboarding profile and calls `rankOpportunityMatches`; it uses stated preferences and legacy score fields. [VERIFIED: codebase grep — `app/programmes/page.tsx`, `ProgrammeResults.tsx`, `opportunity-matching.ts`]

**How to avoid:** Give Phase 11 a distinct snapshot DTO and sort only by explicit filters plus stable `id` ordering. Do not import onboarding/profile/matching modules into the discovery mapper. [VERIFIED: 11-CONTEXT.md]

**Warning sign:** Changing a local profile, click, or account state changes the no-filter result order. [VERIFIED: 11-CONTEXT.md]

### Pitfall 2: Treating zero cards as a coverage claim

**What goes wrong:** Empty results can mean a selected filter eliminated records, a metro/pathway is `not-yet-verified`, or the active snapshot contains no record; showing only “No results” implies more certainty than the catalogue owns. [VERIFIED: codebase grep — `catalogue-fixtures.ts`, `catalogue-contract.ts`]

**How to avoid:** Render coverage state and a reset/widen-filters action separately from snapshot count. [VERIFIED: 11-CONTEXT.md]

### Pitfall 3: Collapsing fact evidence into one green status

**What goes wrong:** A record can contain independent current, stale, unknown, or conflicting facts; a single decorative source label hides which value needs confirmation. [VERIFIED: codebase grep — `CatalogueOpportunityCardFacts`, `FactEvidence`]

**How to avoid:** Put value, status, source/date, and verification action together for every material fact on details/comparison; the overview presents a conservative aggregate plus a direct route to each fact. [VERIFIED: 11-CONTEXT.md]

### Pitfall 4: A TikTok-like interaction becoming an infinite autoplay feed

**What goes wrong:** Auto-advance, autoplay, or scroll-triggered loading obscures source status and breaks the finite controllable presentation decision. [VERIFIED: 11-CONTEXT.md]

**How to avoid:** Use route links and a bounded snapshot array. No observers that fetch/load records, no timer-based navigation, and no media playback in Phase 11. [VERIFIED: 11-CONTEXT.md] [VERIFIED: orchestrator instruction]

### Pitfall 5: Reintroducing horizontal page overflow through comparison or preview

**What goes wrong:** The existing shortlist table has `min-w-[860px]`; without a small-screen alternative, the student must pan to read primary content. [VERIFIED: codebase grep — `ShortlistComparison.tsx`]

**How to avoid:** Stack comparison items on phones/tablets, constrain preview slot width with `max-w-full`, and allow two-dimensional scrolling only inside a labelled data-table region if it remains necessary on large screens. [CITED: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html]

## Code Examples

### Public snapshot page seam

```typescript
// Source: repository pattern in apps/web/lib/server/programme-records.ts
const snapshot = await getPublishedCatalogueSnapshot();
const records = snapshot.status === 'published' ? snapshot.records : [];
const model = buildCatalogueDiscoveryModel({
  records,
  regions: catalogueRegions,
  coverage: catalogueCoverage,
  filters: parseCatalogueDiscoveryFilters(await searchParams),
  now,
});
```

### Accessible status and official verification action

```tsx
<section aria-labelledby={`${item.id}-evidence`}>
  <h2 id={`${item.id}-evidence`}>Source and verification</h2>
  <p>{formatFactStatus(item.overallStatus)}</p>
  <p>{item.source.sourceLabel} · checked {item.source.checkedAt}</p>
  <Link href={item.officialAction} target="_blank" rel="noreferrer">
    Open official source to verify
  </Link>
</section>
```

The link label must stay explicit; a generic image/card click is not an adequate source-first action. [VERIFIED: 11-CONTEXT.md]

## State of the Art

| Old approach | Current Phase 11 approach | Impact |
|---|---|---|
| Legacy `Programme` seed/managed records plus profile-fit ordering | Stored `CataloguePublishedRecord` snapshot plus fixed regional/coverage fixtures and neutral stable ordering | Avoids learner-time provider access and choice-suppressing profile-driven presentation. [VERIFIED: codebase grep] |
| Match cards summarize one tuition evidence field | Catalogue facts retain separate evidence/status/action for location, pathway, skill, payer, cost, duration, and delivery | Lets uncertainty remain specific and actionable. [VERIFIED: `catalogue-contract.ts`] |
| Generic detailed programme page and legacy related-record scoring | Finite, canonical snapshot detail navigation with source-first fact sections | Keeps focus engaging without changing the reviewed record or inventing personal outcomes. [VERIFIED: 11-CONTEXT.md] |
| Static/unknown provider media could drift into UI | Deliberate no-media preview slot until Phase 13 approval | Prevents unlicensed, uncaptained, unmoderated, or live media from entering discovery. [VERIFIED: orchestrator instruction] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | A stable public `id` ordering is an acceptable neutral default display order until a separately governed explicit sort is designed. | Pattern 2 | Product may prefer title order; change the comparator centrally without adding a profile signal. [ASSUMED] |
| A2 | Phase 11 can evolve `/programmes` and `/shortlist` rather than create a parallel public route namespace. | Project structure | A planner should confirm through current-route tests before making route replacement irreversible. [ASSUMED] |

## Open Questions

1. **Should source facts on the overview be limited to the top two practical facts or list all seven?**
   - What we know: the full per-fact evidence belongs on every detailed surface; the card must remain scannable. [VERIFIED: requirements DISC-02, 11-CONTEXT.md]
   - Recommendation: show pathway/location/delivery plus cost-or-tuition/status in the overview, with a visible “See all facts and sources” link; do not omit status/source action. [VERIFIED: 11-CONTEXT.md]
2. **What content will fill the later preview slot?**
   - What we know: the founder wants engaging moving/video previews for every opportunity. [VERIFIED: orchestrator instruction]
   - Recommendation: defer all media selection and rendering to Phase 13, where rights, attribution, consent, moderation, captions/transcript, expiry, and fallback can be validated. [VERIFIED: orchestrator instruction]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | Next/Jest/typecheck commands | ✓ | v24.19.0 | — |
| Corepack pnpm | workspace scripts | ✓ | 10.34.5 | — |
| Existing Jest binary | Phase tests | ✓ | project script resolves it; direct `pnpm exec jest` is not available in this shell | Run the documented workspace `test` script. [VERIFIED: environment probe] |
| Provider API/media service | Discovery phase | Not required | — | Stored reviewed snapshot plus non-media slot. [VERIFIED: phase scope] |

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 + Testing Library [VERIFIED: `apps/web/package.json`] |
| Config file | `apps/web/jest.config.ts` [VERIFIED: `.planning/codebase/TESTING.md`] |
| Quick run command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` [VERIFIED: `apps/web/package.json`] |
| Full suite command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` [VERIFIED: project test convention] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| DISC-01 | Public snapshot browse/filter/save/compare/official action without auth | unit + component | focused catalogue/shortlist Jest suites | ❌ Wave 0 |
| DISC-02 | Per-fact source/status/date/action + alternate route in card/detail/comparison | unit + component | focused catalogue Jest suites | ❌ Wave 0 |
| DISC-03 | Stable filter/order/reset; all six classes visible; no profile/passive signals | unit | `catalogue-discovery.test.ts` | ❌ Wave 0 |
| DISC-04 | Native keyboard controls, named landmarks/statuses, no page overflow at 375/768 and 320 CSS px | component + manual responsive check | Jest plus browser/devtools human check | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/catalogue-discovery.test.ts` — public DTO fidelity, malformed query rejection, stable ordering, filter reversibility, all-six pathway/coverage, empty states, and no profile fields in inputs.
- [ ] `apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx` — fact status/source/date/verification action, save/compare, and no prediction/application language.
- [ ] `apps/web/__tests__/components/CatalogueFocusView.test.tsx` — explicit finite next/previous/back behavior, media slot non-rendering, and reduced-motion-safe affordance.
- [ ] `apps/web/__tests__/components/CatalogueComparison.test.tsx` — retained/missing saved IDs, factual source rows, no winner/fit score, and small-width card layout class contracts.
- [ ] Manual browser check at 375px, 768px, and 320 CSS px/400% zoom; use keyboard-only navigation and reduced-motion emulation to validate focus visibility, no page-level horizontal overflow, and static preview behavior. [CITED: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No for public discovery | No sign-in gate; authenticated shortlist synchronization remains existing bounded behavior. [VERIFIED: phase scope] |
| V3 Session Management | Yes, secondary | Do not make session/profile state a discovery ordering input. [VERIFIED: 11-CONTEXT.md] |
| V4 Access Control | Yes | Browser reads only public snapshot DTOs; no candidate, audit, staff, or source-edit data crosses the learner boundary. [VERIFIED: Phase 10 verification] |
| V5 Input Validation | Yes | Allowlist query parameters and route IDs; malformed values fall back safely. [VERIFIED: project conventions] |
| V6 Cryptography | No new cryptography | Reuse existing snapshot integrity; add no client-side secret or signature logic. [VERIFIED: Phase 10 verification] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Untrusted query parameters change view semantics | Tampering | Parse strict allowlists; never convert URL state into profile, eligibility, or provider request parameters. [VERIFIED: 11-CONTEXT.md] |
| Learner UI exposes private candidate/audit data | Information disclosure | Call only `getPublishedCatalogueSnapshot()` and map only `CataloguePublishedRecord`. [VERIFIED: Phase 10 verification] |
| Unsafe external source link | Tampering / phishing | Render only contract-validated stored `http(s)` URLs with clear source label and `rel="noreferrer"`; do not construct URLs from query input. [VERIFIED: `catalogue-contract.ts`, existing `OpportunityMatchCard.tsx`] |
| Unapproved media enters preview | Information disclosure / rights harm | Render no record media in Phase 11; keep preview slot structural until Phase 13 policy. [VERIFIED: orchestrator instruction] |

## Sources

### Primary (HIGH confidence)
- Repository source: `apps/web/lib/server/programme-records.ts`, `apps/web/lib/server/catalogue-publications.ts`, `apps/web/lib/catalogue-publication.ts`, `apps/web/lib/catalogue-contract.ts`, and `apps/web/lib/catalogue-fixtures.ts` — stored-snapshot/public-record/evidence/coverage contracts.
- [Phase 10 verification](../10-curated-import-and-governed-staff-publication/10-VERIFICATION.md) — confirmed snapshot cloning, no provider request, and fail-closed recovery.
- [Phase 11 context](11-CONTEXT.md), [.planning/REQUIREMENTS.md](../../REQUIREMENTS.md), and [recommendation governance](../../../docs/product-recommendation-governance.md) — locked scope and choice-preservation safeguards.

### Secondary (MEDIUM confidence)
- [Next.js page API reference](https://nextjs.org/docs/app/api-reference/file-conventions/page) — App Router async `searchParams` and URL filtering/pagination/sorting usage.
- [W3C WCAG 2.2 Reflow understanding](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — 320 CSS pixel reflow and bounded exceptions for tables/video.
- [WAI-ARIA Authoring Practices patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) — native/standard semantic control guidance.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; versions and current project patterns were read locally.
- Architecture: HIGH — Phase 10 verification confirms the exact stored-snapshot seam and public record shape.
- Accessibility/presentation pitfalls: MEDIUM — grounded in official W3C guidance plus existing responsive defect history.

**Research date:** 2026-09-23
**Valid until:** 2026-10-23 for implementation patterns; recheck before adding any media integration.
