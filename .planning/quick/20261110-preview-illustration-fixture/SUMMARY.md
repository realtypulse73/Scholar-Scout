# Preview-only original illustration fixture

## Result

Two original Scholar Scout illustrations now back a tightly scoped, Preview-only Phase 13 browser fixture. The fixture adds no provider claim, institution record, admissions statement, or production-visible card.

## Safety boundaries

- It appears only when `VERCEL_ENV=preview` and `SCHOLARSCOUT_PHASE13_UAT_FIXTURE=true` are both present.
- Production and ordinary Preview responses return the stored catalogue snapshot unchanged.
- Both cards say `Preview test fixture` and use the existing `AI-generated illustration — not an official campus photograph` disclosure.
- The fixture uses the same published-record `illustration` projection as approved original content. A later reviewed provider-approved or Scholar Scout-owned asset replaces it through the ordinary media path without a data-model migration.
- Images validate visual explorer, source-first detail, and static fallback presentation. They are not video and therefore do not close the separate pause or reduced-motion video rehearsal.

## Original assets

- Applied health learning setting: original Scholar Scout illustration, generated as a generic learning lab with no logo, text, or identifiable campus.
- Technology systems learning setting: original Scholar Scout illustration, generated as a generic workshop with no logo, text, or identifiable campus.

## Validation

- Focused Preview fixture test: passed (4 assertions)
- Web TypeScript check: passed
- Web lint: passed
- Whitespace check: passed
