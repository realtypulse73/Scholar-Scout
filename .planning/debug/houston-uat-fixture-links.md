---
status: resolved
trigger: "The local Programmes preview exposes the Houston Phase 11 UAT community-pathway fixture with example.edu outbound links."
created: 2026-11-11
updated: 2026-11-11
---

# Houston UAT Fixture Link Governance

## Symptoms

- Expected: a real verified provider record has a clearly labelled official external-source link; a fixture has no promotional or placeholder outbound link.
- Actual: `phase11-uat-community-pathway` is rendered from the local Phase 11 fixture snapshot and its generic official-verification control uses `https://example.edu/scholar-scout-phase-11-uat`.
- Reproduction: open local `/programmes` with the Greater Houston community-college and hybrid filters.

## Current Focus

- hypothesis: The discovery model maps every snapshot source URL to an official provider action without recognizing the record's explicit local-fixture claim boundary.
- test: Add fixture-aware projection and UI coverage that retains local disclosure/detail access while omitting outgoing placeholder links.
- expecting: The fixture remains visible as test content, offers no external official-provider action, and real records retain their accessible new-tab official links.
- next_action: Complete. The fixture is explicitly disclosed and has no outbound placeholder links.

## Evidence

- timestamp: 2026-11-11
  finding: `apps/web/data/scholarscout-data.json` labels the record "Local Phase 11 UAT fixture — not a real provider record" and says it must be verified before any decision.

## Eliminated

- hypothesis: The Houston record can be truthfully matched to a real provider based on its current fixture fields.
  reason: It has no provider identity or verified programme relationship; attaching a real college would invent affiliation.

## Resolution

- root_cause: The public discovery projection treated every stored `sourceUrl` as an official-provider action. The Phase 11 local fixture was therefore rendered with its intentionally non-real `example.edu` source as a promotional-looking external link.
- fix: Explicitly bounded fixture records now project a fixture notice and no `officialVerificationUrl`. Cards, details, comparisons, and qualification evidence retain local factual/disclosure views but suppress outbound fixture-source links. Non-fixture records retain labelled official external links with their existing new-tab safeguards.
- verification: Focused discovery/card/detail/comparison Jest coverage passed (41 tests), followed by web typecheck, lint, and `git diff --check`.
- files_changed: `apps/web/lib/catalogue-discovery.ts`; `apps/web/components/catalogue/CatalogueOpportunityCard.tsx`; `apps/web/components/catalogue/CatalogueFocusView.tsx`; `apps/web/components/catalogue/CatalogueComparison.tsx`; `apps/web/components/qualifications/QualificationExplanation.tsx`; focused catalogue tests.
