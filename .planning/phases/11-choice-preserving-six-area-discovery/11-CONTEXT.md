# Phase 11: Choice-Preserving Six-Area Discovery - Context

**Gathered:** 2026-09-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Give students an accessible, source-first way to browse, filter, save, compare, and verify the reviewed six-area catalogue. This phase consumes the Phase 10 stored public snapshot; it does not publish catalogue data, fetch provider sites, decide eligibility, infer residence, or add application, messaging, referral, or paid-placement flows.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and student-safety rules
- `.planning/PROJECT.md` — six-region catalogue purpose and student-agency constraints.
- `.planning/REQUIREMENTS.md` — Phase 11 requirements `DISC-01`, `DISC-02`, `DISC-03`, and `DISC-04`.
- `.planning/ROADMAP.md` — Phase 11 goal, success criteria, scope boundary, and risk.
- `docs/product-recommendation-governance.md` — permitted factual guidance and prohibited eligibility, outcome, and ranking claims.

### Verified catalogue and presentation boundaries
- `.planning/phases/09-catalogue-foundations-and-source-contracts/09-CONTEXT.md` — frozen regional, evidence, freshness, and coverage contract.
- `.planning/phases/10-curated-import-and-governed-staff-publication/10-CONTEXT.md` — published-snapshot, rights-fallback, and no-live-provider rules.
- `.planning/phases/10-curated-import-and-governed-staff-publication/10-VERIFICATION.md` — verified stored-snapshot read boundary and recovery safeguards.
- `.planning/phases/07.1-futuristic-student-journey-visual-system/07.1-CONTEXT.md` — Space Grotesk and bright red-white-silver, motion-safe presentation decisions.
- `apps/web/lib/catalogue-contract.ts` — controlled catalogue/evidence/freshness vocabulary.
- `apps/web/lib/server/programme-records.ts` — governed learner read seam and stored published-snapshot access.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/programmes/page.tsx` and `apps/web/components/programmes/ProgrammeResults.tsx`: existing browse route, query-string filters, and result composition to evolve rather than replace.
- `apps/web/components/opportunities/OpportunityMatchCard.tsx`: established accessible opportunity-card, source/evidence, shortlist, and official-action presentation seam.
- `apps/web/app/programmes/[id]/page.tsx` and `apps/web/components/programmes/ProgrammeFitPanel.tsx`: detail-route and student-controlled action patterns.
- `apps/web/components/shortlist/ShortlistButton.tsx` and `apps/web/components/shortlist/ShortlistComparison.tsx`: existing save-and-compare behavior that can remain student-controlled.
- `apps/web/lib/server/programme-records.ts`: phase boundary explicitly identifies the stored published snapshot as the Phase 11 public data source.

### Established Patterns
- Server pages obtain governed records; client components own browser interaction and call only internal routes.
- Accessible controls use labeled forms, keyboard-visible focus, and explicit status/error text.
- Scholar Scout visual work uses Space Grotesk, bright red-white-silver tokens, and CSS-only reduced-motion-aware decoration.

### Integration Points
- Evolve the public programmes browse/detail/shortlist surfaces to consume the reviewed Phase 10 snapshot without a learner-time provider request.
- Add focused discovery view models and tests around filters, deterministic ordering, source/status display, comparison, and responsive accessibility.

</code_context>

<specifics>
## Specific Ideas

- The student experience should feel like a mixture of Realtor.com and TikTok: a practical overview first, then an immersive but finite one-opportunity-at-a-time view.
- The app’s Scholar Scout journey visuals tell the transition/new-beginning story; provider pages and opportunity facts remain factual, source-led, and specific to the selected school or training route.

</specifics>

<deferred>
## Deferred Ideas

- Phase 12 owns private qualification highlighting and explanation governance.
- Phase 13 owns provider media display and fuller Scholar Scout transition stories.
- Phase 14 owns sensitive support referrals and military information surfaces.

</deferred>

---

*Phase: 11-Choice-Preserving Six-Area Discovery*
*Context gathered: 2026-09-23*
