# Roadmap: Scholar Scout v1.1 — Regional Opportunity Navigator

## Overview

Scholar Scout v1.1 gives students in Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, Greater New Orleans, and Greater Kingston, Jamaica a trustworthy, choice-preserving way to discover and compare broad education and training routes. This milestone grows from source/evidence foundations, through governed publication and discovery, to qualification safety, provider stories, local-only referrals, and an operational release gate.

The product presents published facts and verification actions. It does not make admission, eligibility, enlistment, funding, employment, pay, placement, safety, quality, or outcome decisions. Unknown, stale, and conflicting facts remain visible with a source/date and verification action rather than being invented or silently represented as current.

## Milestone-wide Boundaries

- No live learner-facing provider aggregation, runtime scraping, auto-publication, or copied provider content/media.
- Every pathway type remains browseable; filters/ranking are reversible and cannot suppress an opportunity class.
- Only student-controlled ordinary preferences may produce transparent reasons/order. Qualifications highlight published requirements to verify; they never issue a verdict or hide a route.
- Sensitive support is optional, purpose-specific, local-only, and non-ranking. It requires approved referral destinations before release and must not persist, transmit, or reach analytics/URLs.
- Military content is factual exploration only: official sources, approved neutral minor-safe wording, human verification, and no recruitment pressure or eligibility/outcome claims.
- Provider-specific media requires stored rights evidence. Uncertain/expired/revoked rights use a factual text-and-source fallback.
- Retain Next.js, React, TypeScript, NextAuth, Vercel, the governed catalogue boundary, and incremental persistence safety; do not add a database/CMS/search platform without measured need and a separate decision.

## Phases

**Phase Numbering:** Phase 9 continues the completed v1.0 numbering. Each phase begins with zero plans; plans are added only after phase planning.

- [x] **Phase 9: Catalogue Foundations and Source Contracts** — Define the six-area scope, controlled catalogue/evidence vocabulary, and honest freshness/coverage states. (Plans: 10/10) (completed 2026-09-22)
- [x] **Phase 10: Curated Import and Governed Staff Publication** — Validate, version, review, and safely publish bounded catalogue snapshots through authorized staff controls. (Plans: 6/6) (completed 2026-09-23)
- [x] **Phase 11: Choice-Preserving Six-Area Discovery** — Make the governed catalogue browseable, comparable, source-first, and accessible without pathway suppression. (Plans: 5/5) (completed 2026-09-24)
- [ ] **Phase 12: Qualification Lens and Explanation Governance** — Let students privately highlight published requirements while preserving non-predictive, all-visible ranking and explanations. (Plans: 1/5)
- [ ] **Phase 13: Provider Detail, Transition Stories, and Media Safety** — Deliver factual provider pages and finite, inclusive, rights-safe, motion-safe Scholar Scout story-to-facts journeys. (Plans: 0/0)
- [ ] **Phase 14: Sensitive Support Referral and Neutral Military Information** — Offer approved local-only support referrals and neutral official military information without sensitive retention or recruitment pressure. (Plans: 0/0)
- [ ] **Phase 15: Six-Area Expansion, Operations, and Release Gate** — Complete coverage expansion and prove ongoing freshness, source, rights, accessibility, and launch readiness. (Plans: 0/0)

## Phase Details

### Phase 9: Catalogue Foundations and Source Contracts

**Goal:** Establish a deterministic, source-first catalogue foundation for the six approved regional areas that represents trustworthy facts and visible uncertainty without inventing availability or coverage.

**Depends on:** Completed v1.0 governed matching and catalogue boundaries.

**Requirements:** REG-01, REG-02, REG-03, EVID-01, EVID-02, EVID-05.

**Scope boundaries:** Define records, fixtures, source authority, metro/pathway vocabulary, and freshness calculations only. Do not create a live provider integration, publish unreviewed inventory, add a new database, or build personalized qualification/referral experiences.

**Success criteria:**

1. Each approved regional area has an explicit, versioned official boundary, authority, source, release/check date, and visible coverage status for all six pathway types; the five U.S. areas use a frozen Census/OMB CBSA release and Greater Kingston uses a frozen Statistical Institute of Jamaica Kingston Metropolitan Area authority record.
2. The catalogue represents university, community-college, trade/career-school, registered-apprenticeship, employer-linked-training, and military-information records with controlled types.
3. Every material fact carries its own source/authority, source and review date, `Current` / `Needs confirmation` / `Unknown` / `Conflicting` status, and direct verification action.
4. Missing, stale, or conflicting facts are visible as such and never become a confirmed fact, inferred availability, fit signal, salary promise, or fabricated offering.
5. Wage information, if present, is structurally separate, dated occupation-and-area context rather than provider evidence or a personal forecast.

**Plans:** 10/10 plans complete

Plans:

- [x] `09-01-PLAN.md` — Define and test the deterministic regional, ten-mile local-focus, and coverage contract.
- [x] `09-02-PLAN.md` — Freeze six regional fixtures and the complete 36-cell coverage matrix.
- [x] `09-03-PLAN.md` — Add field-level evidence, freshness, paid-training, wage-context safeguards.
- [x] `09-04-PLAN.md` — Repair the first source-governance review findings.
- [x] `09-05-PLAN.md` — Harden malformed import-shape and coverage chronology validation.
- [x] `09-06-PLAN.md` — Guard nested provenance and unverified-coverage runtime shapes.
- [x] `09-07-PLAN.md` — Enforce supplied-region and source-check chronology constraints.
- [x] `09-08-PLAN.md` — Require validated provenance before coverage authorization.
- [x] `09-09-PLAN.md` — Fail closed when an injected validation clock is invalid.
- [x] `09-10-PLAN.md` — Clamp the great-circle calculation at valid numerical limits.

**Risk:** Incorrect regional/source definitions create false local coverage. Freeze the appropriate official boundary record for each country and validate fixtures before any public record or coverage claim ships.

### Phase 10: Curated Import and Governed Staff Publication

**Goal:** Enable authorized staff to produce a reviewed, deterministic snapshot from bounded source inputs while preserving source, claim, rights, audit, and conflict-safety controls.

**Depends on:** Phase 9.

**Requirements:** EVID-03, EVID-04, PUB-01, PUB-02, PUB-03.

**Scope boundaries:** Build only staff/CI/build-time import, validation, reviewed snapshot, and publication flows. Learner requests must not scrape, aggregate, or depend on a live provider; imported candidates never publish automatically.

**Success criteria:**

1. A staff reviewer can inspect source authority, evidence state, freshness, claim wording, boundary relationship, and media-rights metadata before publication.
2. The public read model is a versioned reviewed snapshot with a manifest; learner requests read it through the governed catalogue boundary rather than a live provider site.
3. Active authorized staff alone can create, revise, publish, retire, restore, or correct records with audit evidence and recoverable stale-revision conflicts.
4. Missing/invalid source, claim, boundary, or media-rights evidence blocks publication without discarding the existing valid public record.
5. A bounded validated batch can be previewed and recovered safely without an unbounded whole-document rewrite or automatic source publication.

**Plans:** 6/6 plans complete

- [x] `10-01-PLAN.md` — Validate and stage checked private catalogue drafts.
- [x] `10-02-PLAN.md` — Add bounded private imports and independent review.
- [x] `10-03-PLAN.md` — Publish deterministic weekly catalogue snapshots.
- [x] `10-04-PLAN.md` — Add staff intake, conflict recovery, and snapshot recovery commands.
- [x] `10-05-PLAN.md` — Deliver the release/recovery/audit console and full lifecycle regression matrix.
- [x] `10-06-PLAN.md` — Close recovery validation and real stale-conflict workflow gaps.

**Risk:** Broad imports can overwrite current data or normalize marketing claims. Use quarantined candidate files, strict validation, small batches, existing CAS/audit controls, and fixture-based recovery tests.

### Phase 11: Choice-Preserving Six-Area Discovery

**Goal:** Let any student browse, filter, save, compare, and verify the governed six-area catalogue through accessible, source-first discovery surfaces.

**Depends on:** Phase 10.

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04.

**Scope boundaries:** Deliver factual discovery/comparison and official next actions only. Do not introduce application submission, paid placement, provider messaging, eligibility determination, identity/location inference, or engagement-based ranking.

**Success criteria:**

1. A student can select/change a covered metro and browse every pathway type before signing in, completing a story, or providing personal information.
2. Opportunity cards, comparison, and detail surfaces show provider, type, location/delivery, status, reasons, facts to verify, source/date/state, alternate routes, save/compare, and an official next action.
3. Filters and deterministic ordering are reversible and preserve every opportunity/pathway class; they do not infer residence or use passive behavior.
4. Unknown, stale, conflicting, empty-coverage, and external-link states provide a clear next action and cannot look confirmed.
5. Discovery and comparison work with keyboard/screen reader and supported phone/tablet layouts without horizontal page overflow.

**Plans:** 5/5 plans complete

Plans:

- [x] 11-05-PLAN.md

- [x] 11-01-PLAN.md — Replace legacy profile-ranked browsing with the public snapshot discovery model and reversible six-area filters.
- [x] 11-02-PLAN.md — Build source-first cards plus the finite focused detail and media-ready preview boundary.
- [x] 11-03-PLAN.md — Move student-controlled save and factual comparison to the governed public snapshot.
- [x] 11-04-PLAN.md — Harden keyboard, screen-reader, reflow, and reduced-motion behavior and close the regression matrix.

**Risk:** A polished surface can conceal uncertainty or use convenience filtering as exclusion. Treat source/status/verify content and all-visible ranking assertions as core UI/test contracts.

### Phase 12: Qualification Lens and Explanation Governance

**Goal:** Give students an optional, private way to compare ordinary qualifications against published requirements while keeping all options visible and explanations non-predictive.

**Depends on:** Phase 11.

**Requirements:** MATCH-01, MATCH-02, MATCH-03, MATCH-04.

**Scope boundaries:** Use only student-chosen ordinary qualifications to highlight published items to verify. Do not save sensitive/referral data, add a predictor, use GPA/test/prestige/ZIP/engagement proxies, issue eligibility decisions, or rank out a pathway.

**Success criteria:**

1. A student can choose ordinary qualifications—diploma/credits, degree, licence, prior work, or voluntary military history—and see relevant published requirements to confirm.
2. The lens produces no eligible/ineligible, realistic/safe match, admission, enlistment, funding, placement, salary, or outcome verdict and never hides an opportunity.
3. Every ranked result gives decomposable stated-preference/programme-verified reasons, a material verification step, a plain-language support statement, and a choice-preserving action.
4. GPA, test scores, prestige, ZIP, click/passive behavior, and similar proxies are excluded from rank, visibility, and conclusions by contracts and regression tests.

**Plans:** 2/5 plans executed

Plans:

- [x] 12-01-PLAN.md
- [ ] 12-02-PLAN.md
- [ ] 12-03-PLAN.md
- [x] 12-04-PLAN.md
- [ ] 12-05-PLAN.md

- [x] `12-01-PLAN.md` — Add the private account-only qualification record, bounded editor, and ownership/privacy regressions.
- [ ] `12-02-PLAN.md` — Carry published reviewed evidence into the pure, deterministic, all-visible qualification lens.
- [ ] `12-03-PLAN.md` — Render the Programmes editor entry, opt-in order, and factual card explanations.
- [ ] `12-04-PLAN.md` — Extend the existing governed candidate import and publication path with reviewed qualification evidence.
- [ ] `12-05-PLAN.md` — Integrate and verify the shared lens on detail and comparison surfaces.

**Risk:** Helpful qualification guidance can drift into an opaque eligibility model. Centralize it in the shared view model, snapshot explanations, and test that input changes never remove records or add prohibited signals.

### Phase 13: Provider Detail, Transition Stories, and Media Safety

**Goal:** Pair factual source-first provider pages with inclusive, finite, accessible Scholar Scout transition stories while preserving strict media rights and content boundaries.

**Depends on:** Phase 11.

**Requirements:** MEDIA-01, MEDIA-02, MEDIA-03.

**Scope boundaries:** Provider detail is factual and source-led; stories are Scholar Scout-owned non-authoritative context. Do not copy provider assets, use unlicensed/unknown media, imply provider affiliation/outcomes, or add infinite/autoplay attention mechanics.

**Success criteria:**

1. Provider pages display attributable factual details and official sources, and render media only when stored rights evidence identifies owned, licensed, provider-approved, or approved-embed use.
2. Unknown, expired, revoked, or unsupported media rights always use a complete factual text-and-source fallback.
3. Scholar Scout transition stories are finite, skippable, inclusive, non-authoritative, and link to verified factual records without implying attendance, placement, endorsement, or outcome.
4. Story/provider media provide accessible names/alt text or captions/transcripts, respect reduced-motion, and keep user control over non-essential motion.

**Plans:** 0/0 plans executed.

**Risk:** Visual content can create copyright exposure, misleading affiliation, inaccessible motion, or a manipulative feed. Rights evidence and no-media/reduced-motion fallbacks are release-critical.

### Phase 14: Sensitive Support Referral and Neutral Military Information

**Goal:** Provide approved optional local-only sensitive support referrals and neutral official military-information pathways without changing rank, retaining sensitive selections, or pressuring learners.

**Depends on:** Phase 12 and Phase 13.

**Requirements:** SAFE-01, SAFE-02, SAFE-03.

**Scope boundaries:** Referral selection/consent stays in client memory and reveals only approved public information links. Do not create referral records, send provider requests, add bookings, use sensitive data in ranking, or use military content for recruitment/targeting.

**Success criteria:**

1. A student can voluntarily open a purpose-specific support referral without the category being inferred, persisted, disclosed, or changing catalogue/rank.
2. The interaction makes no request or browser-storage/analytics/query write and reveals a destination only after the student explicitly chooses an approved public information link.
3. Referral destinations have approved owner, jurisdiction/availability note, source, review date, and unavailable/expired fallback before release.
4. Military-information surfaces use approved official sources and neutral minor-safe wording, include human verification, and make no recruiting pressure, personal eligibility, or enlistment-outcome claim.

**Plans:** 0/0 plans executed.

**Risk:** Sensitive choices can leak through persistence, telemetry, URLs, or provider handoff; military language can be coercive for minors. Block release until destination ownership and exact neutral wording have human approval and regression coverage.

### Phase 15: Six-Area Expansion, Operations, and Release Gate

**Goal:** Complete and release the six-area catalogue only after coverage, freshness, source, rights, accessibility, and safety operations are demonstrably sustainable.

**Depends on:** Phases 9–14.

**Requirements:** OPS-06, OPS-07.

**Scope boundaries:** Expand only source-reviewed records and prove operational readiness. Do not claim national coverage, auto-publish source changes, downgrade stale/unknown state, or add infrastructure/personalization outside milestone governance.

**Success criteria:**

1. Staff can review source changes, link health, freshness/review deadlines, media-rights status, and metro/pathway coverage before labelling a record current.
2. All six regional areas and six pathway types have transparent coverage reporting; unverified gaps remain visibly `Not yet verified` rather than implied inventory.
3. Automated checks cover evidence, freshness, claim safety, all-visible discovery, qualification/proxy exclusion, referral separation, media fallback, and accessible states.
4. A Preview and human release gate confirms source/rights review, keyboard/screen-reader/reduced-motion behavior, approved referral destinations, and neutral minor-safe military wording.

**Plans:** 0/0 plans executed.

**Risk:** Expansion can turn a safe vertical slice into stale or uneven coverage. Coverage/freshness reports and human release approval are hard gates; gaps retain `Not yet verified`.

## Requirement Coverage

| Requirement | Phase |
|---|---:|
| REG-01, REG-02, REG-03 | 9 |
| EVID-01, EVID-02, EVID-05 | 9 |
| EVID-03, EVID-04 | 10 |
| PUB-01, PUB-02, PUB-03 | 10 |
| DISC-01, DISC-02, DISC-03, DISC-04 | 11 |
| MATCH-01, MATCH-02, MATCH-03, MATCH-04 | 12 |
| MEDIA-01, MEDIA-02, MEDIA-03 | 13 |
| SAFE-01, SAFE-02, SAFE-03 | 14 |
| OPS-06, OPS-07 | 15 |

**Coverage:** 27/27 v1.1 requirements mapped exactly once; 0 unmapped; 0 duplicate mappings.

## Execution Order

Phase 9 → Phase 10 → Phase 11 → Phase 12 → Phase 13 → Phase 14 → Phase 15.

Phase 13 may begin research/design after Phase 11 because it uses the governed record contract, but it must not release provider pages/stories until the shared discovery evidence contract is stable. Phase 14 begins only once qualification governance and provider/military factual source surfaces are stable. Phase 15 is the integrated release gate for all prior phases.
