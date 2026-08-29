# Phase 5: School, Community, and WNY Release Slice — Specification

**Created:** 2026-08-29  
**Ambiguity score:** 0.08 (gate: ≤ 0.20)  
**Requirements:** 4 locked

## Goal

Students can use the existing Western New York directory, school lockers, peer matching, public notes, and opt-in inbox requests as one accessible, source-linked, privacy-protected, and moderated release slice.

## Background

The codebase already has a source-linked Western New York directory and deterministic access-priority ranking (`apps/web/lib/western-new-york.ts`), school lockers (`apps/web/app/schools/[slug]/page.tsx`), peer matching (`apps/web/lib/peer-guides.ts`), public notes, and opt-in inbox requests. The current community routes let signed-in users submit content and validate basic length/contact rules, but public reads are unauthenticated, no server-side rate limit exists, and there is no report, immediate-hide, staff-review, or authorized-removal path. Existing source labels include a public “checked” claim, which exceeds the selected release evidence standard.

## Requirements

1. **Source-linked WNY and school discovery**: The WNY directory and each school locker must present their existing programme/institution information with usable accessible states, primary source links, and a visible “verify before applying” notice.
   - Current: The WNY directory has static source links and access-priority logic; school lockers display governed programmes, but their release behavior, empty states, and evidence language are not validated as a release slice.
   - Target: Both discovery surfaces make available information and source links usable, show an explicit verification prompt, render an accessible no-results/no-programmes state where applicable, and retain deterministic WNY tie ordering by institution name.
   - Acceptance: Automated tests cover a WNY source-link/verification state, equal-score alphabetical ordering, and an accessible empty school-locker/directory state; rendered public copy contains a visible “verify before applying” prompt.

2. **Bounded peer discovery**: Peer matching must use only a student’s declared pathway interests and practical preferences, show an accessible no-match path, and show matched uploaders in a stable public-display-name order.
   - Current: `getCampusUploaderMatches` filters against onboarding pathway, interests, and online preference; the interface has a no-profile call to action, but matching/release behavior is only lightly unit-tested.
   - Target: The release slice has deterministic matching from the permitted inputs only, a safe empty/no-match state, and no dependency on sensitive support data, engagement metrics, or inferred potential.
   - Acceptance: Tests prove a matching student receives only compatible peers, an absent or non-matching profile renders the safe call to action, and equally eligible peers appear in stable display-name order.

3. **Safe community submissions**: Public notes and opt-in inbox requests must be server-validated and share a limit of five submissions per signed-in student per rolling one-hour window; the public representation must be author-safe.
   - Current: Both POST routes require a session and validate non-empty bodies up to 500 characters plus simple contact detection, but lack a server-side quota and have no release-level author-safe representation contract.
   - Target: Invalid, blank, over-limit, or contact-bearing submissions are rejected server-side; the combined notes/inbox quota permits at most five submissions in an hour per signed-in student; Unicode content is handled without bypassing the published length/contact protections; public responses omit author identity and contact data.
   - Acceptance: Route/integration tests prove server rejection for invalid submissions, the sixth combined submission in an hour is rejected, public records omit author IDs/contact information, and ordinary Unicode content cannot bypass the text validation boundary.

4. **Fail-safe moderation lifecycle**: A report must immediately hide the reported community item, create at most one review item for that report target, and permit only authorized staff to restore or remove it.
   - Current: Notes are immediately public after posting and no report, review, staff moderation, hide, restore, or removal capability exists.
   - Target: A report changes the item to a non-public pending-review state before it can be returned through public reads; repeated reports are idempotent; a report racing with publication leaves the content hidden; an authorized staff member can resolve the case by restoring or removing it.
   - Acceptance: Route/integration tests prove public reads omit a reported item immediately, duplicate reports create one review item, concurrent publish/report yields a hidden item, and non-staff restore/removal requests are denied while authorized staff resolution succeeds.

## Boundaries

**In scope:**

- Release validation and accessibility coverage for the existing WNY directory and school lockers.
- Release validation and deterministic, preference-only behavior for existing peer matching.
- Server validation, the shared five-per-hour signed-in-student community submission limit, and safe public representations for public notes and opt-in inbox requests.
- Reporting, immediate hiding, authorized staff review, restore, and removal for community content.
- Automated tests for source/decision, privacy, moderation, rate-limit, and state-transition behavior in this release slice.

**Out of scope:**

- A new social network, direct-message system, follow graph, or public uploader creation flow — this phase validates and protects the five existing experiences.
- Staff freshness certification, periodic source audits, or a claim that listings are current/verified — the approved standard is source links plus a visible verification prompt.
- Ranking students or programmes from sensitive attributes, engagement metrics, or predicted outcomes — prohibited by product recommendation governance.
- Moderation analytics, queue optimization, notifications, or scale operations — these are future product expansion work (PROD-06).
- Core discovery, onboarding, shortlist, recommendation, and simulation end-to-end release validation — Phase 6 owns PROD-04 and the full release journey.

## Constraints

- Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation.
- Community identity and staff authority must be derived server-side; browser-provided identity/role fields cannot authorize a write, review, restore, or removal.
- The public information standard is source-linked information plus a visible “verify before applying” notice. It must not imply that programme facts, policies, admissions, transit, support availability, or campus conditions are current or independently verified.
- Peer discovery remains a choice-preserving discovery aid, not an admissions decision or potential assessment.
- The five-per-hour quota applies to the combined total of public-note and inbox-request submissions for one signed-in student.

## Acceptance Criteria

- [ ] WNY directory and school locker tests prove source links and a visible “verify before applying” notice, accessible empty states, and alphabetical WNY ordering for equal access scores.
- [ ] Peer matching tests prove it depends only on declared pathway interests and practical preferences, gives a safe no-match state, and uses stable display-name ordering.
- [ ] Public-note and inbox-request routes reject invalid, blank, over-limit, or contact-bearing input on the server and reject a sixth combined submission by one signed-in student within an hour.
- [ ] Public community API responses omit account IDs, email addresses, phone numbers, social handles, and other author contact details.
- [ ] Reporting immediately removes the target from public reads; repeated/racing reports leave it hidden and create no duplicate review item.
- [ ] Only authorized staff can restore or remove a reported item; non-staff attempts receive an authorization denial.
- [ ] Public WNY/school copy makes no claim that information is current or independently verified, predicts admission, or rates campus safety.

## Edge Coverage

**Coverage:** 12/12 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| adjacency | R1 | ⛔ dismissed | Directory records do not merge or collide; there is no adjacency behavior to expose. |
| empty | R1 | ✅ covered | Empty WNY/school results render an accessible no-results/no-programmes state with the verification prompt. |
| encoding | R1 | 🧪 backstop | Held-out test covers Unicode institution/source text and source-link rendering. |
| ordering | R1 | ✅ covered | Equal access scores sort alphabetically by institution name. |
| adjacency | R2 | ⛔ dismissed | Peer records do not merge or collide; matching is a membership decision. |
| empty | R2 | ✅ covered | Missing or non-matching profiles receive the safe onboarding/no-match path. |
| encoding | R2 | 🧪 backstop | Held-out test covers Unicode public display names and topic text. |
| ordering | R2 | ✅ covered | Eligible peers are ordered by public display name. |
| empty | R3 | ✅ covered | Blank/whitespace submissions are server-rejected. |
| encoding | R3 | ✅ covered | Text validation applies to Unicode content and contact-detail protection remains enforced. |
| idempotency | R4 | ✅ covered | Duplicate reports leave the item hidden and create one review item. |
| concurrency | R4 | ✅ covered | A publish/report race resolves to a hidden public state. |

## Prohibitions (must-NOT)

**Coverage:** 4/4 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| MUST NOT expose an author account ID, email address, phone number, social handle, or other contact detail in a public community representation. | R3 | resolved | test — route/representation assertions; descriptor intentionally deferred to planning. |
| MUST NOT use sensitive attributes, activity/engagement metrics, or inferred admission potential to match students with peer content. | R2 | resolved | test — pure matching fixtures assert permitted inputs only; descriptor intentionally deferred to planning. |
| MUST NOT claim source-linked WNY or school information is current or independently verified, predict admission, or rate a campus’s safety. | R1 | resolved | judgment — public-copy and governance review. |
| MUST NOT return reported content to public reads or allow a non-staff actor to restore or remove it. | R4 | resolved | test — route/state-transition assertions; descriptor intentionally deferred to planning. |

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.96 | 0.75 | ✓ | All five existing experiences and release outcome are locked. |
| Boundary Clarity | 0.94 | 0.70 | ✓ | Explicit inclusion/exclusion list separates this slice from Phase 6 and future expansion. |
| Constraint Clarity | 0.93 | 0.65 | ✓ | Source standard, permitted matching signals, identity, staff authority, quota, and moderation behavior are locked. |
| Acceptance Criteria | 0.91 | 0.70 | ✓ | Seven pass/fail checks cover routes, rendering, privacy, quota, and moderation transitions. |
| **Ambiguity** | **0.08** | **≤0.20** | ✓ | 1 − (0.35×0.96 + 0.25×0.94 + 0.20×0.93 + 0.20×0.91) = 0.08. |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Which existing experiences ship, what happens after a report, and what evidence standard applies? | All five existing experiences ship; reports hide content immediately pending authorized staff review; listings are source-linked with “verify before applying,” not a freshness gate. |
| 1 | Gate | Is the scope clear enough to write? | User approved moving forward at ambiguity 0.16. |
| Edge/prohibition probe | Failure Analyst | What must happen under invalid, repeated, racing, privacy-sensitive, and misleading-information conditions? | Five combined submissions per signed-in student per hour; duplicate/racing reports remain hidden with one review item; all four must-NOT safeguards are locked. |

---

*Phase: 05-school-community-and-wny-release-slice*  
*Spec created: 2026-08-29*  
*Next step: $gsd-discuss-phase 5 — implementation decisions (how to build what’s specified above)*
