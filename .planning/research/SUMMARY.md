# Project Research Summary

**Project:** Scholar Scout v1.1 — Regional Opportunity Navigator  
**Synthesized:** 2026-09-22  
**Research inputs:** `RESEARCH-PLAN.md`, `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, and `PITFALLS.md`  
**Overall confidence:** Medium. The product, safety, and existing-code boundaries are clear; the six-area source inventory, rights evidence, freshness owners, and final boundary releases still require explicit confirmation.

## Key Findings

### 1. The v1.1 product is a bounded six-area, multi-pathway navigator

The approved scope is Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, Greater New Orleans, and Greater Kingston, Jamaica. Each regional area must offer broad discovery across university, community college, trades/career schools, registered apprenticeships, employer-linked training (including AI-infrastructure-related training), and military-information paths.

The catalogue is not national coverage, a college-only directory, an application funnel, a recruitment engine, or a prediction product. Students must be able to browse every pathway type regardless of age, neighbourhood, race, personal circumstance, prior education, or selected preference. Filters can refine and rank, but they must be reversible and must never suppress a pathway class.

### 2. The authoritative product unit is an evidence-backed opportunity record

Every material public claim needs its own source, authority tier, checked date, factual state, and verification instruction. A generic provider-wide “verified” badge is insufficient because a provider can have a current programme name while tuition, requirements, support, location, availability, or media rights are unknown or stale.

The minimum public record needs:

- stable opportunity/provider identifiers and controlled pathway type;
- a region’s appropriate official statistical code or boundary identifier and the specific saved boundary-release/check version; U.S. areas use Census/OMB CBSA identifiers, while Greater Kingston retains its Statistical Institute of Jamaica Kingston Metropolitan Area authority record;
- physical/remote availability relationship, delivery mode, and published status;
- field-scoped provenance: source URL/label/tier, effective date when known, review date, stale-after date, and `current` / `needs-confirmation` / `unknown` / `conflicting` state;
- source-backed requirements-to-verify, next action, and factual provider summary;
- media rights state and approved asset/embed reference, if media is shown;
- revision, reviewer, audit, and publication lifecycle metadata.

Unknown or conflicting data is a valid display state, not a reason to fabricate a value or hide a path. Stale facts should remain visible with their date/source and an explicit confirmation action; withdrawn/retired records are handled through governed publication controls.

### 3. Use curated, versioned snapshots—not live aggregation or scraping

The recommended initial publication model is staff-curated source records plus a reviewed/generated snapshot committed or produced at build time. The runtime Next.js application reads only the approved public read model and existing governed programme boundary; it does not fetch provider data for a learner request.

This preserves repeatable Preview/production behavior, makes data diffs reviewable, allows a provider site to be unavailable without breaking discovery, and avoids source-terms, rate-limit, malicious-content, and media-rights risks. Offline import adapters or URL health checks may be evaluated only as bounded staff/CI operations. They must never scrape content, auto-publish changes, or bypass access controls.

The initial stack remains Next.js App Router, React, strict TypeScript, Node scripts, GitHub Actions, Vercel Preview, and existing Jest/Testing Library coverage. No database, ORM, CMS, ETL platform, hosted search, live marketplace API, vector system, or new production dependency is justified for the bounded six-area launch.

### 4. Integrate incrementally through the governed catalogue boundary

The existing implementation already has the right seams:

- server pages retrieve public catalogue data through `getGovernedProgrammes()`;
- `Programme` and the Phase 7 opportunity-matching contract provide evidence-first rendering and deterministic explanations;
- active staff, admin validation, audit events, and CAS conflicts protect programme writes;
- client components render serializable governed data and own only local interaction;
- `SensitiveReferralPanel` demonstrates a local-only consent-and-link flow.

The v1.1 snapshot should become the governed seed/read model and continue to merge with approved staff records. Raw sources, staging imports, student profiles, and operational logs must not share an undifferentiated whole-document lifecycle. Catalogue updates should use small, validated batches and the existing conflict/recovery behavior while the current persistence architecture remains bounded.

### 5. Student experience has a firm “story to facts” boundary

The intended experience combines an optional, finite, motion-safe Scholar Scout transition-story layer with a factual “Realtor-style” record. Stories make possible routes feel imaginable; the provider record is authoritative and must expose provider, route type, place/delivery, source, review date, status, published requirements, verification questions, alternatives, save/compare, and official next action without requiring a profile or story engagement.

The product should include source-first factual cards, provider detail pages, save/compare, requirements-to-verify, a choice-preserving alternative rail, and a visible stale-information/report path. It should not use infinite/autoplay feed mechanics, passive engagement ranking, recruitment messaging, paid organic placement, application submission, or hidden eligibility decisions.

### 6. Ranking and qualification explanations must preserve choice

Only deliberately provided ordinary preferences may influence ordering or explanations: broad pathway, location/delivery preference, interests, affordability sensitivity, and similar non-sensitive practical preferences. Each ranked option shows 2–4 decomposable reasons and a material fact to verify. A score, if retained internally, is not a prediction or likelihood claim.

Ordinary qualifications a student intentionally chooses to use—such as diploma/credits, degree, licence, prior work, or voluntary military history—may highlight a provider’s published requirement as something to check. They cannot create “eligible/ineligible,” “realistic/safe match,” admission, enlistment, funding, job, salary, placement, or outcome verdicts; nor can they suppress an opportunity.

Raw GPA, test scores, school prestige, ZIP code, click behavior, passive engagement, and similar proxies must not rank or hide opportunities. Pay, if included, is a separately sourced, dated occupation-and-area context (such as BLS data), never a provider outcome or personal forecast.

### 7. Sensitive support is referral-only and must remain non-retained

Disability, health/mental health, housing, childcare, immigration, re-entry, protected characteristics, language needs, and complex finances are not matching, analytics, URL, provider-page, or persisted recommendation-profile data. They can open a voluntary, purpose-specific local consent interaction whose only outcome is an allowlisted public human/provider information link chosen by the student.

No sensitive selection may cause a fetch, browser-storage write, route payload, analytics field, query parameter, provider disclosure, or rank change. A later booking, transfer, profile, or provider handoff would need a separately designed protected data model with recipient-specific consent, retention, access, audit, delete/export, and withdrawal behavior; it is out of scope.

### 8. Provider media and military information need special treatment

Scholar Scout transition stories use original or licensed content and must not imply that a pictured person attended, was placed by, or is endorsed by a provider. Provider pages default to factual text and citations. Media may appear only with stored evidence that it is Scholar Scout-owned, licensed, provider-approved, or an approved embed; uncertain rights require the no-media fallback.

Military paths remain factual information/referral routes sourced from official service, Guard/Reserve, DoD, and VA pages. They are never personalized recruiting, eligibility determinations, pressure/urgency copy, or enlistment promises. Content for minors requires an additional approved neutral-language and human-verification policy.

## Implications for Roadmap

### Recommended requirement categories

These are proposed categories for future roadmap/requirements work, not invented requirement IDs.

| Category | Requirement intent | Evidence of completion |
|---|---|---|
| Catalogue scope and geography | Each of the six approved regional areas has a versioned official boundary definition and transparent coverage state across all six pathway categories. | Saved boundary version/URL, coverage matrix, regional validation tests, and no national-coverage copy. |
| Provenance and freshness | Every displayed material fact is attributable, dated, stateful, and reviewable; stale/conflicting facts cannot appear confirmed. | Import/record validation, snapshot manifest, freshness report, unknown/stale card tests, staff review evidence. |
| Governed publication | Only authorized staff can create/publish/revise records; source/media/claim failures block publication and conflicts are recoverable. | Active-staff API tests, validators, CAS/409 tests, audited revisions, bounded import rehearsal. |
| Choice-preserving discovery | Students can browse, filter, save, compare, verify, and reach alternate routes without eligibility suppression or opaque ranking. | All-visible ranking tests, reason snapshots, card/provider-page actions, compare and accessibility tests. |
| Qualification and claim safety | Ordinary qualifications only highlight published requirements; product language makes no admission, enlistment, aid, salary, placement, or outcome determination. | Input allowlist tests, prohibited-claim validator, content review, no-eligibility UI assertions. |
| Privacy and referral separation | Sensitive circumstances remain optional, purpose-specific, local-only referral inputs that never affect rank or disclosure. | No fetch/storage/analytics/query/ranking referral tests and destination-owner approval. |
| Provider media and storytelling | Provider-specific media has rights evidence; Scholar Scout stories remain inclusive, finite, motion-safe, and non-authoritative. | Rights validator, no-media fallback test, captions/alt/reduced-motion checks, manual visual/rights review. |
| Operations and release assurance | Source change, link rot, review backlog, and coverage imbalance are operationally visible before launch. | Scheduled freshness/URL report, reviewer queue, Preview validation, manual source/rights/a11y sign-off. |

### Staged roadmap sequence

1. **Catalogue foundations and source contracts** — Freeze the six appropriate official regional boundaries; define controlled region/pathway/source/evidence/media unions; add fixtures, source-authority ladder, field-level evidence, and freshness calculation.
2. **Curated import and governed staff publication** — Build quarantined source input, deterministic validation, reviewed snapshot/manifest, source/claim/media validation, staff/CAS workflow, audit evidence, and small-batch recovery tests.
3. **Choice-preserving six-area discovery** — Deliver universal browse/filter, factual cards, source/date/status, save/compare, official next action, alternate-path rail, and accessible mobile/keyboard behavior. Begin with a complete small vertical slice before growing inventory.
4. **Qualification lens and explanation governance** — Add optional student-controlled ordinary qualification highlighting to the shared match view model; prove all-visible, non-predictive, non-proxy behavior across list, detail, and recommendations.
5. **Provider detail, transition stories, and media safety** — Add source-first provider pages plus finite Scholar Scout story-to-facts handoff. Enforce rights metadata, no-media fallback, caption/alt text, external-link safety, and reduced-motion controls.
6. **Sensitive support referral** — Extend/refine only the existing local-only consent/link pattern after referral destination owners, jurisdiction notes, freshness rules, and minor-safe wording are approved.
7. **Six-area expansion and operations gate** — Grow coverage region-by-region and pathway-by-pathway, showing honest coverage gaps; run source/link/freshness reports, rights and accessibility review, Preview evidence, and launch approval.

### Delivery principles

- Build the smallest fully governed vertical slice before claiming broad regional coverage.
- Treat sources, reviews, and rights as production data with a lifecycle—not copywriting.
- Keep all learner requests deterministic and independent of live upstream provider availability.
- Prefer visible uncertainty and a verification route to a plausible but unsupported fact.
- Add infrastructure only after measured catalogue volume or concurrent-edit needs exceed the safe curated snapshot workflow.

## Decisions and Research Gaps

The following must be explicitly decided or researched before implementation/launch; the current research does not authorize assumptions.

1. **Regional boundary authority:** Confirm the final Census/OMB delineation release, official CBSA labels/codes, component geography, and update trigger for Houston, Chicago, Buffalo, Atlanta, and New Orleans; separately freeze Greater Kingston against the Statistical Institute of Jamaica Kingston Metropolitan Area boundary authority and its applicable checked/release date. Greater Kingston must not be assigned a U.S. CBSA code.
2. **Coverage threshold:** Define what “available in a metro” means for each pathway type and the minimum source-reviewed inventory required before a metro/type is shown as covered rather than `not yet verified`.
3. **Freshness policy:** Approve field-specific review windows and escalation: operational programme facts, applications/openings, provider/media rights, CBSA releases, wage data, and military/VA information change on different schedules.
4. **Source ownership:** Assign a data-operations owner for provenance/freshness, a product owner for student-facing language, a security/privacy owner for referrals, an advisor/student-success owner for referral content, and a media-rights owner.
5. **Allowed source list and import terms:** Confirm the Tier 1–4 sources, URL-health-check rules, provider/employer/training source permissions, and any CareerOneStop token/attribution/quota decision. No live learner-facing integration is approved.
6. **Military/minor policy:** Approve exact neutral language, age-appropriate handoff/escalation, source list, and review criteria for military-information content.
7. **Sensitive-referral directory:** Supply allowed destinations, jurisdiction/availability labels, staff owner, review date, failure fallback, and consent/withdrawal wording. Do not invent providers or claims.
8. **Media rights:** Establish the evidence an editor must hold for provider-approved/licensed/embedded media and the policy for expiring/revoked approval.
9. **Persistence boundary:** Confirm when snapshot volume, revision frequency, or staff concurrency justifies a narrow independent catalogue persistence model rather than the current whole-document adapter; do not preemptively add a database.
10. **Measurement governance:** Specify privacy-approved aggregate measures for decision clarity, breadth, source quality, and referral usefulness; do not use engagement/conversion as a ranking objective.

## Sources

### Internal authorities

- [Project scope and constraints](../PROJECT.md)
- [Regional Opportunity Navigator research plan](RESEARCH-PLAN.md)
- [Technology and source integration research](STACK.md)
- [Feature landscape and experience boundaries](FEATURES.md)
- [Catalogue/server/client architecture research](ARCHITECTURE.md)
- [Risk register and stop-ship safeguards](PITFALLS.md)
- [Recommendation Governance Specification](../../docs/product-recommendation-governance.md)

### Primary external sources identified for the implementation research

- [U.S. Census metropolitan and micropolitan delineation files](https://www.census.gov/programs-surveys/metro-micro/about/delineation-files.html)
- [Statistical Institute of Jamaica — Kingston Metropolitan Area communities and population](https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html)
- [NCES IPEDS data resources](https://nces.ed.gov/Ipeds/use-the-data)
- [College Scorecard institution data documentation](https://collegescorecard.ed.gov/assets/InstitutionDataDocumentation.pdf)
- [Apprenticeship.gov Job Finder](https://www.apprenticeship.gov/apprenticeship-job-finder)
- [BLS OEWS metropolitan estimates](https://www.bls.gov/OES/current/oessrcma.htm)
- [VA guidance for choosing a GI Bill-approved school](https://www.va.gov/resources/choosing-a-gi-bill-approved-school/)
- [W3C WCAG 2.2 — Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide)

All external sources are inputs for staff verification and cited display facts; they do not by themselves authorize an eligibility, quality, placement, salary, admission, enlistment, or outcome claim.
