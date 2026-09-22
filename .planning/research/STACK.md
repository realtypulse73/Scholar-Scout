# Technology Stack

**Project:** Scholar Scout v1.1 — Regional Opportunity Navigator  
**Researched:** 2026-09-22  
**Confidence:** MEDIUM — findings use current official-source pages retrieved through a web-search provider; implementation choices are additionally verified against the current repository.

## Recommendation in one sentence

Keep the existing Next.js/TypeScript/Vercel foundation and add a **versioned, staff-curated catalogue import pipeline**: government and provider sources seed or update records offline, TypeScript validators reject unsafe records in CI, and the deployed app reads only approved immutable catalogue snapshots plus its existing governed programme-record boundary.

This is intentionally not a live marketplace scraper. A student should never see an unverified claim merely because another website changed this morning.

## Recommended Stack

### Core framework

| Technology | Version | Purpose | Why |
|---|---:|---|---|
| Next.js App Router | existing 15.5.15 | Server-rendered catalogue, provider pages, and staff review routes | The application already uses it successfully; no platform migration is warranted. Keep source ingestion and validation server/build-only. |
| React | existing 18 | Choice-preserving discovery, compare, save, and source-detail UI | Existing components and accessibility patterns fit this work. |
| TypeScript | existing strict 5.x | Catalogue types, source contracts, and deterministic matching | Compile-time exhaustiveness prevents a new pathway/source state from silently falling through. |
| Node.js | existing 24.x | Import, validation, snapshot, and freshness-report scripts | Already the approved runtime in the workspace and CI. |
| GitHub Actions | existing | Frozen catalogue validation and scheduled freshness reports | A pull request gives data changes review, diff history, and a reliable quality gate before Vercel deploys. |

### Catalogue storage and publication

| Technology | Version | Purpose | Why |
|---|---:|---|---|
| Repository-owned JSON/JSONL source records + generated JSON snapshot | no new dependency | Initial canonical public catalogue | Six regional areas are a bounded launch scope. A committed, reviewable snapshot is simpler and safer than exposing a runtime upstream dependency. Use source records as inputs and generate one normalized read model. |
| Existing `Programme` / governed programme-record boundary | existing | Incremental integration into discovery and matching | `apps/web/lib/programmes.ts` already has publication, source-confidence, evidence, source URL, and last-verified concepts. Extend it rather than make a parallel ungoverned catalogue. |
| Existing Vercel Blob / HTTP adapter | existing, **not** initial public catalogue authority | Accounts, drafts, audit events, and later approved mutable records | The current adapter writes a whole document. Do not make it the sole ingestion store or use it for raw source pulls. If a later staff workflow needs independent catalogue records, add a narrow versioned collection boundary first. |
| Vercel build artifact / static import | existing | Serve the approved catalogue without an external fetch on learner requests | Makes results repeatable, supports Preview tests, and works when a source site is down. |

### Schema and validation mechanisms

| Mechanism | Purpose | When to use |
|---|---|---|
| Discriminated TypeScript unions and small runtime type guards | Authoritative allowed values for metro, pathway type, source tier, verification state, and fact state | Build the initial slice with the project’s existing dependency-free validation style. No validation package is currently installed. |
| Pure `parse*` / `validate*` functions plus Node `--test` | Reject malformed imports and prove no prohibited fields reach matching | Every import and CI job. Follow the existing `validateProgrammeDraft` pattern, but create a dedicated catalogue validator rather than loosening admin draft validation. |
| JSON Schema generated/maintained alongside TypeScript **only if a non-TypeScript editor or import partner needs it** | Portable handoff and batch-import contract | Later. Do not add Ajv, Zod, a database ORM, or a generic ETL platform in the first slice merely to validate trusted staff JSON. |
| Provenance record per displayed fact | Source URL, authority tier, source/review/effective dates, reviewer, and factual state | Required before publication; a record with missing evidence stays `needs-review`, `unknown`, `stale`, or `conflicting`, never silently becomes verified. |

### Operational tooling

| Tooling | Purpose | Why |
|---|---|---|
| `scripts/catalogue/import-*.mjs` | Download or parse permitted bulk releases into a quarantined candidate file | Keeps upstream formats outside request handling and makes each run reproducible. |
| `scripts/catalogue/validate.mjs` | Schema, authority, URL, date, metro, duplicate-ID, and prohibited-claim checks | Must run in CI and before a staff user can publish a record. |
| `scripts/catalogue/build-snapshot.mjs` | Normalize approved source records into a deployable read model with a manifest | The manifest should contain input versions, generated date, and record counts by metro/pathway. |
| `scripts/catalogue/freshness-report.mjs` | Report records past their review deadline, broken first-party URLs, missing media rights, and unavailable sources | Creates a staff work queue; it must not auto-publish a changed value. |
| Existing GitHub Actions + Vercel Preview | Review import diffs and run validation before deployment | Reuses an established quality/rehearsal path rather than adding an operations console or new vendor. |

## Source authority ladder

The six launch regions are a common coverage rule, not six separate data architectures. Store each area’s appropriate official statistical identifier and boundary authority/version. The five U.S. candidates to verify and freeze against the selected Census release are Houston **26420**, Chicago **16980**, Buffalo **15380**, Atlanta **12060**, and New Orleans **35380**. Greater Kingston, Jamaica uses the [Statistical Institute of Jamaica Kingston Metropolitan Area](https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html) boundary authority, not a U.S. CBSA code. The import must validate every area against its saved authority record before assuming its title, member geography, or area mapping.

| Tier | Accepted source | Use | Required handling |
|---|---|---|---|
| 1 | Provider, sponsor, employer, service branch, VA, state licensing/approval authority, DOL, ED/NCES, Census, BLS | Current programme facts, application/delivery details, official status, benefits information, regional definitions, occupation context | Link the exact page/file; capture publication/effective date where supplied and a Scholar Scout review date. |
| 2 | Government dataset that identifies the entity but is not current programme availability: IPEDS, College Scorecard, VA comparison data, Apprenticeship.gov discovery data, CareerOneStop | Seed discovery and corroborate identity/location/field relationships | Treat as a candidate record. Confirm current, student-facing programme facts with Tier 1 before publication. |
| 3 | State/local workforce agency or public workforce board | Supplement local training and employer-linked programs | Require provider/partner confirmation for a specific offering and preserve both citations. |
| 4 | Provider-submitted information | Draft only | Staff verifies it through a Tier 1 or suitable Tier 2 source before publishing. |
| Prohibited | Search snippets, scraped page text, social posts, commercial ranking/lead marketplaces, affiliate feeds, AI-generated assertions, user reviews as facts | Never source a catalogue claim or ranking | A link may be shown as an explicitly external resource only after staff review; it cannot establish a fact. |

### Source choices by pathway

| Pathway | Discovery / canonical identifiers | Publication confirmation | Important limitation |
|---|---|---|---|
| Two- and four-year institutions | NCES IPEDS `UNITID`; College Scorecard where a documented measure is useful | Institution’s official programme/catalogue/admissions page | IPEDS supports institution discovery and historical institutional data; it is not proof that a particular cohort/programme is currently open. |
| Community college and career/technical education | IPEDS where applicable; state education/workforce directory | Official college or CTE provider page; relevant state approval page | Do not infer tuition, transferability, or credential availability from a school-level row. |
| Trades and career schools | State licensure/approval registry and official provider page | Programme page plus licensing/approval status where relevant | A school appearing in a directory is not a promise of a seat, license outcome, or start date. |
| Registered apprenticeship | Apprenticeship.gov Job/Partner Finder and sponsor identity | Sponsor’s official page or named registration/state-agency confirmation | The finder includes multiple data sources and labels registered occupations/partners. Do not label every resulting vacancy a registered programme or a guaranteed opening. |
| Employer-linked and AI-infrastructure training | Employer-owned training page plus local education/workforce partner | Employer + named local provider/partner; workforce authority if available | No inferred partnership or job pipeline. Keep employer training distinct from job openings and from a degree/certificate claim. |
| Military-information pathways | Official service, National Guard/Reserve, DoD, and VA education pages | Exact official page for the fact displayed | Information/referral only. Never determine enlistment, benefit, medical, legal, or discharge eligibility; avoid recruiting pressure, especially for minors. |
| Wage/career context | BLS OEWS/OOH; CareerOneStop only as a secondary convenience integration | BLS source/date/geography and SOC code | Show dated **occupation-and-area** wage context, not entry pay, provider outcomes, or a personal promise. |

## Record design: minimum data contract

Every public opportunity needs a stable internal ID and the following groups. This is the smallest schema that supports trustworthy comparison without claiming more than the evidence supports.

| Group | Required fields |
|---|---|
| Identity | `id`, `providerId`, `providerName`, `providerType`, optional external IDs (`unitid`, `opeid`, VA facility ID, sponsor ID) with namespace |
| Geography | `regionalAuthority`, `regionalBoundaryId`, `regionalBoundaryVersion`, physical location(s), country/subnational area, delivery mode, and a controlled `inRegion`/`remote-available` relationship — never a vague “nearby” boolean |
| Pathway | controlled pathway type (expand existing union for military-information and employer-linked training), credential/role, subject/occupation tags with SOC when a wage fact is used |
| Published facts | programme title, concise description, current-status state, published requirement text **as a quote-free summary with source link**, delivery, duration/cost state, next step, and explicit `unknown` where evidence is absent |
| Provenance | per-fact source URL, source label, authority tier, source/effective date when known, `reviewedAt`, reviewer ID, evidence state, and verification guidance |
| Safety | `mediaRightsState`, approved embed/asset reference, no student data, no sensitive eligibility fields, no provider-paid ranking field |
| Lifecycle | `draft` / `in-review` / `published` / `needs-recheck` / `retired`, content hash, record revision, stale-after date, and audit event |

### Required import rules

1. **Regional validation:** Every in-scope record must reference one of the five saved U.S. CBSA codes or the saved Greater Kingston Statistical Institute of Jamaica boundary record, with the authority version used to determine it. A remote opportunity needs its own explicit `remote-available` evidence; it does not inherit an area merely because a provider headquarters is there.
2. **Fact validation:** Required factual fields have evidence. A missing or conflicting fact is represented visibly as `unknown`, `stale`, or `conflicting`; it cannot be converted into a number or a fit score.
3. **Claims validation:** Reject phrases or fields that claim admission, enlistment, funding, placement, salary, or a student’s likelihood of success. Reject a direct `matchScore` or `acceptanceRate` as a ranking input. Existing legacy fields should be retired from new catalogue records rather than copied forward.
4. **Matching validation:** Test that only the student’s declared ordinary preferences (pathway, broad location choice, interests, affordability sensitivity) can order records. GPA/test score and similar qualifications may only produce a private “compare this published requirement” prompt; sensitive support data cannot enter the selector or sort input.
5. **Rights validation:** A provider page has a text/source link by default. Video/image references require a rights state and an approved provider embed or owned/licensed asset; never copy provider-site media into the repository by scraping.

## Update and freshness model

| Data class | Ingestion cadence | Publication rule | Stale policy |
|---|---|---|---|
| CBSA boundaries | On new OMB/Census delineation release; check quarterly | Staff approves a single geography-version update and runs impact diff | Existing metro membership remains tied to its stored version until reviewed; never silently recalculate. |
| IPEDS / College Scorecard | At official release; check quarterly | Seed/corroborate IDs and clearly dated institutional facts | Mark derivative metrics with source vintage; do not claim they are current programme availability. |
| Provider, sponsor, employer and state-authority records | Quarterly at minimum; before application/deadline campaigns | Human review of first-party URL and material facts | Default `needs-recheck` after 90 days for changing operational data; hide retired/nonexistent records, retain citation/audit history. |
| Apprenticeship openings | Do not import as durable catalogue facts unless the official sponsor confirms date/status | Link out with an “availability changes” warning | Recheck at least weekly if a time-limited opening is displayed; otherwise show the programme/sponsor, not an opening. |
| BLS OEWS wages | Annual release | Staff pins source year, SOC, metro definition, statistic, and warning text | Replace only in a reviewed source-version update; never interpolate salary or call it starting pay. |
| VA benefits / service information | Check official pages monthly and on VA/service policy update | Publish only broad, cited information and official next step | No eligibility calculation; route complex questions to an official/human resource. |

## External integrations: deliberately narrow

### Add now

- **None at learner request time.** Static approved snapshots and first-party links are the production integration.
- **Offline source adapters:** CSV/JSON/XML parsers for IPEDS, BLS, and Census release files; a documented, token-protected CareerOneStop adapter can be evaluated for discovery after terms, quotas, attribution, and geographic coverage are confirmed. Its Training V2 API requires a token and identifies provider/location results, so it is a candidate generator, not an authority override.
- **URL health check with rate limits and allowlist:** HEAD/GET only to URLs already approved by staff; run in CI/scheduled job, record response/redirect, and never scrape page contents or bypass access controls.

### Do not add in this milestone

| Do not add | Why |
|---|---|
| A general web scraper, browser automation, proxy, or “AI research agent” that publishes provider content | Breaks provenance, terms, freshness, and media-rights safeguards; could invent or misstate availability. |
| A live third-party catalogue/search API in learner page requests | Makes the experience nondeterministic, rate-limited, and hard to attribute/rehearse. |
| A new database, ORM, vector database, CMS, ETL platform, or search vendor | The six-area launch can be safely served from versioned snapshots. Add infrastructure only when measurable catalogue volume/edit concurrency defeats the current curated workflow. |
| A ranking/eligibility model, predictive score, or “best program” recommender | Violates the active recommendation-governance specification and risks discriminatory outcomes. |
| OAuth/API credentials for schools, employers, recruiters, or military services | Not required for citations/links; expands sensitive credential and student-data risk. |
| Provider media copying/downloading | Provider pages may use licensed media that they cannot sublicense. Use approved embeds or original/licensed Scholar Scout assets. |

## Alternatives Considered

| Category | Recommended | Alternative | Why not now |
|---|---|---|---|
| Publication model | Reviewed snapshot in repository/build | Live API aggregation | The source systems have different freshness, terms, identifiers, and availability guarantees; a snapshot is auditable and safe. |
| Schema validation | Dependency-free TypeScript validators | Zod/Ajv | Useful later if non-TypeScript staff tooling or external batch partners require JSON Schema. Current code already validates drafts with TypeScript functions and has no schema package. |
| Public data persistence | Static generated catalogue | Extend whole-document Blob as raw staging store | Raw/staging data, source revisions, and student accounts should not share an undifferentiated whole-document lifecycle. |
| Search | Existing filter/match surfaces over bounded data | Hosted full-text/vector search | Premature until catalogue scale and actual search latency justify it. |

## Installation

No production dependency is recommended for the first regional-catalogue slice.

```bash
# Validate a curated candidate snapshot (new project script to add in the implementation phase)
node scripts/catalogue/validate.mjs

# Generate the deployable public read model after validation
node scripts/catalogue/build-snapshot.mjs
```

If a later phase adds JSON Schema interchange for external editors, select a validator only after the schema is stable and document the reason in an ADR. Do not add it speculatively.

## Sources

- [NCES IPEDS — Use the Data](https://nces.ed.gov/Ipeds/use-the-data) — official IPEDS tools and complete/custom CSV data downloads. Confidence: MEDIUM.
- [College Scorecard institution data documentation](https://collegescorecard.ed.gov/files/InstitutionDataDocumentation.pdf) — privacy suppression, Title IV scope, and institutional aggregation caveats. Confidence: MEDIUM.
- [U.S. Census — Metropolitan and Micropolitan Delineation Files](https://www.census.gov/programs-surveys/metro-micro/about/delineation-files.html) and [current CBSA Gazetteer files](https://www.census.gov/geographies/reference-files/2026/geo/gazetter-file.html) — OMB/Census geography authority and releases. Confidence: MEDIUM.
- [Statistical Institute of Jamaica — Kingston Metropolitan Area communities and population](https://statinja.gov.jm/maps/kmacommunitiesandpopulation.html) — Greater Kingston boundary authority for this catalogue scope. Confidence: MEDIUM; freeze a checked authority version before publication.
- [Apprenticeship.gov Job Finder](https://www.apprenticeship.gov/apprenticeship-job-finder) and [data/statistics](https://www.apprenticeship.gov/data-and-statistics) — discovery labels, sponsor/program context, and aggregate statistics. Confidence: MEDIUM.
- [CareerOneStop Training V2 API — provider list](https://api.careeronestop.org/api-explorer/home/index/TrainingV2_GetTrainingProviderList) — authenticated discovery endpoint. Confidence: MEDIUM.
- [BLS May 2025 OEWS metropolitan estimates](https://www.bls.gov/OES/current/oessrcma.htm), [OEWS documentation](https://www.bls.gov/oes/oes_doc.htm), and [OOH data/republication guidance](https://www.bls.gov/ooh/about/ooh-developer-info.htm) — annual metro wage data, definitions, methods, and attribution. Confidence: MEDIUM.
- [VA — choosing a GI Bill-approved school](https://www.va.gov/resources/choosing-a-gi-bill-approved-school/) and [GI Bill Comparison Tool documentation](https://www.benefits.va.gov/gibill/comparison_tool/about_this_tool.asp) — approved-programme discovery and explicit planning-tool limitation. Confidence: MEDIUM.
