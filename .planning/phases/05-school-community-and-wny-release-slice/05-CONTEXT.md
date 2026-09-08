# Phase 5: School, Community, and WNY Release Slice - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 releases the existing Western New York directory, school lockers, peer discovery, public notes, and opt-in inbox requests as one accessible, source-linked, privacy-protected, moderated slice. It preserves the prior security and persistence boundaries while adding the required community safety lifecycle; it does not expand into a social network or Phase 6 end-to-end release work.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**4 requirements are locked.** See `05-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `05-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):** Release validation and accessibility coverage for the existing WNY directory and school lockers; deterministic, preference-only peer matching; server validation and one shared five-per-hour signed-in-student submission limit; author-safe public representations; reporting, immediate hiding, authorized staff review, restore, and removal; and automated coverage for the resulting source, privacy, moderation, rate-limit, and state-transition behavior.

**Out of scope (from SPEC.md):** A social network, direct messaging system, follow graph, uploader-creation flow, staff freshness certification, source audits, potential/admissions ranking, moderation analytics or notifications, and Phase 6 core-journey release validation.

</spec_lock>

<decisions>
## Implementation Decisions

### Discovery evidence and empty states
- **D-01:** Use a shared, prominent verification notice at the top of both discovery surfaces and retain a contextual `Verify before applying` panel beside each WNY result or school-locker decision point. The panel points to primary sources and practical next checks; it must not call information “checked,” current, independently verified, or an admission/safety conclusion.
- **D-02:** Empty WNY/school-locker states remain accessible, explain that no applicable result or programme is available, and retain the verification guidance rather than silently rendering nothing.

### Peer-match presentation
- **D-03:** Retain detailed peer-match cards with a public display name, programme, one plain-language compatibility reason, school-locker link, and the existing opt-in inbox action. Order eligible peers stably by public display name; do not surface sensitive profile data or inferred potential.
- **D-04:** Use a clear no-match/onboarding call to action rather than substitute unrelated uploaders or promise an admissions outcome.

### Community submission safeguards
- **D-05:** Put a brief explanation near both public-note and inbox-request forms that the two actions share a limit of five signed-in submissions per rolling hour. Server enforcement is authoritative; do not show an exact remaining-submission counter.
- **D-06:** Continue to give an immediate, safe form-level error for rejected content or a reached limit, without relying on browser state to enforce the quota.

### Reporting and staff resolution
- **D-07:** Put a visible Report action on public community items. Reporting immediately removes the target from public reads, is idempotent, and gives the reporter a private confirmation without exposing moderation details.
- **D-08:** Provide a focused, staff-gated moderation queue for pending items. A freshly authorized staff member can restore or remove an item; do not place this workflow in the already large programme-admin manager. — **Reversibility:** costly — moving it later would change staff operational routes, UI navigation, and moderation-record handling.

### Agent discretion
- Select the smallest compatible server-side quota, public DTO, moderation-state, audit, and route contracts that satisfy the locked specification and preserve Phase 2 identity/staff controls and Phase 4 persistence guarantees.
- Choose exact accessible wording, component composition, and test fixtures as long as they preserve the decisions above and all SPEC.md prohibitions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and governance
- `.planning/phases/05-school-community-and-wny-release-slice/05-SPEC.md` — locked Phase 5 requirements, prohibitions, edge coverage, and acceptance criteria; MUST read first.
- `.planning/ROADMAP.md` — authoritative Phase 5 goal, dependency, success criteria, and release-slice risk.
- `.planning/REQUIREMENTS.md` — PROD-01, PROD-02, PROD-03, and milestone definition of done.
- `.planning/PROJECT.md` — product constraints and the separate-validation requirement for this feature cluster.
- `docs/product-recommendation-governance.md` — permitted matching signals, consent limits, explanation requirements, and prohibited recommendation claims.

### Prior delivery constraints
- `.planning/phases/04-incremental-durable-persistence-boundaries/04-CONTEXT.md` — bounded persistence and conflict-safety decisions that community writes must retain.
- `.planning/phases/03-administrative-and-data-operations-correctness/03-CONTEXT.md` — current staff authorization and operational recovery constraints.
- `PROJECT-INDEX.md` — canonical routing for Scholar Scout sources of truth.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx`: existing ranked cards, source links, and per-card verification panel to extend safely.
- `apps/web/lib/western-new-york.ts`: deterministic access scoring already breaks equal-score ties by institution name.
- `apps/web/components/peer-community/PeerCommunity.tsx` and `apps/web/lib/peer-guides.ts`: established detailed peer cards, no-match call to action, and declared-preference matching seam.
- `apps/web/components/campus-community/CampusNoteBoard.tsx` and `apps/web/components/campus-community/UploaderContactPanel.tsx`: existing signed-in forms and inline status/error treatment.
- `apps/web/lib/server/active-staff.ts` and the existing admin route pattern: fresh server-side staff authorization seam for moderation actions.

### Established Patterns
- Server routes derive identity from NextAuth sessions and validate before persistence; browser-supplied identity or role must not select ownership or staff capability.
- Reusable UI uses `Card`, `Badge`, `Button`, inline `role="status"` feedback, and Tailwind accessibility/focus conventions.
- Persisted operations use Phase 4 bounded/CAS-safe server-store patterns rather than unguarded whole-document mutation.

### Integration Points
- `apps/web/app/western-new-york/page.tsx` and `apps/web/app/schools/[slug]/page.tsx` compose the two discovery surfaces.
- `apps/web/app/peer-community/page.tsx` resolves the student profile and feeds matches to the peer UI.
- `apps/web/app/api/campus-notes/route.ts` and `apps/web/app/api/peer-connections/route.ts` are the shared-submission and public-representation boundary.
- The staff admin area is the appropriate entry point for a focused moderation queue, separate from `ProgrammeAdminManager`.

</code_context>

<specifics>
## Specific Ideas

- The user selected the practical, contextual choice in every area: shared plus per-result verification, detailed stable peer cards, an explanation-only shared quota, and an immediate-hide report flow with a focused staff queue.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-school-community-and-wny-release-slice*
*Context gathered: 2026-08-29*
