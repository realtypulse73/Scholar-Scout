# Phase 13: Provider Detail, Transition Stories, and Media Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 13-provider-detail-transition-stories-and-media-safety
**Areas discussed:** Provider-page media, visual opportunity explorer, factual provider connection, media transparency

---

## Provider-page media

| Option | Description | Selected |
|--------|-------------|----------|
| Strict local/owned media | Render only reviewed, approved local media. | |
| Provider-approved embeds | Permit approved provider media with guarded handling. | ✓ |
| Text-first only | Keep provider visuals out of this phase. | |

**User's choice:** Provider-approved embeds, but retain a complete factual fallback whenever rights or rendering checks fail.
**Notes:** User wants an immediate visual invitation similar to a Realtor.com listing, with deeper material available after the first impression. A visible provenance label and in-page details are required.

---

## Visual opportunity explorer

| Option | Description | Selected |
|--------|-------------|----------|
| Optional browse card | Stories are entered only from a discovery prompt. | |
| Dedicated Stories destination | Stories live only in main navigation. | |
| Both entry points | Optional discovery prompt plus dedicated destination. | ✓ |

**User's choice:** A mixture of entry points, reframed for now as a visual opportunity explorer rather than personal college-side stories.
**Notes:** The user wants students in every approved metro to see all six areas’ options. Personal student uploads and individual outcome stories are later work, not this phase.

### Motion behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Student-started preview | Visual remains still until tap/hover. | |
| Automatic muted preview | Visible preview begins muted. | ✓ |
| First visible card | The top card remains the moving card. | |
| Centered card | The card nearest viewport center becomes the moving card. | ✓ |

**User's choice:** A narrow exception: one centered card may loop muted media, stops on scroll-away, includes pause control, and never plays when reduced motion is enabled.
**Notes:** This is explicitly not an infinite or multi-card autoplay feed.

---

## Factual provider connection

| Option | Description | Selected |
|--------|-------------|----------|
| Scholar Scout detail first | Open factual provider detail before leaving Scholar Scout. | ✓ |
| Official provider site first | Send the student directly to the provider. | |

**User's choice:** Open Scholar Scout’s factual provider-detail page first.
**Notes:** The hero visual is followed by verified facts. Compare and official-site actions have equal prominence. Official-provider links open in a new tab.

---

## Media transparency and fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Label only | Simple media label without detailed source information. | |
| Visible label plus details | Friendly label, reviewed date, and in-page details. | ✓ |

**User's choice:** A concise label plus reviewed date and `About this media` in-page pop-up; a quiet non-affiliation statement appears by the media.
**Notes:** The approved fallback order is rights-approved provider/Scholar Scout media, then a separately approved Google Street View/Maps embed, then a clearly labelled Scholar Scout illustrative learning environment. Google imagery must not be copied or treated as public domain.

---

## the agent's Discretion

- Exact responsive layout, motion timing, viewport threshold, pause control, dialog UI, local story copy, and finite controlled factual links.
- Technical rights validation and accessibility boundary necessary before any third-party embed renders.

## Deferred Ideas

- Student-uploaded provider/peer content and individual student stories, pending a dedicated consent, age/privacy, moderation, rights, attribution, takedown, and retention phase.
- Any real third-party Street View/embed renderer pending terms, privacy, accessibility, and source-rights approval.

---

*Phase: 13-provider-detail-transition-stories-and-media-safety*
*Discussion log generated: 2026-09-26*
