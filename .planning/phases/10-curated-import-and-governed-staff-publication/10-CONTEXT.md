# Phase 10: Curated Import and Governed Staff Publication - Context

**Gathered:** 2026-09-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable active authorized staff to stage bounded, source-backed catalogue candidates, review them, and publish a deterministic weekly public snapshot. The phase protects the existing public catalogue from invalid candidates, live provider dependencies, rights uncertainty, and concurrent edits. It does not build learner discovery screens, provider-page media display, qualification ranking, sensitive referrals, or provider scraping.

</domain>

<decisions>
## Implementation Decisions

### Staff roles, review, and automated checks
- **D-01:** Use three active staff capabilities: an editor can create, revise, correct, and resubmit candidate records; a reviewer can review regular-staff candidates and make authorized emergency corrections; an administrator can make the final weekly release and may self-publish an administrator-owned candidate. Every privileged action remains restricted to active authorized staff and creates minimal audit evidence. — **Reversibility:** costly — changing the role/capability contract later requires migrating authorization rules, audit meanings, and staff operations.
- **D-02:** A regular staff candidate requires a different active reviewer before it can enter an approved release batch. An administrator-owned candidate may be approved for publication by its administrator only after the automated checklist passes.
- **D-03:** The automated checklist must gate every approval, weekly release, and emergency correction. It verifies the required source, material facts/evidence, freshness state, claim wording boundary, regional boundary relationship, and media-rights metadata. Human reviewers use the passing checklist as their review basis; the system must not present a pass as proof of a source's real-world truth.
- **D-04:** A checklist failure leaves the candidate private as a draft, lists exact correctable failures, preserves the creator's valid work, and permits correction and resubmission. A post-approval edit invalidates that approval and requires a new review.

### Curated intake and weekly snapshot publication
- **D-05:** Support both existing individual staff editing for corrections and a bounded, structured candidate-import file for small batch intake. Imports must only stage validated drafts; they never fetch provider sites, write directly to the learner read model, or publish automatically. — **Reversibility:** costly — changing the candidate-file contract later requires compatibility handling for staff tooling and source fixtures.
- **D-06:** Limit a weekly candidate batch to 25 changed records. The planner may choose a lower safe limit if current conditional-write tests establish a stricter bound. This is a safety boundary for the existing whole-document store, not a promise of unlimited catalogue capacity.
- **D-07:** Publish weekly only when an administrator explicitly reviews the approved batch and presses Publish. The release creates a named, deterministic catalogue snapshot and manifest. Learner-facing reads use only that published snapshot through the governed catalogue boundary; they must not scrape, aggregate, or depend on a live provider.
- **D-08:** Keep every replaced public snapshot internally with its manifest and minimal audit history so an administrator can restore it. Previous versions are not learner-browseable by default.

### Conflict repair and emergency corrections
- **D-09:** On a stale revision conflict, show the current and attempted record values side by side and let staff select what to keep. If they choose an older value over a newer value, require a short reason in the audit record.
- **D-10:** An active authorized reviewer may make an urgent correction outside the weekly schedule. It must become a new named emergency snapshot, pass the automated checklist, record the reason, and retain the prior snapshot for restoration.
- **D-11:** If a record fails the final release check, exclude and quarantine that record with its correction list while publishing only the other passing records. A missing or invalid source, claim, boundary, or rights requirement can never be converted into a public `needs confirmation` substitute.

### Media-rights metadata
- **D-12:** Provider media is publishable only when the record stores documented Scholar Scout ownership, a licence, provider approval, or an approved embed, plus the source and any expiry date. When that proof does not exist, publish factual text with official source links instead. — **Reversibility:** costly — loosening this contract would change the rights-safe media boundary consumed by later provider pages.
- **D-13:** Before every weekly release and emergency correction, automatically recheck stored media-rights status. Expired, revoked, or uncertain rights immediately remove the media and use the factual text-and-source fallback.
- **D-14:** Incomplete media-rights proof blocks media only, not an otherwise valid factual provider record.

### Audit history
- **D-15:** Authorized staff can inspect concise per-record and per-snapshot audit history: actor, staff capability, action, timestamp, outcome, version, required reason when applicable, and correction/review status. Audit views must not expose secrets, tokens, learner data, or provider-private information; learners do not receive this operational history.

### the agent's Discretion
- Choose the exact safe structured import representation, manifest schema, role configuration shape, and staff UI composition while preserving the locked lifecycle and no-live-provider boundary.
- Use existing conditional revision and minimal-audit patterns; do not add a database, CMS, hosted search, or unbounded bulk migration for this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and governance
- `.planning/PROJECT.md` — six-region catalogue purpose, safety boundaries, and incremental-persistence constraint.
- `.planning/REQUIREMENTS.md` — Phase 10 requirements `EVID-03`, `EVID-04`, `PUB-01`, `PUB-02`, and `PUB-03`.
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria, scope boundary, and risk.
- `docs/product-recommendation-governance.md` — allowed factual discovery behavior and prohibited eligibility/outcome claims.

### Prior catalogue contract
- `.planning/phases/09-catalogue-foundations-and-source-contracts/09-CONTEXT.md` — frozen six-region, source-first, freshness, coverage, and no-fabrication decisions.
- `apps/web/lib/catalogue-contract.ts` — controlled region/pathway, fact-evidence, freshness, card-fact, and validation contracts that imports and release validation must respect.
- `apps/web/lib/catalogue-fixtures.ts` — controlled six-region fixture and explicit coverage-matrix examples; not a provider inventory.

### Existing governed publication boundary
- `apps/web/lib/admin-programmes.ts` — current draft validation, publication/readiness, source evidence, and revision-conflict presentation patterns.
- `apps/web/lib/server/programme-records.ts` — existing governed public-read merge and conditional programme-record mutation boundary.
- `apps/web/lib/server/data-store.ts` — persistence port, programme audit storage, snapshot import/restore seams, and conditional-write constraints.
- `apps/web/lib/server/active-staff.ts` — active staff authorization boundary that must remain the privileged-action entry point.
- `apps/web/app/api/admin/programmes/route.ts` — staff-only admin API route and safe conflict response pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/lib/catalogue-contract.ts`: strict controlled vocabulary and source/freshness validators provide the candidate and snapshot validation boundary.
- `apps/web/lib/admin-programmes.ts`: draft preparation, publication-readiness checks, and conflict-display helpers can be extended rather than replaced.
- `apps/web/lib/server/programme-records.ts`: `getGovernedProgrammes()` is the existing learner read seam and its revision-conflict error is the starting point for conflict-safe publication.
- `apps/web/lib/server/data-store.ts`: carries programme records, audit events, restore/import helpers, and adapter-level conditional writes that the new bounded snapshot lifecycle must use safely.
- `apps/web/lib/server/active-staff.ts`: existing per-request active authorization/audit entry point.

### Established Patterns
- Finite TypeScript unions and pure validators model evidence state and fail closed on invalid inputs.
- Privileged routes authorize before parsing request data or accessing the store.
- Public governed records are server-side and merge persisted published records with seed data by stable ID.
- Existing writes use revision conflicts rather than silent retries or last-write-wins replacement.

### Integration Points
- Add candidate, review, manifest, and snapshot lifecycle models beside the Phase 9 catalogue contract without making the current public route fetch a provider.
- Extend the governed records server boundary and staff routes with explicit roles/capabilities, candidate staging, final publish, restore, and emergency-release operations.
- Keep existing programme management usable for individual corrections while separating new bounded import and snapshot controls into focused route/UI modules rather than expanding an already broad admin component.

</code_context>

<specifics>
## Specific Ideas

- Staff need a clear, automated evidence checklist rather than a vague manual approval process.
- Weekly releases make catalogue updates predictable, while checked emergency releases handle serious corrections.
- When an older value wins a merge, the reason needs to be visible in staff audit history.
- Media uncertainty should never block truthful text-and-source information from reaching a learner.

</specifics>

<deferred>
## Deferred Ideas

- Phase 11 owns learner-facing six-area browsing, filtering, comparing, and source/status displays.
- Phase 13 owns provider-media display, accessibility, and transition-story experiences; this phase stores and gates only the rights metadata.
- Phase 15 owns the sustainable six-area coverage/freshness operation and release gate.

</deferred>

---

*Phase: 10-Curated Import and Governed Staff Publication*
*Context gathered: 2026-09-22*
