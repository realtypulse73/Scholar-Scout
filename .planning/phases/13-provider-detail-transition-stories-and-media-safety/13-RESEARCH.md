# Phase 13: Provider Detail, Transition Stories, and Media Safety - Research

**Researched:** 2026-09-25
**Domain:** Governed public catalogue presentation, media-rights validation, accessible finite storytelling
**Confidence:** HIGH for the existing catalogue boundaries; MEDIUM for external accessibility and copyright guidance

## Summary

Phase 13 should extend—not replace—the published-snapshot detail route introduced by Phase 11. `/programmes/[id]` already renders only the reviewed public snapshot, carries every fact's evidence and official verification action, has finite previous/next navigation, and deliberately contains a media-empty `DiscoveryPreviewSlot`. Keep this route as the factual provider/opportunity surface; replace the placeholder only with a server-derived media presentation that has passed a stricter rights gate. [VERIFIED: codebase grep]

The public publication path has a useful starting point: it records `media`, `mediaRights`, and a `mediaFallback` checklist result. It is insufficient for Phase 13 because published records retain the asset but not the rights evidence, and `isUsableMedia` currently permits an omitted rights status. Require a concrete `valid` status, dated rights review/evidence, non-expired rights, meaningful alternative text, and an allowed local presentation asset before a provider detail page can render it. Every other state must render the complete existing factual detail and source fallback. [VERIFIED: codebase grep]

Transition stories must be an explicitly bounded Scholar Scout editorial layer, not a provider feed and not evidence about a provider. Implement a small, text-first, finite set of generic transition contexts with a visible `Skip to factual opportunities` action and explicit links to controlled factual record URLs. Do not use the current people-based transition PNG in stories until its ownership/licence record is stored and reviewed; no asset-rights manifest was found for it in the current source/docs search. [VERIFIED: codebase grep]

**Primary recommendation:** Tighten the existing publication-time rights gate, expose only a safe local media presentation DTO to factual detail pages, and add a finite text-first story route that links to governed records with an explicit non-affiliation disclosure; add no dependency and no remote media/embed renderer.

## Project Constraints (from AGENTS.md)

- Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation; avoid unnecessary platform churn. [VERIFIED: AGENTS.md]
- Preserve in-progress work and do not risk production data while working around whole-document persistence; use incremental, tested boundaries. [VERIFIED: AGENTS.md]
- Follow the App Router/feature/lib/server layering; server-only access stays under `apps/web/lib/server/`, and browser components use routes or server-rendered props. [VERIFIED: AGENTS.md]
- Keep TypeScript strict, use the established two-space/single-quote style, named library exports, PascalCase component files, and colocated `*.test.ts(x)` tests. [VERIFIED: AGENTS.md]
- Provide accessible names, visible focus styles, `type` and `aria-*` attributes on interactive elements; run web lint, typecheck, and Jest tests for web changes. [VERIFIED: AGENTS.md]
- Begin edits through the GSD workflow; preserve unrelated dirty-worktree changes. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| MEDIA-01 | A provider detail page uses factual provider-specific content with official sources and displays media only when stored rights evidence identifies it as Scholar Scout-owned, licensed, provider-approved, or an approved embed. | Keep `CatalogueFocusView` and its source-first snapshot model; make an allowed media DTO derive only from validated, retained rights evidence at publication time. |
| MEDIA-02 | A provider page falls back to factual text and source links when media rights are unknown, expired, revoked, or unsupported. | Treat every non-`valid`, expired, absent, malformed, unsupported, inaccessible, or non-local provider media record as `mediaFallback: true`; render the existing factual slot rather than a failed player/image. |
| MEDIA-03 | Scholar Scout-owned transition stories are finite, inclusive, non-authoritative, and motion-safe; they connect students to factual opportunities without implying that a pictured person attended, was placed by, or is endorsed by a provider. | Add a bounded, generic, text-first story catalogue with explicit Skip/Explore-facts actions, controlled factual links, a non-affiliation disclosure, and no autoplay/infinite progression or unproven people imagery. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Provider detail facts and official actions | Frontend Server (SSR) | Database / Storage | The existing App Router page reads only the published snapshot and renders server-composed factual props. [VERIFIED: codebase grep] |
| Media-rights decision and public projection | API / Backend | Database / Storage | Candidate validation/publication must decide media eligibility before a public page receives a URL. [VERIFIED: codebase grep] |
| Provider media fallback | Frontend Server (SSR) | — | The page can render the same factual source surface when the safe DTO is absent; no client retry or provider request is needed. [VERIFIED: codebase grep] |
| Finite transition-story content | Frontend Server (SSR) | Browser / Client | Static editorial records can render server-side; any optional next/close interaction belongs in a small client component only. [VERIFIED: codebase grep] |
| Non-essential motion preference | Browser / Client | CDN / Static | CSS owns decorative motion and honors the browser preference while static assets remain locally served. [VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---:|---|---|
| `next` | 15.5.15 | App Router provider/detail and story routes | Existing project framework; `public/` assets can be served from a local path and remote image sources need explicit configuration. [VERIFIED: codebase grep; CITED: https://nextjs.org/docs/app/api-reference/components/image] |
| `react` / `react-dom` | 18 | Semantic factual and story presentation | Existing UI runtime and test target. [VERIFIED: codebase grep] |
| TypeScript | 5.x | Rights/story DTOs and pure validation | Existing strict, no-emit application contract. [VERIFIED: AGENTS.md] |
| Jest + Testing Library | Jest 30.3.0 | Unit, App Router, and accessible component behavior tests | Existing web test harness and conventions. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---:|---|---|
| CSS `prefers-reduced-motion` | browser standard | Disable non-essential story/decorative animation | Always for any movement added to this phase; retain readable still/text content. [CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |
| Native `<img>` or existing Next image capability | existing platform | Render only an approved local still with a meaningful `alt` | Use only after the server/media DTO has accepted rights and accessibility metadata; no dynamic remote provider source. [CITED: https://nextjs.org/docs/app/api-reference/components/image] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Local approved stills plus factual fallback | Dynamic provider URL renderer | Dynamic remote URLs expand the request/privacy, availability, and source-control boundary; they are unnecessary for the requirement and need explicit Next remote allowlisting. [CITED: https://nextjs.org/docs/app/api-reference/components/image] |
| Text-first static story catalogue | Autoplay/full-screen carousel or endless feed | A carousel/feed adds attention mechanics and makes finite, skippable, keyboard-clear progression harder; the roadmap explicitly forbids infinite/autoplay mechanics. [VERIFIED: .planning/ROADMAP.md] |
| No embed renderer in this phase | Direct provider/third-party iframe embeds | An embed can be a valid future rights class, but it also needs provider-specific accessibility, privacy, title, transcript, and load-behavior review. Render its factual fallback until that contract exists. [VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/media/av/planning/] |

**Installation:** No new packages. Use the installed Next/React/Jest stack. [VERIFIED: apps/web/package.json]

## Architecture Patterns

### System Architecture Diagram

```text
Staff candidate + exact media rights evidence
        |
        v
catalogue-publication validation
  | valid, current, accessible local asset              | absent / uncertain / revoked / expired / unsupported
  v                                                     v
published snapshot: safe media DTO                 published snapshot: mediaFallback=true
  |                                                     |
  +--------------------------+--------------------------+
                             v
       /programmes/[id] server page -> factual CatalogueFocusView
                             |
              +--------------+---------------+
              |                              |
              v                              v
        approved local still              factual no-media panel
        + alt/caption/disclosure          + source/date/status/actions

finite Scholar Scout story records -> /stories -> Skip / Explore factual opportunities
                                                  |
                                                  v
                                  controlled /programmes or /programmes/[id] links
                                  + explicit non-affiliation disclosure
```

### Recommended Project Structure

```text
apps/web/
├── app/stories/page.tsx                         # server-rendered finite story entry
├── components/catalogue/ProviderMediaPreview.tsx # safe media-or-fallback renderer
├── components/stories/TransitionStoryList.tsx    # semantic finite story cards/actions
├── lib/catalogue-publication.ts                  # stricter rights/evidence validation
├── lib/catalogue-discovery.ts                    # public media presentation mapping
├── lib/transition-stories.ts                     # bounded, generic story records and link helpers
└── __tests__/
    ├── lib/catalogue-publication.test.ts
    ├── lib/catalogue-discovery.test.ts
    ├── lib/transition-stories.test.ts
    ├── components/ProviderMediaPreview.test.tsx
    ├── components/TransitionStoryList.test.tsx
    └── app/stories/page.test.tsx
```

### Pattern 1: Publication-time allowlist, public-time projection

**What:** Keep raw candidate rights evidence in the staff publication state, validate it with the candidate, and project only a minimal renderable record into `CataloguePublishedRecord`. The public route must never inspect draft candidates or make a provider request. [VERIFIED: codebase grep]

**When to use:** Every record-scoped provider visual, including a future approved embed. [VERIFIED: .planning/research/ARCHITECTURE.md]

**Required rules:**

- Require a media URL/asset identifier, nonempty semantic alt text (or an explicit decorative-only classification), rights kind, exact rights-evidence URL, rights-reviewed date, `status: 'valid'`, and a non-expired expiry if one exists. [VERIFIED: codebase grep; CITED: https://nextjs.org/docs/app/api-reference/components/image]
- Make omitted status invalid for rendering; it is an unknown state, not a valid state. [VERIFIED: codebase grep]
- Preserve candidate rights evidence through the published projection or derive a tamper-detectable safe presentation field during publication. The current published record includes `media` and `mediaFallback` but excludes `mediaRights`. [VERIFIED: codebase grep]
- Allow the Phase 13 renderer to consume only internal `/images/...` asset IDs for `scholarscout-owned`, `licensed`, or `provider-approved` copy approved for Scholar Scout hosting. Treat `approved-embed` as unsupported until a separate iframe accessibility/privacy contract is approved. [VERIFIED: codebase grep; CITED: https://nextjs.org/docs/app/api-reference/components/image]
- Never copy a public provider image merely because it is publicly visible; the U.S. Copyright Office says reuse normally requires permission or a licence unless a limitation applies. [CITED: https://copyright.gov/circs/circ16a.pdf]

**Example:**

```typescript
// Source: existing catalogue-publication validation pattern.
export function isRenderableProviderMedia(media: ProviderMedia, now: Date): boolean {
  return media.rights.status === 'valid'
    && isInternalApprovedMediaPath(media.assetPath)
    && hasMeaningfulAltText(media.alt)
    && (!media.rights.expiresAt || media.rights.expiresAt >= toIsoDate(now));
}
```

### Pattern 2: Factual fallback is the default UI, not an error state

**What:** `ProviderMediaPreview` receives a safe optional media DTO. Missing or rejected DTOs render the same source-first, text-and-source content that Phase 11 already guarantees. [VERIFIED: codebase grep]

**When to use:** Unknown, expired, revoked, uncertain, malformed, remote, embed, broken, or accessibility-incomplete media. [VERIFIED: .planning/ROADMAP.md]

**Example:**

```tsx
// Source: existing DiscoveryPreviewSlot and CatalogueFocusView boundary.
return media ? (
  <figure aria-labelledby="provider-media-caption">
    <img src={media.assetPath} alt={media.alt} />
    <figcaption id="provider-media-caption">{media.caption}</figcaption>
  </figure>
) : (
  <FactualMediaFallback source={item.source} officialUrl={item.officialVerificationUrl} />
);
```

### Pattern 3: Finite, non-authoritative story-to-facts journey

**What:** Store 3–6 generic, Scholar Scout-written story records in a pure module. Each has plain-language text, a generic inclusive context, one controlled factual exploration link, an always-visible Skip action, and a fixed disclosure that stories do not describe provider attendance, placement, endorsement, or an outcome. [VERIFIED: .planning/research/SUMMARY.md; VERIFIED: .planning/ROADMAP.md]

**When to use:** Optional orientation before discovery, never as a prerequisite for browsing. [VERIFIED: .planning/REQUIREMENTS.md]

**Example:**

```typescript
// Source: controlled catalogue URL helpers in catalogue-discovery.ts.
export const transitionStories = [
  {
    id: 'explore-local-options',
    title: 'Start by comparing what is documented',
    body: 'This is a Scholar Scout context story, not a provider account or outcome claim.',
    factsHref: buildCatalogueDiscoveryHref({ metro: 'greater-houston', page: 1 }),
  },
] as const;
```

### Anti-Patterns to Avoid

- **Media rights inferred from a public URL:** A public image page is not stored permission/licence evidence; require a concrete valid rights record. [CITED: https://copyright.gov/circs/circ16a.pdf]
- **Missing `status` treated as valid:** This defeats MEDIA-02 because unknown is rendered rather than falling back. [VERIFIED: codebase grep]
- **A provider detail page that receives raw candidate state:** Draft/reviewer data and rights evidence must remain behind the publication boundary. [VERIFIED: codebase grep]
- **Remote image and embed loading in the student request path:** Do not scrape, proxy, or dynamically fetch provider content; no runtime provider-network request is part of the governed read contract. [VERIFIED: .planning/research/PITFALLS.md]
- **Story copy that names pictured people or links a generic image to a provider:** A story must say it is Scholar Scout context and the factual record must carry the provider facts. [VERIFIED: .planning/research/ARCHITECTURE.md]
- **Autoplay, timed auto-advance, infinite scroll, or motion-required completion:** Stories must be finite, skippable, and fully useful in the no-motion/no-media form. [VERIFIED: .planning/ROADMAP.md; CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Provider fact provenance | A second provider/profile data source | Existing reviewed `CataloguePublishedRecord` snapshot and its per-fact evidence | Preserves source/date/status and avoids divergence from the governed catalogue. [VERIFIED: codebase grep] |
| Media eligibility | Component-level `if (url)` checks | One pure publication validator and a server-derived safe DTO | All public surfaces then share expiration/revocation/alt/fallback logic. [VERIFIED: codebase grep] |
| Story navigation | Carousel/autoplay framework | Native links/buttons plus a fixed local record list | No package is needed for finite, keyboard-operable progression. [VERIFIED: apps/web/package.json] |
| Motion preference | JavaScript preference polling | Existing CSS `@media (prefers-reduced-motion: reduce)` contract | Browser preference works without hydration or persisted user data. [VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |
| Captions/transcripts | A custom timed-media player | Text-first stories; defer video/embed playback until a tested native media contract provides captions and transcript/description | Pre-recorded synchronized media requires captions and a media alternative or audio description. [CITED: https://www.w3.org/TR/wcag/] |

**Key insight:** The factual source and text fallback are the durable product. Media is a conditional enhancement that is safe only after publication validates rights, accessibility, and an intentionally small delivery boundary. [VERIFIED: .planning/ROADMAP.md]

## Common Pitfalls

### Pitfall 1: “Unknown” rights accidentally render

**What goes wrong:** A candidate with `mediaRights.status` omitted is treated as usable by the current helper, so a provider asset can reach a public snapshot. [VERIFIED: codebase grep]

**Why it happens:** The existing type makes status optional and the helper rejects only `revoked` and `uncertain`. [VERIFIED: codebase grep]

**How to avoid:** Make status mandatory for any renderable media and require `valid`; migrate old/absent values to `mediaFallback: true`. [VERIFIED: codebase grep]

**Warning signs:** A test fixture with a media URL and rights kind/source URL but no status renders an image. [VERIFIED: codebase grep]

### Pitfall 2: Rights evidence disappears after publication

**What goes wrong:** The page can see an asset URL but cannot prove which allowed rights category and review evidence authorized it. [VERIFIED: codebase grep]

**Why it happens:** `toPublishedRecord` copies `media` but not `mediaRights`. [VERIFIED: codebase grep]

**How to avoid:** Store a minimal immutable, validated rights presentation record in the snapshot or create a signed/validated `renderableMedia` projection as part of publishing. [VERIFIED: codebase grep]

**Warning signs:** Public DTO tests can mutate or synthesize media without a corresponding rights record. [VERIFIED: codebase grep]

### Pitfall 3: A generic story appears to be provider testimony

**What goes wrong:** A photo or narrative of people next to a provider link suggests attendance, placement, endorsement, or outcome. [VERIFIED: .planning/research/PITFALLS.md]

**Why it happens:** Visual proximity and provider-specific wording make a general illustration read as evidence. [VERIFIED: .planning/research/ARCHITECTURE.md]

**How to avoid:** Use text-first/non-representational Phase 13 stories; label them Scholar Scout context; separate story copy from the factual record; include a visible non-affiliation statement before any provider-specific factual link. [VERIFIED: .planning/ROADMAP.md]

**Warning signs:** Story copy uses a provider name, success/outcome language, testimonial framing, or a pictured-person caption. [VERIFIED: .planning/research/PITFALLS.md]

### Pitfall 4: Motion or video becomes an access gate

**What goes wrong:** A learner needs to watch, hear, time a response, or endure movement to find the factual action. [CITED: https://www.w3.org/WAI/media/av/planning/]

**Why it happens:** A story format is implemented as a media player or timed carousel rather than structured content. [VERIFIED: .planning/ROADMAP.md]

**How to avoid:** No autoplay or auto-advance; keep Skip/Explore factual opportunities in DOM order; use still text by default; disable all non-essential motion under `prefers-reduced-motion`; introduce prerecorded audio/video only with captions and transcript/media alternative. [CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39; CITED: https://www.w3.org/TR/wcag/]

**Warning signs:** `setTimeout` changes story step, movement is not covered by the existing reduced-motion rule, or the factual link appears only after a media event. [VERIFIED: codebase grep]

### Pitfall 5: The existing transition image is assumed to be cleared

**What goes wrong:** The people-based `scholar-scout-transition-v1.png` is reused as evidence of a provider experience without a stored ownership/licence review. [VERIFIED: codebase grep]

**Why it happens:** It is already a local static asset and CSS background, but no rights manifest or asset source record was found in the searched source/docs. [VERIFIED: codebase grep]

**How to avoid:** Do not add it to provider pages or Phase 13 stories until an accountable owner records and reviews its ownership/licence, permitted use, accessible treatment, and non-affiliation text; use text/CSS-only stories meanwhile. [CITED: https://copyright.gov/circs/circ16a.pdf]

**Warning signs:** A new reference to `/images/scholar-scout-transition-v1.png` appears in a provider-detail/story component without a validated story asset record. [VERIFIED: codebase grep]

## Code Examples

### Fail closed on media rights

```typescript
// Source: current catalogue-publication.ts media checklist pattern.
function isUsableMedia(media: ProviderMedia | undefined, now: Date): boolean {
  if (!media) return false;
  return media.rights.status === 'valid'
    && Boolean(media.rights.evidenceUrl)
    && Boolean(media.rights.reviewedAt)
    && hasMeaningfulAltText(media.alt)
    && isInternalApprovedMediaPath(media.assetPath)
    && (!media.rights.expiresAt || media.rights.expiresAt >= toIsoDate(now));
}
```

### Keep stories non-authoritative and factual links controlled

```tsx
// Source: current Link and catalogue-discovery URL-helper patterns.
<article aria-labelledby={`${story.id}-title`}>
  <p>Scholar Scout transition story</p>
  <h2 id={`${story.id}-title`}>{story.title}</h2>
  <p>{story.body}</p>
  <p>This story is not a provider account, endorsement, placement, or outcome claim.</p>
  <Link href={story.factsHref}>Explore factual opportunities</Link>
  <Link href="/programmes">Skip stories and browse factual opportunities</Link>
</article>
```

### Respect motion without hiding the factual journey

```css
/* Source: existing globals.css convention and W3C C39. */
@media (prefers-reduced-motion: reduce) {
  .transition-story-decoration {
    animation: none;
    transform: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Phase 11 structural “Media preview” placeholder | Phase 13 validated conditional media preview plus factual fallback | This phase | The route preserves a safe default while making valid rights evidence actionable. [VERIFIED: codebase grep] |
| Unbounded visual/story concepts | Fixed local story records and user-controlled links | This phase | Implements the roadmap’s finite, skippable non-authoritative story boundary. [VERIFIED: .planning/ROADMAP.md] |
| Optional CSS motion already limited to decorative layers | Reuse and extend `prefers-reduced-motion` for any new decoration | Existing project convention | Removes non-essential motion without removing the information/action. [VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |

**Deprecated/outdated:**

- Treating an optional `mediaRights.status` as renderable is unsafe for this phase; replace it with an explicit valid-only gate. [VERIFIED: codebase grep]
- The static people-based transition image cannot be treated as cleared provider/story media until rights provenance is recorded. [VERIFIED: codebase grep]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | No new npm package is necessary for the text-first, local-media-first implementation. [ASSUMED] | Standard Stack | A later approved video/embed requirement could need a reviewed platform capability or service. |

## Open Questions

1. **Who is the accountable owner for existing and future story assets?**
   - What we know: the existing people-based image is locally served but no rights manifest was found in the scoped repository search. [VERIFIED: codebase grep]
   - What's unclear: ownership/licence, permitted audience/use, expiry, and attribution obligations. [VERIFIED: codebase grep]
   - Recommendation: require a named owner and a dated rights record before using any people-based asset; otherwise ship the text/CSS-only story treatment. [CITED: https://copyright.gov/circs/circ16a.pdf]

2. **Should Phase 13 render any approved embed?**
   - What we know: `approved-embed` is an existing rights kind, but no public embed renderer, iframe accessibility contract, or transcript/privacy review exists. [VERIFIED: codebase grep]
   - What's unclear: exact provider/third-party terms, accessibility metadata, cookie/network behavior, and acceptable CSP framing. [VERIFIED: codebase grep]
   - Recommendation: retain the enum but treat it as unsupported/fallback in this phase; obtain a separate approval before adding iframe code. [CITED: https://www.w3.org/WAI/media/av/planning/]

3. **What small editorial set constitutes the first inclusive transition-story library?**
   - What we know: the roadmap requires finite, inclusive, non-authoritative stories. [VERIFIED: .planning/ROADMAP.md]
   - What's unclear: approved copy, exact number of stories, localization, and which controlled discovery links each story may use. [ASSUMED]
   - Recommendation: product approves 3–6 short generic text records; each maps only to a controlled browse/detail URL and retains a Skip action. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | Next build/test/typecheck | ✓ | v24.19.0 | — [VERIFIED: local command] |
| Corepack pnpm | workspace scripts | ✓ | 10.34.5 | — [VERIFIED: local command] |
| Current web Jest binary | focused automated tests | ✗ | unavailable from workspace execution | Run `corepack pnpm install --frozen-lockfile --ignore-scripts` before execution, then use the existing test script. [VERIFIED: local command] |
| Browser reduced-motion preference | manual accessibility review | ✓ | standard browser feature | CSS fallback is still readable/non-moving. [CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |

**Missing dependencies with no fallback:** None; the web dependency installation step is the normal documented workspace setup. [VERIFIED: AGENTS.md]

**Missing dependencies with fallback:** None. [VERIFIED: local command]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 with Testing Library and Next integration. [VERIFIED: codebase grep] |
| Config file | `apps/web/jest.config.ts`. [VERIFIED: .planning/codebase/TESTING.md] |
| Quick run command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath <paths>` [VERIFIED: .planning/codebase/TESTING.md] |
| Full suite command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` [VERIFIED: .planning/phases/12-qualification-lens-and-explanation-governance/12-VERIFICATION.md] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| MEDIA-01 | Valid current local rights DTO renders media with alt/caption while every provider fact/source remains visible. | unit + component + page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/catalogue-discovery.test.ts __tests__/components/ProviderMediaPreview.test.tsx __tests__/components/CatalogueFocusView.test.tsx __tests__/app/programmes/[id]/page.test.tsx` | ❌ Wave 0: `ProviderMediaPreview.test.tsx`; extend existing others |
| MEDIA-02 | Absent, no-status, unknown, expired, revoked, uncertain, malformed, remote, and unsupported embed records produce factual fallback with official links. | unit + component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/catalogue-publication.test.ts __tests__/lib/catalogue-discovery.test.ts __tests__/components/ProviderMediaPreview.test.tsx` | ❌ Wave 0: `ProviderMediaPreview.test.tsx`; extend existing lib tests |
| MEDIA-03 | The finite story list has controlled factual links, a Skip action, non-affiliation language, no timed/autoplay mechanism, and semantic accessible structure. | unit + component + page | `corepack pnpm --filter @scholar-scout/web test -- --runInBand --runTestsByPath __tests__/lib/transition-stories.test.ts __tests__/components/TransitionStoryList.test.tsx __tests__/app/stories/page.test.tsx __tests__/components/StudentJourneyScene.test.tsx` | ❌ Wave 0: three story tests; existing scene test extended |

### Sampling Rate

- **Per task commit:** focused affected Jest paths plus `corepack pnpm --filter @scholar-scout/web run typecheck` and `corepack pnpm --filter @scholar-scout/web run lint`. [VERIFIED: AGENTS.md]
- **Per wave merge:** `corepack pnpm --filter @scholar-scout/web test -- --runInBand`. [VERIFIED: .planning/phases/12-qualification-lens-and-explanation-governance/12-VERIFICATION.md]
- **Phase gate:** full suite green plus manual rights-owner, keyboard/screen-reader, narrow-viewport, and reduced-motion checks. [VERIFIED: .planning/research/ARCHITECTURE.md]

### Wave 0 Gaps

- [ ] `apps/web/__tests__/components/ProviderMediaPreview.test.tsx` — valid media and every MEDIA-02 fallback state.
- [ ] `apps/web/__tests__/lib/transition-stories.test.ts` — finite records, controlled URL targets, and prohibited provider/outcome phrasing.
- [ ] `apps/web/__tests__/components/TransitionStoryList.test.tsx` — links, Skip, disclosure, DOM order, and no timer/player.
- [ ] `apps/web/__tests__/app/stories/page.test.tsx` — public server route and factual navigation.
- [ ] Extend `catalogue-publication`, `catalogue-discovery`, `CatalogueFocusView`, detail-page, and `StudentJourneyScene` tests for the shared rights/motion contracts.
- [ ] Environment setup: `corepack pnpm install --frozen-lockfile --ignore-scripts` before test execution. [VERIFIED: local command]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | Public provider/story rendering remains unauthenticated; staff publication authorization is preserved, not expanded. [VERIFIED: codebase grep] |
| V3 Session Management | No | Stories and media do not create session/profile state. [VERIFIED: .planning/ROADMAP.md] |
| V4 Access Control | Yes | Only existing authorized staff publication operations may introduce media records; public pages receive published snapshots only. [VERIFIED: codebase grep] |
| V5 Input Validation | Yes | Validate media asset path, rights kind/status/evidence date/expiry, alt/caption bounds, story IDs, and controlled route parameters in pure helpers. [VERIFIED: codebase grep] |
| V6 Cryptography | No | Do not add custom crypto; retain current snapshot integrity/publication mechanisms. [VERIFIED: codebase grep] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Unlicensed or revoked asset shown publicly | Tampering / Repudiation | Valid-only rights state, evidence/review date, expiry check, published projection, factual fallback, and human rights audit. [VERIFIED: codebase grep; CITED: https://copyright.gov/circs/circ16a.pdf] |
| Provider site/media request caused by student browse | Information Disclosure / DoS | Do not dynamically load remote provider URLs, scrape, or render embeds in this phase; serve approved local assets only. [VERIFIED: .planning/research/PITFALLS.md] |
| Misleading provider affiliation/outcome through imagery | Spoofing | Generic, non-provider story copy; non-affiliation disclosure; factual provider details and sources stay separate. [VERIFIED: .planning/research/ARCHITECTURE.md] |
| Unsafe external URL or crafted media path | Tampering | Existing HTTP URL and bounded-text validation plus a new internal path allowlist; never interpolate unvalidated iframe/image URLs. [VERIFIED: codebase grep; CITED: https://nextjs.org/docs/app/api-reference/components/image] |
| Motion harms or obscures controls | Denial of Service | Decorative only, pointer-inert/`aria-hidden`, CSS reduced-motion disablement, and visible text/Skip controls. [VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39] |

## Sources

### Primary (HIGH confidence)

- `apps/web/lib/catalogue-publication.ts`, `apps/web/lib/server/catalogue-publications.ts`, `apps/web/lib/catalogue-discovery.ts` — current rights/fallback/public-snapshot contract. [VERIFIED: codebase grep]
- `apps/web/app/programmes/[id]/page.tsx`, `apps/web/components/catalogue/CatalogueFocusView.tsx`, and `DiscoveryPreviewSlot.tsx` — current factual detail and intentional media-empty boundary. [VERIFIED: codebase grep]
- `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` — locked phase scope, success criteria, and product risks. [VERIFIED: codebase grep]
- `apps/web/app/globals.css` and `apps/web/components/visual/StudentJourneyScene.tsx` — existing decorative motion/reduced-motion pattern. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)

- [Next.js Image component documentation](https://nextjs.org/docs/app/api-reference/components/image) — local/static image forms, remote allowlists, alt semantics, and dimension behavior. [CITED: https://nextjs.org/docs/app/api-reference/components/image]
- [W3C WCAG 2.2](https://www.w3.org/TR/wcag/) and [WAI media planning](https://www.w3.org/WAI/media/av/planning/) — captions, media alternatives/audio description, and accessible player planning. [CITED: https://www.w3.org/TR/wcag/; CITED: https://www.w3.org/WAI/media/av/planning/]
- [W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) — reduced-motion media query guidance. [CITED: https://www.w3.org/WAI/WCAG22/Techniques/css/C39]
- [U.S. Copyright Office Circular 16A](https://copyright.gov/circs/circ16a.pdf) — permission/licence baseline for third-party works. [CITED: https://copyright.gov/circs/circ16a.pdf]

### Tertiary (LOW confidence)

- None; product-owner approval is still required for exact story copy and asset provenance. [ASSUMED]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependency is proposed; existing package/test configuration was inspected. [VERIFIED: apps/web/package.json]
- Architecture: HIGH — the recommendation follows concrete publication, snapshot, detail, and motion seams already present in source. [VERIFIED: codebase grep]
- Pitfalls: MEDIUM — codebase confirms current failure modes; copyright and WCAG implementation guidance was checked against official sources. [VERIFIED: codebase grep; CITED: https://copyright.gov/circs/circ16a.pdf; CITED: https://www.w3.org/TR/wcag/]

**Research date:** 2026-09-25
**Valid until:** 2026-10-25 for codebase architecture; recheck external media/copyright policy before a future embed/video implementation.
