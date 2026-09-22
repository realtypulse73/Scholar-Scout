# Phase 9: Catalogue Foundations and Source Contracts - Context

**Gathered:** 2026-09-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the deterministic, source-first data foundation for a six-area catalogue: regional boundaries, controlled pathway and source vocabulary, evidence and freshness states, and representative fixtures. This phase defines truthful catalogue facts and visible uncertainty; it does not build live provider integrations, personalized ranking, sensitive referrals, military recruitment flows, or a public discovery interface.

</domain>

<decisions>
## Implementation Decisions

### Local coverage and pathway inventory
- **D-01:** Define the local-coverage focus around the downtown area of each of the six approved regional areas, using a ten-mile radius. The catalogue must prioritize two- and four-year colleges, technical schools, trade certificates, and employer-paid training, while also including major universities.
- **D-02:** Model employer-paid training as a distinct pathway category, separate from certificate and technical-school programmes. It must show the taught skill and provider-published trainee pay. If a job after training is not explicitly guaranteed, the record must plainly say so and must not imply a salary or employment promise.
- **D-03:** Retain all approved pathway classes as browseable. A later phase may rank them using only voluntary, ordinary qualifications such as a GED, credits, licence, or work experience; it must not hide options or make an eligibility, admission, enlistment, funding, salary, placement, or outcome determination.

### Evidence, uncertainty, and freshness
- **D-04:** A government-confirmed programme may appear when its provider website is unclear or outdated, but it must have a neutral caution marker such as `Confirm details`, a visible source, and a visible date. That marker communicates uncertainty without judging programme quality.
- **D-05:** Present verified local choices first. When more unverified listings exist, present them in a clearly separated load-more area. Sparse categories may still be shown, but every verification state must be unmistakable.
- **D-06:** Permit regional-boundary definitions to be up to two years old. Require source review within six months for fast-changing facts such as programme cost, requirements, trainee pay, availability, and participation policies. — **Reversibility:** costly — changing the policy later requires reclassifying snapshot evidence and test fixtures.
- **D-07:** Require an official source before showing either a re-entry support or a participation restriction. When a policy is unclear or unpublished, show a neutral instruction to ask the provider directly rather than inventing or inferring a conclusion.

### Decision-focused record information
- **D-08:** The catalogue record contract must support first-view facts that help an ordinary person decide what to explore: location, pathway type, skill taught, training payer, cost or tuition, verification status, duration, and in-person/online/hybrid delivery. Sensitive support selections remain outside cards and ranking.

### the agent's Discretion
- Choose the deterministic technical representation for each downtown anchor and the ten-mile boundary calculation, provided it is documented and does not replace the six official regional-boundary records.
- Define controlled vocabulary names and fixture shape consistent with existing TypeScript conventions, provided the six approved pathway classes and visible evidence states are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and product governance
- `.planning/PROJECT.md` — six-area milestone scope, non-negotiable student-control and privacy boundaries.
- `.planning/REQUIREMENTS.md` — Phase 9 requirements `REG-01`, `REG-02`, `REG-03`, `EVID-01`, `EVID-02`, and `EVID-05`.
- `.planning/ROADMAP.md` — Phase 9 goal, scope boundary, success criteria, and delivery order.
- `docs/product-recommendation-governance.md` — permitted discovery/ranking signals and prohibited eligibility/outcome claims.

### Research and source contracts
- `.planning/research/SUMMARY.md` — approved source-first catalogue direction, six-area boundary distinction, and freshness/safety gaps.
- `.planning/research/STACK.md` — recommended controlled record fields, source authority ladder, and no-live-aggregation boundary.
- `.planning/research/RESEARCH-PLAN.md` — regional research questions and primary-source plan.
- `.planning/research/PITFALLS.md` — stop-ship safeguards for stale facts, fake coverage, claims, and source handling.

### Existing catalogue boundaries
- `apps/web/lib/programmes.ts` — current Programme domain types and seed-catalogue conventions.
- `apps/web/lib/admin-programmes.ts` — existing publication, evidence, and validation patterns.
- `apps/web/lib/server/programme-records.ts` — governed programme merge and revision-conflict boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/programmes.ts`: existing `Programme` types, controlled pathways, evidence states, source checks, and normalizers provide the migration seam for the new catalogue contract.
- `apps/web/lib/admin-programmes.ts`: existing draft validation and publication-readiness logic provide patterns for source-backed records.
- `apps/web/lib/server/programme-records.ts`: `getGovernedProgrammes()` merges seed and published records and is the existing public-read boundary.

### Established Patterns
- Strict TypeScript unions and validators represent finite domain states.
- Server-only governed-record access keeps public pages from reaching persistence adapters directly.
- Published staff records supersede seed data by stable record ID and use conditional revision handling.

### Integration Points
- Phase 9 should extend the governed catalogue/domain boundary and its tests first. Later discovery pages must consume the approved public read model instead of performing learner-facing source aggregation.

</code_context>

<specifics>
## Specific Ideas

- Spotlight lesser-celebrated post-secondary routes: junior/community colleges, technical schools, trade certificates, and paid employer training, without excluding major universities.
- Employer-paid training needs its own factual classification so a student can distinguish it from tuition-charging programmes.
- Honest caution markers should feel neutral and informative, not punitive or like a quality rating.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 12:** Rank all visible options using only voluntarily supplied ordinary qualifications. A GED and missing test/GPA information can affect a requirements-to-verify explanation, but never make a final eligibility decision or suppress an option.
- **Phase 14:** Offer an optional, private, local-only support question for people affected by the criminal justice system. It must not change ranking or be disclosed to providers.
- **Phase 14:** Add neutral military-information pathways for skills such as drones or engineering using official sources and local human contacts. They must avoid recruitment pressure, eligibility determinations, and personal pay promises.
- **Visual-system follow-up:** Each Scholar Scout life-transition scene should change the depicted person's clothing between before and after frames, with attire suited to the new learning or work setting rather than repeating the same outfit.

</deferred>

---

*Phase: 9-Catalogue Foundations and Source Contracts*
*Context gathered: 2026-09-22*
