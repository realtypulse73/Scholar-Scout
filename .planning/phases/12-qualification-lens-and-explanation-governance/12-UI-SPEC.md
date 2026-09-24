---
phase: 12
slug: qualification-lens-and-explanation-governance
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-24
---

# Phase 12 — UI Design Contract

> Visual and interaction contract for the optional, private qualification lens. This lens compares only student-declared ordinary qualifications with reviewed published requirements; it never removes an opportunity or makes a decision about a student's future.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — retain the existing custom Tailwind UI primitives |
| Preset | not applicable |
| Component library | existing local `Button`, `Card`, `Badge`, labelled native form controls |
| Icon library | none; use short visible text and an inline semantic SVG only where it supplements text |
| Font | Space Grotesk, then Arial/Helvetica/sans-serif fallback |

Use the established red, white, silver, and ink system. Do not initialize shadcn in this approved noninteractive continuation. No third-party UI registry or block is allowed in this phase.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-text gaps and source/status line separation |
| sm | 8px | Checkbox/radio option spacing and compact metadata gaps |
| md | 16px | Default field, card, and action spacing |
| lg | 24px | Card padding and form-section separation |
| xl | 32px | Gaps between the lens panel, result summary, and result list |
| 2xl | 48px | Major content-region breaks |
| 3xl | 64px | Page-level separation on large screens |

Exceptions: every pointer-operable control, including each radio label, checkbox label, keyword removal button, expander, and action, has a 44px minimum target (`min-h-touch`). A compact inline source link may be smaller only when it has at least 8px clear separation from adjacent targets and its enclosing requirement row has a separate 44px `Verify` action.

---

## Typography

Use only these four sizes and two weights in new Phase 12 UI. Body copy uses short sentences at an approximate sixth-grade reading level; this is a writing standard, not a judgment about a student.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Metadata / status label | 12px | 600 | 1.33 |
| Body / field label / action | 14px | 400; labels and actions 600 | 1.5 |
| Section heading | 20px | 600 | 1.2 |
| Page heading | 30px | 600 | 1.2 |

Long requirement names, source names, selected keywords, and private-note text wrap at word boundaries; do not truncate them with an ellipsis. Preserve `break-words`, `min-w-0`, and a maximum readable line length of 65ch for explanatory paragraphs.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` | Page background, forms, cards, and primary reading surfaces |
| Secondary (30%) | `#F3F5F7` with `#26364A` ink and `#D7DEE6` borders | Page field, grouped requirement rows, secondary controls, and navigation surfaces |
| Accent (10%) | `#C8102E` / `#A30E26` hover | Primary save action, active normal UI emphasis, and keyboard focus ring only |
| Informational verification | `#1E40AF` text, `#DBEAFE` fill, `#93C5FD` border | The dedicated `Needs verification` requirement state and its icon; never use blue alone to communicate that state |
| Destructive | `#B4233C` / `#8D1D32` hover | Clear saved qualification record only |

Accent reserved for: `Save qualifications`, the selected order-control indicator, existing factual source actions, and focus treatment. Do not use accent color to imply a requirement was fulfilled, an option is better, or a result should be chosen.

The verification state always renders the visible text `Needs verification`, a short non-color icon with an accessible name of `Needs verification`, the source date (or `Source date unavailable`), and a direct verification action. The blue fill/border is a redundant cue only. Other non-current requirement states use the same wording and treatment; never substitute a warning color that could imply a negative conclusion.

---

## Interaction and Layout Contract

### Qualification record

- Place an `Your qualifications` card in the signed-in account area and expose the same card from `/programmes` through an `Edit qualifications` action. Both entries edit one account-held record; the programmes entry returns focus to its trigger after closing or saving.
- Begin the card with: `Add only information you want to use here. This is private to your account.` Follow it with: `These details help you check published requirements. They do not decide what you can do.`
- Use five independently optional checkbox groups, each with a concise legend and plain labels: `Diploma or credits`, `Degree`, `Licence or certification`, `Work experience`, and `Military history (optional)`. A student can save none, one, or many entries; completion is never required to browse.
- Present the private note after the structured groups. It is an optional 500-character textarea with a visible counter, `Private note (optional)`, and helper text: `Only you can see this note. Scholar Scout does not read it to sort options.` Never display the note, a snippet, or a derived phrase on a catalogue card, detail page, comparison surface, staff surface, provider surface, URL, analytics field, or browser storage outside the authenticated account record.
- Under the note, provide a separate `Keywords you chose` control. It has an empty text field, `Add keyword` button, and selected-keyword chips with individual 44px `Remove [keyword]` actions. The UI makes no suggested chips, highlighting, autocomplete, or automatic extraction from the note. A keyword enters the lens only after the student explicitly presses `Add keyword`; accept at most 12 keywords, each 40 characters or fewer, and show an inline validation message beside the field. Do not expose a keyword in the URL.
- The Save action writes only after server validation. While saving, retain entered values, disable only duplicate submit actions, and announce `Saving qualifications` through a polite live region. On success announce `Qualifications saved.` On a conflict, preserve the visible unsaved values and offer the documented reload action rather than silently overwriting them.
- `Clear qualifications` is a destructive secondary action. It clears the structured choices, selected keywords, and private note only after an in-context confirmation panel; it never clears shortlist, filters, or comparison choices.

### Catalogue ordering and explanation

- Main catalogue-screen focal hierarchy is fixed: the result list and each card's qualification explanation are the primary reading anchor; `Order opportunities` controls are secondary; source and verification metadata are tertiary. Keep this sequence visually and in reading order, while retaining every source and verification action adjacent to the factual requirement it supports.
- Add a labelled native radio group above the results, after the existing filter summary: `Order opportunities`. Its two 44px options are `Normal catalogue` and `Qualifications first`. Default to `Normal catalogue` on every fresh programmes visit. The selected radio is the only visual selected state; do not use an ambiguous on/off switch.
- Directly below the group, show `Every reviewed opportunity stays in the list. This changes order only.` Keep order selection in page state; do not put the choice, qualifications, note, or keywords into a URL. Existing filters, canonical normal-order route, shortlist, comparison, and alternate-path actions remain unchanged and independent.
- When `Qualifications first` is selected, keep all filtered items visible and sort deterministically: first by descending count of checked, current published requirements; then by presence of one or more student-confirmed keyword connections; then by the established stable public catalogue-ID order. A keyword connection never outranks a checked current published requirement. Empty qualification data produces the established stable order and the inline prompt `Add qualifications to check published requirements.`
- Replace the result summary with an `aria-live="polite"` message after an order change: `Showing [count] reviewed opportunities. [Normal catalogue/Qualifications first] order. Every opportunity is still shown.` Do not animate a result re-order; preserve keyboard focus on the radio that changed it.
- A card in qualifications-first order shows a compact explanation section before its general factual reasons. Its first line is exactly one of: `[count] published requirements checked`, `Keyword connection`, or `No qualification connection yet`. The first line must not be rendered as a rating, percentage, badge of suitability, or outcome prediction.
- For every card, list the specific checked requirement names, not just a count. Each item includes source, source date, fact state, and `Verify [requirement]` action. A checked item means only that a student-declared structured item corresponds to the reviewed published text; it is not a decision or guarantee.
- Show a keyword connection only as `Keyword connection: [student-selected keyword] appears in this reviewed text.` Show the matched reviewed requirement/description and its source/verification action. Never call it a checked requirement.
- Missing, stale, unknown, or conflicting requirement evidence appears in its own informational-blue row: `Needs verification`. Include the available source date and `Verify this requirement`. It does not lower the card, add negative copy, or count as a missing qualification.
- For each un-checked requirement, show a neutral next step: `Check this requirement with the programme.` If reviewed source text documents support, add the support statement immediately after it: `This programme lists [support]. Ask the programme if it is available to you.` If support is not documented, render no support claim.
- Retain all existing choice-preserving actions on each card and corresponding detail/comparison surface: `See all facts and sources`, `Save opportunity`, `Open comparison`, `Alternate routes`, and `Official verification`. The save control's visible label and accessible name are both `Save opportunity`; do not use generic `Save`. Ensure a qualification explanation appears on the detail and comparison views for a lens-ordered card using the same DTO, wording, source, and state as the overview card.

### Responsive and accessible behavior

- At widths below 1024px, place the qualification/order controls above results and stack form groups, explanation rows, and actions in one column. At 1024px and above, retain the existing 280px controls column and fluid results column. No element may cause horizontal page overflow at supported phone and tablet widths.
- Use native `fieldset`/`legend`, checkbox, radio, textarea, button, and link elements. Every field has a visible label, visible focus ring (`focus` token), programmatic error association, and keyboard operation. Chips and expanders identify their exact keyword/requirement in their accessible name.
- Put concise explanation first. Offer `Show details` / `Hide details` only when a card contains more than two requirement rows; use `aria-expanded` and retain details in the DOM when collapsed only if doing so does not create duplicate screen-reader reading. The collapsed summary always includes the count/state and one visible verification action.
- Do not rely on color, icon, position, motion, or hover for meaning. There is no automatic motion in this phase. Loading uses text plus a fixed-height skeleton that does not shift surrounding controls.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Save qualifications` |
| Qualification introduction | `Add only information you want to use here. This is private to your account.` |
| Lens purpose | `These details help you check published requirements. They do not decide what you can do.` |
| Order helper | `Every reviewed opportunity stays in the list. This changes order only.` |
| Checked explanation | `[count] published requirements checked` |
| Keyword explanation | `Keyword connection: [keyword] appears in this reviewed text.` |
| Verification state | `Needs verification` |
| Requirement next step | `Check this requirement with the programme.` |
| Documented-support statement | `This programme lists [support]. Ask the programme if it is available to you.` |
| Empty state heading | `Add qualifications when you are ready` |
| Empty state body | `You can still browse every reviewed opportunity. Add qualifications to check published requirements.` |
| No connection state | `No qualification connection yet` |
| No published requirements state | `No reviewed requirements are listed yet. Verify with the programme.` |
| Loading state | `Loading your saved qualifications…` |
| Save error | `Your qualifications were not saved. Check the highlighted field and try again.` |
| Conflict error | `Your saved qualifications changed somewhere else. Reload, then review and save again.` |
| Destructive confirmation | `Clear qualifications: Clear your saved qualifications, keywords, and private note? This cannot be undone.` |

Copy guardrail: all learner-facing copy must be short, factual, and action-led. It must not label a person or opportunity with a predictive verdict, score, probability, safety judgment, or outcome claim. Do not say that an un-checked, missing, stale, unknown, or conflicting requirement means a student cannot proceed.

---

## UI Considerations

> State coverage is resolved for the qualification form, order controls, explanation rows, and result collection. Empty-state and error-state copy is defined in `## Copywriting Contract` and referenced below.

Applicable state considerations resolved: 25 covered, 3 backstop, 0 unresolved.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Qualification form | ✅ covered | An authenticated student with no saved entries sees the documented `Add qualifications when you are ready` state; browsing remains available and normal ordering remains selected. |
| loading | Qualification form | ✅ covered | The account load renders the documented loading text and fixed-height field skeleton; the catalogue remains usable in normal order. |
| error | Qualification form | ✅ covered | Fetch, validation, save, and conflict errors are inline, associated with the relevant field or save area, preserve entered values, and use the documented recovery copy. |
| partial | Qualification form | ✅ covered | Each of the five structured groups and the note/keyword controls may be blank independently; blank data never becomes a negative result state. |
| long-text | Private note, selected keywords, field errors | ✅ covered | The note is capped at 500 characters; keywords are capped at 12 × 40 characters; wrap text and explicit counters/errors prevent clipping or overflow. |
| empty | Keyword collection | ✅ covered | Render `No keywords chosen yet.` with no suggestion, extraction, or automatic connection. |
| populated | Keyword collection | ✅ covered | Render each explicit keyword as a labelled chip with its own 44px removal action; chips wrap inside the card. |
| overflow | Keyword collection | ✅ covered | Chips wrap to new lines inside a `min-w-0` container; the collection never creates horizontal scrolling. |
| loading | Order controls and lens results | ✅ covered | Keep the current catalogue visible while qualification data loads; disable only the unavailable qualifications-first radio and state why in text. |
| error | Order controls and lens results | ✅ covered | If the lens cannot load, retain normal order, state `Qualifications first is unavailable right now. You can still browse every opportunity.`, and expose a retry action. |
| populated | Order controls | ✅ covered | Both native radio options are always visible, labelled, keyboard-operable, and accompanied by the all-visible helper statement. |
| long-text | Order helper and radio labels | ✅ covered | Labels wrap within the control card and retain 44px targets; no clipped text or icon-only control. |
| loading | Result collection | ✅ covered | Server result loading reserves card height with non-animated skeletons and exposes `Loading reviewed opportunities` text. |
| error | Result collection | ✅ covered | Snapshot-read failure presents a full-width factual fallback with retry/back action; it never substitutes live provider data. |
| empty | Filtered qualification results | ✅ covered | Use the existing documented catalogue empty state. Qualification ordering cannot create an empty result set beyond the active filters. |
| populated | Qualification result collection | ✅ covered | Every filtered reviewed card remains in the DOM/list; only its deterministic position and explanation section change. |
| partial | Requirement explanation rows | ✅ covered | Current checked rows, keyword rows, and blue `Needs verification` rows coexist; incomplete evidence does not become a missing-qualification claim. |
| overflow | Result collection and card actions | ✅ covered | Use `min-w-0`, `break-words`, `flex-wrap`, one-column mobile layout, and stacked actions to prevent horizontal overflow. |
| zero-one-many | Result collection | ✅ covered | Result summary handles 0/1/many grammatically; one card retains full explanation/action spacing and many cards preserve the existing vertical rhythm. |
| long-text | Requirement names, reviewed descriptions, sources | ✅ covered | Requirement/source strings wrap in full; expanded detail uses the same source rows and never hides the only verification action. |
| populated | Explanation summary | ✅ covered | A qualifications-first card always exposes exactly one primary explanation plus specific visible/revealable evidence, source/date/state, support statement when documented, and a verification action. |
| empty | Published requirements on a card | ✅ covered | Show the documented `No reviewed requirements are listed yet. Verify with the programme.` state with the official verification action; do not invent a connection. |
| overflow | Expandable explanation detail | 🧪 backstop | Add a visual/component test with long requirement/source/support text at phone width; it must wrap with no horizontal page overflow and retain its action targets. |
| zero-one-many | Checked requirement rows | ✅ covered | Singular/plural checked copy uses the exact count; zero uses `No qualification connection yet`, and multiple rows initially show two plus an accessible expander. |
| long-text | External verification action names | 🧪 backstop | Add an accessible-name test for a long provider and requirement name; the action remains distinguishable and includes the opening-new-tab context. |
| loading | Save / clear action | ✅ covered | Save announces progress and prevents duplicate submission; clear confirmation remains cancellable and does not alter unrelated student-controlled state. |
| error | Clear action | ✅ covered | Failed clear retains all displayed values, reports a recoverable error beside the action, and does not imply that data was deleted. |
| long-text | Plain-language guidance and support statement | 🧪 backstop | Add a held-out copy/state test that verifies sixth-grade short-first copy remains visible before any optional detail and never becomes a decision label. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — `components.json` is absent and no shadcn initialization was authorized |
| third-party | none | not applicable — no external registry block may enter this phase |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
