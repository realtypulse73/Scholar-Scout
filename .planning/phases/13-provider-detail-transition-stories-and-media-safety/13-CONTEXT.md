# Phase 13: Provider Detail, Transition Stories, and Media Safety - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver an attention-holding, factual visual opportunity explorer for the governed six-area catalogue. Provider pages remain source-first and rights-safe. General Scholar Scout context remains finite, inclusive, non-authoritative, and separate from any provider. The phase does not collect student uploads, scrape/copy public provider-site assets, create personal success stories, or imply attendance, placement, affiliation, or outcomes.

</domain>

<decisions>
## Implementation Decisions

### Provider visual introduction and rights fallback
- **D-01:** Each provider page should open with an immediate visual introduction that brings a student into the learning environment before the factual detail section. It uses a short muted local preview when a reviewed rights record authorizes it; factual source information follows directly below it. — **Reversibility:** costly — it establishes the public provider-detail presentation contract.
- **D-02:** Render provider-specific media only with stored, current proof that it is Scholar Scout-owned, licensed, provider-approved, or an approved embed. Visible media labels use student-friendly wording such as `Provider-approved media` or `Scholar Scout visual`, plus a concise reviewed month/year.
- **D-03:** The fallback order is: (1) rights-approved provider or Scholar Scout media; (2) a separately approved Google Maps/Street View embed with required attribution, privacy, accessibility, and terms review; (3) a clearly labelled Scholar Scout-generated illustrative learning environment that is never represented as the actual campus. If none passes publication/rendering checks, show the complete factual text-and-source fallback rather than a copied or misleading image.
- **D-04:** An approved external embed must remain opt-in behind an explicit student action; its availability, privacy behavior, attribution, captions/transcript or equivalent accessible information, and framing terms require validation before it can render. A copied Street View screenshot is not an allowed fallback.

### Visual opportunity explorer interaction
- **D-05:** Replace the immediate personal-story emphasis with a visual opportunity explorer: optional visual prompts inside discovery plus a dedicated Stories/visual-explorer destination. A student can still browse every metro and pathway without opening a story or providing personal data. — **Reversibility:** moderate — the entry route can be revisited after high-school use and feedback.
- **D-06:** The only automatic motion exception is one short muted loop on the provider card nearest the viewport center. It stops as the card leaves view, exposes a visible pause control, never plays under `prefers-reduced-motion`, and must not grow into an infinite or multi-card autoplay feed. — **Reversibility:** costly — it is an explicit exception to the prior no-autoplay boundary.
- **D-07:** Keep any Scholar Scout-owned transition context finite, skippable, inclusive, motion-safe, and clearly separate from provider facts. Do not tell individual student stories or collect student-uploaded media in this phase.

### Factual detail and student next steps
- **D-08:** Tapping a visual card opens Scholar Scout’s own provider detail page first. That page shows the visual, then verified provider facts, sources, requirements to verify, cost/training information when reviewed, and the existing choice-preserving actions.
- **D-09:** `Compare this option` and `Visit the official provider site` have equal visual prominence. Official-provider links open in a new tab so students retain their Scholar Scout search, shortlist, and comparison context.

### Media transparency and non-affiliation
- **D-10:** Each visible media label exposes an `About this media` control that opens a compact in-page dialog with the source, permission category, review date, and relevant attribution. The non-affiliation statement appears quietly below the visual near its label, not hidden only inside the dialog.

### the agent's Discretion
- Choose exact visual dimensions, timing ceiling, intersection threshold, pause-control icon/text, dialog layout, and source/factual-detail layout within the existing responsive and accessibility contracts.
- Choose the finite general visual-context record copy and controlled factual destinations, provided it avoids personal testimony, provider-specific outcome claims, and implied affiliations.
- Reuse existing governed snapshot, media-rights, source-state, controlled URL, and reduced-motion helpers; add no live provider scraping or unreviewed remote image path.

</decisions>

<specifics>
## Specific Ideas

- The desired experience combines Realtor.com-style provider detail with a TikTok-like visual hook, while remaining calmer and more factual than an endless feed.
- A learner in any of the six areas may explore every other approved area; the system must not assume residence or restrict catalogue access.
- The visual should help a high-school student picture an institution or learning environment immediately, then make verified options and official next steps easy to compare.
- Use diverse, inclusive general Scholar Scout context only as context; a visual must not make a person appear to be a provider student or graduate.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope, rights, and student-agency rules
- `.planning/PROJECT.md` — v1.1 objective, six-area access, source-verified facts, and no unlicensed provider media.
- `.planning/REQUIREMENTS.md` — `MEDIA-01`, `MEDIA-02`, and `MEDIA-03`, including factual fallback and non-authoritative story requirements.
- `.planning/ROADMAP.md` — Phase 13 goal, scoped autoplay exception, success criteria, and release-critical risks.
- `docs/product-recommendation-governance.md` — choice preservation, explanation boundaries, and student-agency requirements.

### Governed snapshot and publication boundaries
- `.planning/phases/10-curated-import-and-governed-staff-publication/10-CONTEXT.md` — reviewed publication, media-rights review, and public-snapshot boundaries.
- `.planning/phases/11-choice-preserving-six-area-discovery/11-CONTEXT.md` — accessible, source-first discovery and detail interactions.
- `.planning/phases/12-qualification-lens-and-explanation-governance/12-CONTEXT.md` — source-backed factual detail and comparison explanations.
- `apps/web/lib/catalogue-publication.ts` — publication validation and media-rights seams.
- `apps/web/lib/catalogue-discovery.ts` — public reviewed-snapshot discovery DTOs and controlled URLs.

### Existing visual and accessible presentation patterns
- `apps/web/components/catalogue/CatalogueFocusView.tsx` — factual focused provider detail composition.
- `apps/web/components/catalogue/DiscoveryPreviewSlot.tsx` — existing guarded media-preview boundary.
- `apps/web/components/visual/StudentJourneyScene.tsx` — existing decorative visual-scene pattern.
- `apps/web/app/globals.css` — existing `prefers-reduced-motion` conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/catalogue-publication.ts` — existing provider-media/right-evidence types and publication checklist; tighten it to valid-only public rendering.
- `apps/web/lib/catalogue-discovery.ts` — current public snapshot model, factual states, detail routes, and source actions.
- `apps/web/app/programmes/[id]/page.tsx` and `apps/web/components/catalogue/CatalogueFocusView.tsx` — established factual provider-detail route and rendering seam.
- `apps/web/components/visual/StudentJourneyScene.tsx` and `apps/web/app/globals.css` — visual decoration and motion-preference handling to extend rather than replace.

### Established Patterns
- Public student surfaces use only a reviewed snapshot, retain source/date/status plus verification actions, and never make live provider requests.
- Media must fail closed: unknown, expired, revoked, malformed, remote, or unsupported records render the factual fallback.
- Native labelled controls, in-DOM actions, visible focus, responsive reflow, and reduced-motion behavior are the current learner-surface accessibility contract.

### Integration Points
- Produce a safe public `renderableMedia` projection during publication so provider-detail pages never decide rights from incomplete raw records.
- Add a provider media component to the existing focus detail and discovery-card seams, retaining full factual content and equal compare/official-site actions.
- Add finite local visual-explorer records with controlled internal factual targets and visible non-affiliation language; do not add persistence, uploads, or remote aggregation.

</code_context>

<deferred>
## Deferred Ideas

- Recruiting students to upload campus or peer content requires a separate consent, age/privacy, moderation, rights, takedown, attribution, and retention design.
- Individual student testimonials, outcome stories, and provider-linked personal narratives remain out of scope until their factual, consent, and non-affiliation rules are separately approved.
- A real Google Maps/Street View or other third-party embed renderer remains conditional on a separate platform-terms, privacy, accessibility, and source-rights approval; no screenshot copying is permitted.

</deferred>

---

*Phase: 13-provider-detail-transition-stories-and-media-safety*
*Context gathered: 2026-09-26*
