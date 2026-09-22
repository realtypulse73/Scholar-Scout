# Phase 8: multi-metro-discovery-coverage - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a public, official-source-only discovery registry for seven peer markets and four peer pathways, with verified nearest-offering fallbacks and dated financial-aid/loan source cards. It is a comparison and verification surface, not a personal financial-advice or eligibility system.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**12 requirements are locked.** See `08-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `08-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):** seven-market registry; four peer pathways; verified nearest fallback; dated official aid/loan cards; public-coordinate ordering; accessibility; source validation; Preview rollout; inherited-gate traceability.
**Out of scope (from SPEC.md):** personal aid determinations/advice, financial and sensitive-data collection, inferred location/geolocation, travel-time/access claims, outcome guarantees, regional exceptions, and waiver of inherited gates.

</spec_lock>

<decisions>
## Implementation Decisions

### Public source-card model
- **D-01:** Use only first-party provider, official government/aid authority, or official registered-apprenticeship-sponsor sources. Every displayed aid/source fact is dated and linked; third-party summaries are never verified facts. — **Reversibility:** costly — changing the source-authority contract would require re-curating every market-pathway record and revising validation/tests.
- **D-02:** Treat degree, trade/skilled-trades, certificate, and apprenticeship as peer discovery categories. A missing local category shows a nearest verified fallback, never an empty category alone.
- **D-03:** “Nearest” is Haversine straight-line distance from the selected market's published centre to a provider's public coordinate; tie-break source freshness, then name. It is visibly outside-market when applicable and approximate map distance, never travel time/access assurance. — **Reversibility:** costly — published fallback order and source data depend on this deterministic contract.
- **D-04:** Aid cards separate published conditions, reported current availability, current-confirmation-needed, and not-assessed. Revalidate every 30 days during an active cycle and immediately after an official change; overdue records downgrade rather than remaining current.
- **D-05:** Keep government-imposed loan restrictions only as dated official records: authority, jurisdiction, programme/pathway scope, restriction/condition type, effective/award-cycle dates when published, official URL, checked date, and change status. Use the same 30-day/on-change downgrade rule, direct official link, and human referral. Never infer eligibility, availability, or funding. — **Reversibility:** costly — source-schema and validation changes would require re-curating restriction records.

### Privacy-first public guidance
- **D-06:** Phase 8 adds no personalized advisor inputs. Public guidance uses selected market/pathway and vetted official source cards only; it requires no sign-in or profile creation and does not infer additional financial information for authenticated students. — **Reversibility:** one-way — adding collection later requires a separate consent, data lifecycle, security, and provider-boundary design rather than silently extending this public contract.
- **D-07:** Do not collect, accept, persist, export, log, or reuse for marketing any financial identifier/credential, tax/income/asset, bank/card/loan, precise address, protected, immigration, health/disability, or passive location/behaviour data for this feature.
- **D-08:** For personal aid eligibility, residency/immigration, income/tax, debt/default/appeal, or conflicting/stale source questions, show the official authority/provider link and instruct the student to speak with that office or a qualified advisor; do not automate an answer.

### Validation and gates
- **D-09:** Preserve the Phase 1 and Phase 5 human/external evidence gates as independently unpassed until their required evidence exists. Phase 8 Preview/human review adds to but never substitutes for those gates.
- **D-10:** Include keyboard, screen-reader, Unicode, visible source-date, unknown/stale, and outside-market fallback states in automated and Preview validation.

### the agent's Discretion

- Choose data-module and component composition that reuses the existing TypeScript domain-library and accessible directory patterns, provided it preserves the locked source, privacy, and ordering contracts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and product governance
- `.planning/phases/08-multi-metro-discovery-coverage/08-SPEC.md` — locked requirements, source/freshness model, privacy boundary, acceptance tests, and prohibitions.
- `.planning/REQUIREMENTS.md` — `PROD-07` scope and milestone traceability.
- `.planning/ROADMAP.md` — Phase 8 goal/dependencies and inherited-gate context.
- `docs/product-recommendation-governance.md` — source/date disclosure, choice preservation, no eligibility/admission claims, and human-referral requirements.

### Existing implementation references
- `apps/web/lib/programmes.ts` — current pathway taxonomy and labels.
- `apps/web/lib/western-new-york.ts` — existing source-dated directory record pattern.
- `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx` — accessible directory UI pattern.
- `apps/web/app/api/advisor-chat/route.ts` — current advisor safety instructions and complex-financial handoff baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/programmes.ts`: `ProgrammePathway` and `PROGRAMME_PATHWAY_LABELS` already include trade/vocational, certificate, and apprenticeship values.
- `apps/web/lib/western-new-york.ts`: source-checked record and deterministic ranking pattern is a bounded local reference.
- `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx`: client-side accessible filter/card composition can inform the regional directory presentation.

### Established Patterns
- Domain validation and ranking live in small pure TypeScript modules under `apps/web/lib/`, with Jest coverage under `apps/web/__tests__/lib/`.
- App Router pages compose server-supplied records into client components; source links and failure states remain visible in the UI.
- Advisor route instructions already prohibit aid guarantees and require qualified-human referral for complex financial questions.

### Integration Points
- A governed Phase 8 registry should remain a domain-data boundary rather than extend student profile persistence.
- Discovery pages/components should consume only public registry records; advisor changes must consume no new profile fields or provider-supplied personal data.

</code_context>

<specifics>
## Specific Ideas

- Use direct official links and source dates so students can verify with the programme/provider or official aid authority.
- Keep a clear visible distinction between “outside your selected area,” “Current confirmation needed,” and “not assessed.”

</specifics>

<deferred>
## Deferred Ideas

- Any personalized advisor-data feature — needs a separate privacy/governance decision covering consent, minimization, retention/deletion/export, security/access, and referral handoff before implementation.

</deferred>

---

*Phase: 08-multi-metro-discovery-coverage*
*Context gathered: 2026-08-29*
