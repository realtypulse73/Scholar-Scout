---
phase: 05
slug: school-community-and-wny-release-slice
status: draft
shadcn_initialized: false
preset: none
created: 2026-08-29
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for the Western New York directory, school lockers, peer community, safe submissions, and staff moderation. Existing project tokens and primitives are canonical.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — preserve the existing Tailwind component system |
| Preset | not applicable |
| Component library | existing local primitives: `Card`, `Badge`, `Button` |
| Icon library | none; use clear text labels rather than introducing icon-only controls |
| Font | Geist Sans (`--font-geist-sans`); Geist Mono only for technical content, which this phase has none |

**Established visual language:** use `bg-ink-50` for page canvas, white `Card` surfaces with `border-ink-200`, `rounded-card` (8px), and `shadow-panel`. Reuse the existing `Button` variants and visible `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`. Do not initialize shadcn or add a registry/package for this phase.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon/text gap and compact badge detail |
| sm | 8px | Related labels, metadata, stacked control gaps |
| md | 16px | Default card interior rhythm and field spacing |
| lg | 24px | Card padding and section-internal grouping |
| xl | 32px | Major screen-column and section gaps |
| 2xl | 48px | Separation between distinct page regions when needed |
| 3xl | 64px | Page-level break only on wide screens |

Exceptions: Interactive buttons, links styled as controls, textareas, and select controls use a **44px minimum height** (`min-h-touch`). Existing compact link controls may use 40px only where they are not the sole route to an action; the new **Report this note** control must be at least 44px.

---

## Typography

Use exactly these sizes and two weights. Existing `font-extrabold` usages in affected screens are normalized to the contract’s semibold treatment for new/changed Phase 5 UI.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 regular | 1.5 |
| Label / metadata | 14px | 600 semibold | 1.4 |
| Section heading | 20px | 600 semibold | 1.2 |
| Page heading | 32px | 600 semibold | 1.2 |

Use `text-ink-900` for headings, `text-ink-700` for primary body copy, and `text-ink-600` for supporting copy. All new and changed Phase 5 text, including responsive heroes, must use only the four declared sizes; do not add a fifth type scale or a 36px exception.

**Focal hierarchy:** Render the page hero as the primary focal point, the shared verification notice as the secondary focal point directly below it, and discovery results as the third focal layer. Do not use competing accent treatments or oversized text that reverse this order.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#ffffff` / `#f8fafc` (white / ink-50) | Page canvas, primary reading surfaces, form fields |
| Secondary (30%) | `#f1f5f9` / `#e2e8f0` (ink-100 / ink-200) | Card grouping, dividers, quiet empty states, navigation support |
| Accent (10%) | `#2563eb` (brand-600) | Primary submission/continuation buttons, source links, active focus, verification notice headings |
| Destructive | `#dc2626` (danger-600) | Staff-only **Remove permanently** action and its confirmation; never public report affordance |

Semantic support colors remain existing tokens: success `#047857` confirms a completed submission; warning `#b45309` marks staff access or a pending-review state; `danger-50` may provide a staff-only removal confirmation surface.

Accent reserved for: **official-source links**, **primary “Post note” / “Send inbox request” actions**, **onboarding/sign-in recovery links**, **verification-notice label**, **keyboard focus ring**, and the **current queue filter/state**. It is not a generic decoration, ranking score, safety score, or prediction signal.

---

## Surface and Component Inventory

| Surface | Required composition and behavior |
|---------|------------------------------------|
| Shared verification notice | Reusable static `section`/`aside` directly below each discovery hero and above results. `brand-50`, `border-brand-200`, 24px padding, heading “Verify before applying”, followed by source-oriented guidance. Do not call a listing current, checked, verified, safe, or predicted. |
| WNY institution card | Existing `Card`: institution name/city/type, factual access tags, plain-language review items, then a per-result verification panel (`ink-50`, 16px padding) immediately followed by labeled official-source links. Equal score cards remain alphabetically ordered by institution name. |
| WNY empty directory | Quiet `Card` in the results region, not a blank grid. It stays after personalization controls and gives a recovery link/action to reset or broaden the selected access priorities. |
| School locker programmes | Existing cards in a one-column list; below “Programs at this school,” render either programme cards or the explicit empty state. Unknown locker slugs remain a 404; a known locker with no governed programmes is an empty state. Place the locker-specific verification panel above the programme list. |
| Peer-match cards | Existing two-column grid at `sm` and one column below it. Each card shows only public display name, programme, public bio/current stage, one plain-language compatibility reason, topics, school-locker link, and opt-in inbox/leave-note action. Sort the complete match collection by public display name before rendering; no private profile, support, engagement, or inferred-fit data. |
| Peer no-match card | Existing `Card` with an accessible heading and one recovery CTA. It covers both absent profile and zero compatible uploaders without claiming that no suitable peer exists. |
| Community note board | Heading, safety text, signed-in form or sign-in CTA, live status region, then public-note list. Public rows contain body, neutral “ScholarScout community member,” date, and visible **Report this note** control; never author ID, account name, email, phone, social handle, or reporter identity. |
| Submission-limit helper | Identical supporting sentence near both public-note and inbox forms, positioned before the submit button: “Notes and inbox requests share a limit of five submissions per hour.” It must not show a remaining count. |
| Reporter feedback | After a successful report, immediately remove the note from local public state and announce private confirmation in a `role=status` message. Do not render “reported,” pending-review, reporter, or moderation information inside the public note list. |
| Staff moderation queue | New page-level, server-gated staff screen; one responsive `Card` list/table of pending-review records. Each row shows safe content excerpt, school/context, reported time, and two labeled actions: **Restore to community** and **Remove permanently**. It is separate from programme administration. |

---

## Discovery Copywriting Contract

| Element | Copy |
|---------|------|
| Shared verification notice heading | Verify before applying |
| Shared verification notice body | Use the official links on each listing to confirm programme requirements, deadlines, costs, support availability, and current policies directly with the institution. |
| WNY per-result panel label | Check these details with the institution |
| WNY empty heading | No pathways match these priorities yet |
| WNY empty body | Try adjusting your access priorities, then use the official sources to compare options directly. |
| School-locker verification heading | Verify programme details before you apply |
| School-locker verification body | Programme details can change. Open the official programme page to confirm requirements, delivery, cost, and deadlines. |
| School-locker empty heading | No programme details are available for this school yet |
| School-locker empty body | Explore the student perspectives below and check the school’s official website for current programme information. |
| Peer no-match heading | Set up your pathway profile to find campus uploaders |
| Peer no-match body | Tell us your interests and preferred path. We’ll show public student uploaders with compatible programmes; this is not an admissions decision. |
| Peer no-match CTA | Complete onboarding / Sign in to begin |

---

## Community Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Post note / Send inbox request (use the label matching the form) |
| Shared quota explanation | Notes and inbox requests share a limit of five submissions per hour. |
| Contact safeguard | Do not include phone numbers, email addresses, social handles, or sensitive personal information. |
| Form validation error | Check your message and remove contact details before trying again. |
| Rate-limit error | You’ve reached the shared submission limit. Please try again later. |
| Generic submission error | We couldn’t send your message. Check your connection and try again. |
| Public note empty heading | Start the conversation |
| Public note empty body | Be the first to ask a question or share a helpful campus perspective. Keep personal contact details out of public notes. |
| Report control | Report this note |
| Report confirmation | Thanks for reporting this note. It is hidden from the community while staff review it. |
| Report error | We couldn’t report this note. Please try again. |
| Staff queue empty heading | No notes need review |
| Staff queue empty body | Reported notes will appear here for a restore or removal decision. |
| Staff queue load/error | We couldn’t load moderation items. Refresh the page to try again. |
| Restore action | Restore to community |
| Remove action | Remove permanently |
| Destructive confirmation | Remove permanently: This removes the note from the community and cannot be undone. Remove note? |
| Restore confirmation | Restore to community: This makes the note visible to the community again. Restore note? |

Never characterize people, institutions, or campuses as safe/unsafe; never promise admission; never expose another person’s contact information or the identity of a note’s author/reporter.

---

## Interaction and Responsive Contract

### Discovery

- The page-level notice appears before any ranked WNY cards or school programme cards. Each institution/programme context repeats a smaller nearby verification panel, so the external source is available at the decision point.
- Official external links have visible labels, open in a new tab only when that is the existing behavior, and include `rel="noreferrer"`. Links identify the source in text; do not depend on an icon or color alone.
- Personalization controls keep native labels, 44px select targets, and keyboard operation. Ranking updates are stable and do not announce an admission likelihood.
- At `<640px`, all card grids collapse to one column; paired external links, peer actions, and staff row actions stack full width with an 8px gap. On wider screens WNY and peer cards may use two columns; the moderation queue may use a semantic table only at `lg` and must become labelled stacked rows below it.

### Peer matching and inbox requests

- Match cards are ordered by normalized public display name, including equal eligibility; maintain that order across responsive layouts.
- “Inbox [first name]” opens the existing adjacent form/panel and moves focus to its heading. The form identifies its selected public uploader and programme.
- A topic selector remains visibly required only if the server contract persists/validates it end-to-end. Until then, do not make a topic selection block the existing supported request; preserve a visible required state only for server-validated fields.
- Disable the submit button while sending; keep its label as “Sending request...” / “Posting note...” and use `aria-busy="true"` on the form region. Return focus to the form error/status after a completed request where the user needs feedback.

### Community submission and reporting

- Both forms put the shared quota and contact-safety helper between the text input and submit action. Helper copy is visible before submission and is not a tooltip.
- Client-side max length and blank-state disabling are convenience only. Server responses control success/failure. Validation/rate-limit errors are shown adjacent to the form and announced through a persistent `role="status"` or `aria-live="polite"` region; use `aria-live="assertive"` only for an error that prevents submission.
- Public notes are newest first. A report control is a secondary/ghost text button, never destructive red; activate it with a confirmation dialog that explains it will hide the note pending staff review. Confirming removes it immediately from the rendered list. Cancel leaves it unchanged.
- Repeated activation is idempotent: after success the control cannot be activated again because the row is gone. Errors keep the row visible and retain/return focus to the report control.

### Staff moderation

- The server page gate is authoritative. Unauthorized users receive the existing non-disclosing not-found response; no client staff role check is treated as authorization.
- Pending records are the only default queue content. Each item has a readable content excerpt that wraps rather than clips; long text uses a 3-line CSS clamp with an accessible “Show full note” disclosure for staff.
- Restore uses the secondary button and confirmation dialog; removal uses the danger button and required confirmation. While resolving, disable both actions for that row, announce “Restoring note...” or “Removing note...”, then remove the resolved row and announce the result. Conflicts/failures retain the row with a retry message.

---

## Accessibility Contract

- Use semantic landmarks: one `main`, named navigation, `section` with heading hierarchy (`h1` then `h2`, no skipped levels), `article` for each public note and peer card.
- Every interactive control has a visible text name. Do not use an icon-only report, source, close, or moderation control.
- Preserve visible keyboard focus, 44px targets, native labels for textareas/selects, and error/status associations using `aria-describedby` and `aria-errormessage` where applicable.
- Empty, loading, success, and error states are perceivable without color alone. Badges add text labels; warning/success/destructive colors do not carry the state by themselves.
- Loading collections use 2–3 `Card` skeletons with `aria-busy="true"` on the containing region and no flashing animation; honor `prefers-reduced-motion`. Do not announce every skeleton.
- Dialogs trap focus, label their purpose, default to the safest non-destructive action, close on Escape, and return focus to the initiating control unless the item is removed, in which case focus moves to the list/queue heading.
- Public notes and profile content must wrap at any Unicode whitespace opportunity and break long unspaced strings (`break-words` / `overflow-wrap:anywhere`) rather than overflow or reveal hidden metadata.

---

## UI Considerations

Applicable state considerations resolved: **25 covered, 6 backstop, 0 unresolved**.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | WNY directory; school programme list; peer matches; public notes; staff queue | ✅ covered | Each collection renders its contract heading/body/recovery path rather than an empty grid or 404; only unknown school slugs remain 404. |
| loading | Public notes; moderation queue; submission/report/resolve forms | ✅ covered | Collection region uses non-flashing card skeletons and `aria-busy`; action buttons disable and expose sending/resolving text. |
| error | Public notes; inbox request; report; moderation queue/resolution | ✅ covered | Adjacent live error copy retains the actionable control and offers retry; failed report never hides the note. |
| populated | WNY cards; programme cards; peer cards; notes; pending-review queue | ✅ covered | Card/list structure, public DTO boundaries, stable order, and per-item actions are specified above. |
| partial | School programme source data; peer/public note metadata; queue data | ✅ covered | Omit unavailable optional metadata rather than render placeholders or infer a value; the required title/body/context remains usable. |
| overflow | All cards, official-source labels, note bodies, queue excerpts, navigation | ✅ covered | Wrap text; external-source labels wrap; queue uses 3-line clamp plus “Show full note”; mobile stacks controls. |
| zero-one-many | WNY, programmes, matches, notes, queue | ✅ covered | Zero uses declared empty state; one remains a full-width readable card; many use the declared grid/list with no count-dependent loss of actions. |
| long-text | Textareas, public notes, peer bios/reasons, button/link labels, verification copy | ✅ covered | Inputs enforce server-side bounds; display text wraps/breaks; action labels wrap on mobile without clipping. |
| loading | Final keyboard/screen-reader order for rendered external links and dialogs | 🧪 backstop | Manual release verification opens populated and empty WNY/school surfaces and exercises report/confirmation with keyboard and screen reader. |
| overflow | Long Unicode institution/display names and content without spaces | 🧪 backstop | Component tests use Unicode fixture values; visual check confirms `overflow-wrap:anywhere` prevents horizontal scroll. |
| partial | Staff queue after a concurrent resolution/conflict | 🧪 backstop | Route/store test plus manual queue retry check proves an unresolved row remains actionable rather than silently disappearing. |
| error | Quota-provider unavailable and server validation messages | 🧪 backstop | Route/component tests verify no write, stable error copy, live-region announcement, and preserved form input. |
| zero-one-many | Equal-score WNY and equally eligible peer ordering | 🧪 backstop | Unit/component tests assert alphabetical institution order and stable public-display-name order. |
| populated | Report race with publication | 🧪 backstop | Store integration test forces the interleaving and confirms public read omits the reported note. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not applicable — no shadcn initialization and no third-party registry declared |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-08-29 — checker verified after the typography, spacing, and focal-hierarchy revision; user approved all 25 covered and 6 backstop UI considerations.
