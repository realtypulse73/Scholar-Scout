# Regional Opportunity Navigator — Pitfalls and Prevention Research

**Researched:** 2026-09-22  
**Scope:** Five-metro official-source opportunity catalogue  
**Confidence:** High for product/technical safeguards; source-specific freshness and rights schedules require owner confirmation

## Executive Risk Position

The most consequential risk is not a missing card or filter; it is presenting a stale, inferred, or coercive claim as if it were current provider truth. The catalogue therefore needs evidence and freshness controls before broad inventory expansion, choice-preserving language before qualification personalization, and a hard separation between ordinary preferences and sensitive referral-only circumstances.

No record should be considered safe merely because its provider is real. Each material fact, its geography, its media, and its student-facing claim need their own authority, date, state, and review path.

## Risk Register

| Pitfall | Failure mode | Preventive safeguard | Evidence / test | Proposed rollout phase |
|---|---|---|---|---|
| Stale availability, dates, cost, delivery, or support | An old page is rendered as current; a student acts on a withdrawn or changed offering. | Field-level `current` / `needs-confirmation` / `unknown` / `conflicting` state, source and checked dates, next-review date, and staff due queue. Keep stale records visible with a verification action. | Unit-test deterministic freshness; component-test source/date/verify state; staff review sample before Preview. | 1 — evidence/freshness foundation |
| A provider-wide “verified” badge | One checked fact is mistaken for proof of tuition, requirements, support, and media. | Evidence is attached to each material field. A summary may say what is documented, never that every fact is verified. | Schema/renderer test with a current provider record and an unknown support fact. | 1 |
| Unclear metro inclusion | Marketing geography or a nearby campus makes a listing appear in Houston, Chicago, Buffalo, Atlanta, or New Orleans without an authoritative boundary basis. | Stable metro IDs backed by official CBSA/MSA boundary source, check date, and a source-backed location relationship per record. | Validation rejects unknown metro ID; coverage review includes boundary URL and date. | 1 |
| Inaccurate apprenticeship registration | A sponsor/training page is treated as a current registered apprenticeship without official verification. | Require Apprenticeship.gov or other official registration evidence plus sponsor detail; otherwise label it provider training with confirmation required. | Fixture tests distinguish registered-apprenticeship from employer-linked training. | 1–2 |
| Employer/AI-infrastructure overclaim | Marketing copy becomes a promise of an AI job, employer placement, infrastructure role, pay, or partner relationship. | Preserve only attributable provider wording; type as `employer-linked-training`; separate documented employer relationship from outcomes; prohibit employment promise language. | Copy review and test fixtures reject “guaranteed job/pay/placement” phrases. | 2 — staff publication and first vertical slice |
| Salary or placement promise | BLS/occupation context is displayed as provider outcome or personal forecast. | Store salary data as dated occupation-and-area context with source, not programme evidence or ranking input. Use “may vary; verify” wording. | Unit test no pay fact enters score/reasons; content checklist blocks promise terms. | 2 |
| Eligibility, admission, funding, enlistment, or qualification determination | A student-controlled credential or age is converted into “eligible/not eligible” or suppresses an option. | Highlight matching published requirements only. All paths stay browseable; render “confirm requirements directly” and a human handoff for high stakes. | Property/unit test every input record remains visible; UI test no eligibility result text. | 3 — choice-preserving comparison |
| Military recruitment pressure or minor harm | Military information is personalized toward minors, framed as a recommended path, or uses pressure/urgency. | Treat `military-information` as factual exploration only; link official service/DoD/VA information, use neutral language, no targeting/ranking/recruiting CTA, and include adult/human verification. | Dedicated content review and minor-safe UI test; manual advisor/product sign-off. | 3 |
| Proxy discrimination / biased suppression | ZIP, school prestige, GPA, test score, neighbourhood, race, military history, click behavior, or support need becomes a proxy that ranks out ambitious routes. | Allow only explicit ordinary preference alignment; forbid proxy/engagement scoring; make reasons decomposable; maintain all-visible guarantee and audit breadth by pathway/metro. | Regression tests prove no sensitive/proxy input changes rank; review ranking diff before release. | 3 |
| Sensitive-data leakage | Disability, health, housing, childcare, immigration, re-entry, protected status, or complex finances reach a profile, log, URL, telemetry, provider, or referral record. | Component-local purpose-specific consent only; static allowlisted referral metadata; no API route, local/session storage, analytics property, query parameter, or provider POST accepts the selection. | Component test asserts no fetch/storage/query string/rank effect; route contracts reject unexpected sensitive fields. | 4 — referral boundary |
| Referral destination is stale, unsafe, or outside jurisdiction | A link silently routes a student to an unavailable or inappropriate resource. | Staff-owned directory records destination owner, jurisdiction/availability note, authority URL, checked date, and next review. Missing/expired destination hides the link and offers a generic human-advisor route. | Directory validation plus manual owner/freshness confirmation at phase gate. | 4 |
| Unlicensed provider media | Publicly visible image/video is copied into Scholar Scout without rights, captions, or an approved embed. | Per-asset rights enum (`owned`, `licensed`, `provider-approved`, `approved-embed`, `none`), source/approval date, expiry review, and no-media fallback. | Validation rejects media URL without rights evidence; component test renders fallback; manual rights audit. | 5 — provider page and media |
| Misleading transition storytelling | Scholar Scout stock/original/generated image implies provider affiliation, a student outcome, or a specific pathway experience. | Keep transition stories distinct from provider records; label broadly, use original/licensed assets, avoid provider claims, include captions/alt text. | Content/visual review with claim checklist; accessibility test verifies alternative text. | 5 |
| Automated scraping or runtime fetches | Vercel requests scrape provider sites, violate terms, time out, propagate malicious/incorrect content, or create uncontrolled volume. | No runtime scraping or provider integration. Staff review an approved bounded research/import package outside student request paths. | Code review prohibits remote source fetch from public routes; integration test has no network dependency. | 1–2 |
| Government/official source revision | OMB boundaries, provider catalogues, registries, labour data, or service/VA pages change format or retire URLs. | Persist source type, stable identifier where available, checked/effective dates, reviewer, and next-review; make every field display unknown/needs confirmation safely. | Link-health/staff review workflow and fixtures for missing/changed source. | 1, then 6 — operations |
| Staff curation backlog and inconsistent judgement | Five metros × six pathway types create a large, uneven review workload; errors or stale data cluster in lower-resource categories. | Coverage matrix by metro/pathway, source-authority checklist, reviewer assignment, due queue, reusable import fixtures, small batches, and explicit “coverage not yet verified” states. | Admin validation tests; operational dashboard/report; sample audit by metro and type. | 2, then 6 |
| Whole-document import overwrite/concurrency | Bulk catalogue work overwrites student or staff changes due to the legacy document store. | Keep increments small; use existing CAS revisions, validation-before-write, audit event, conflict/reload response, and recoverable backup/import workflow. Do not introduce unbounded source history. | API conflict test; fixture-based import test; recovery rehearsal. | 2 |
| Paid placement or provider incentive alters organic ordering | Funding/partnership influence is hidden in a personalized score. | Organic rank receives no payment/provider signal. Any future sponsorship is visually separate, labelled, and cannot alter organic order. | Ranking input allowlist test and product review. | 3 |
| Accessibility, motion, and source-link usability | Cards hide source context, use color alone for freshness, autoplay motion, unreadable embeds, or inaccessible external links. | Semantic source/date/verify text; visible focus; `rel="noreferrer"`; accessible name for each action; reduced-motion support; captions/transcripts; no media is an acceptable fallback. | Testing Library role/attribute tests plus keyboard/screen-reader and reduced-motion manual checks. | 3 and 5 |
| “Unknown” becomes a dead end | Missing data is hidden or a student cannot tell what to do next. | Unknown/conflicting facts render honestly with an official source or human referral action; records remain discoverable unless unpublished. | Unit/component tests for unknown and conflicting facts; manual wording review. | 3 |

## High-Risk Claim Rules

The product must make a factual distinction every time it mentions these topics:

| Topic | Safe presentation | Unsafe presentation |
|---|---|---|
| Admission / entry | “The provider lists these published requirements. Confirm directly.” | “You qualify,” “you will be admitted,” “realistic/safe match.” |
| Funding / aid | “This source describes aid information; confirm current availability and eligibility.” | “You will receive aid,” “free programme.” |
| Pay | “Dated occupation-and-area context from this source; not a provider or personal outcome.” | “This programme pays $X,” “you will earn $X.” |
| Placement | “Provider describes these services; ask about current availability.” | “Guaranteed placement/job.” |
| Military | “Official information to explore and verify with an authorized human source.” | Pressure, urgency, recruitment targeting, enlistment recommendation, or eligibility conclusion. |
| Support | “This support is documented / not documented; verify access.” | “This will meet your need,” “you need this because…” |

## Preventive Operating Model

### Before research enters a draft

- Identify the official MSA/CBSA authority and the specific pathway/provider source.
- Record why the source is authoritative, the literal URL, checked date, and field it supports.
- Flag unsupported facts as unknown; do not draft a plausible value from nearby providers, a search result, social media, or general reputation.
- For media, record rights/approval evidence before copying or embedding anything.

### Before a staff record publishes

- Validate required evidence, field state, review date, source authority, allowed claim wording, pathway type, metro membership, and media rights.
- Confirm staff authorization and preserve the CAS revision conflict path.
- Require another reviewer for military-information, sensitive referral, high-debt/transfer-risk, or rights-dependent content.
- Confirm every reader can browse it without providing personal/sensitive information.

### Before Preview/production

- Exercise five-metro coverage fixtures, stale/unknown/conflicting sources, and every pathway type.
- Review all external links and media licensing/embedding terms manually.
- Perform keyboard, screen-reader, zoom, contrast, and reduced-motion checks on source/freshness/referral UI.
- Review rank-reason snapshots to detect proxy, paid, or sensitive changes; test that qualification data never suppresses a listing.

## Suggested Roadmap Sequencing

| Proposed phase | Primary risk retired | Do not defer |
|---|---|---|
| 1. Evidence, scope, and source foundation | Boundary mistakes, source ambiguity, stale/unknown rendering, scraping temptation. | Stable metro/pathway IDs, authority ladder, field evidence, freshness fixtures. |
| 2. Governed staff publication | Inconsistent records, media/claim errors, whole-document conflict risk, curation load. | Exact validation, active-staff/CAS controls, review queue, small-batch coverage. |
| 3. Choice-preserving discovery/comparison | Eligibility/prediction language, suppression, paid/proxy ranking, inaccessible source actions. | All-visible property, shared explanation model, source/verification card contract. |
| 4. Optional support referrals | Sensitive retention/disclosure and unsafe referral destinations. | Local-only consent, owner-reviewed directory, no network/storage/rank effects. |
| 5. Provider pages and transition media | Rights violations, misleading visual affiliation, motion/accessibility harm. | Rights metadata, no-media fallback, embed/caption/reduced-motion controls. |
| 6. Freshness operations and launch evidence | Link rot, source-policy changes, review backlog, uneven metro coverage. | Due queue, coverage report, audit cadence, Preview/manual evidence. |

## Stop-Ship Conditions

Do not publish a listing or declare metro coverage complete when any of the following is true:

- A material provider, availability, requirement, cost, support, or media claim lacks a source/date/state.
- The record uses an inferred eligibility, salary, placement, admission, enlistment, or outcome claim.
- A sensitive field can alter rank, persist with the profile, reach a URL/log/analytics event, or be disclosed to a provider.
- Provider media lacks rights evidence or the fallback is inaccessible.
- The source is scraped, a search result, affiliate material, a social post, or an unsupported summary.
- The MSA/CBSA membership has no authority record or the pathway category cannot be substantiated.
- A stale source is displayed as current rather than `needs-confirmation` with a verification action.

## Research Gaps Requiring Owner Decisions

1. Approve the authoritative boundary source/version and component geography for each approved metro.
2. Set field-specific freshness windows and escalation rules; requirements, vacancies, grants, and media rights may need different cadences.
3. Name the accountable data-operations reviewer, advisor/student-success referral owner, and provider-media rights owner.
4. Approve an exact military-information content policy and minor-safe escalation language.
5. Approve the initial coverage threshold: a metro/type must be presented as `not yet verified` until a source-reviewed inventory exists.

## Recommendation

Treat source evidence, claim safety, and staff review as shipping prerequisites—not cleanup after catalogue design. Build the smallest fully governed vertical slice first, prove stale/unknown/referral/media failure paths, then expand coverage metro by metro. This makes honest incompleteness visible while preventing the kinds of inaccurate, coercive, or privacy-invasive claims that would undermine the navigator’s core value.
