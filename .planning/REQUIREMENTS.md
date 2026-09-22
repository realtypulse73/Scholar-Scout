# Requirements: Scholar Scout v1.1 Regional Opportunity Navigator

**Defined:** 2026-09-22
**Core Value:** Students can confidently discover and act on the education pathways that fit their goals and circumstances.

## v1.1 Requirements

### Regional catalogue scope

- [x] **REG-01**: A student can explicitly choose Greater Houston, Greater Chicago, Greater Buffalo, Greater Atlanta, Greater New Orleans, or Greater Kingston, Jamaica and see the catalogue’s exact official regional boundary, authority, source, and boundary-release/check date.
- [x] **REG-02**: A student can browse university, community-college, trade/career-school, registered-apprenticeship, employer-linked-training, and military-information paths in every selected metro without one class being hidden by default.
- [x] **REG-03**: A student can see an honest coverage state for each metro and pathway class, including `Not yet verified`, rather than a fabricated or implied local offering.

### Source evidence and freshness

- [x] **EVID-01**: Every material fact shown on an opportunity card or provider page has its own attributable source, authority type, source/review date, factual status, and direct verification action.
- [x] **EVID-02**: A student can distinguish `Current`, `Needs confirmation`, `Unknown`, and `Conflicting` facts; stale or conflicting facts never appear confirmed.
- [ ] **EVID-03**: A staff member can review an opportunity’s source, required evidence, freshness state, and claim boundaries before it becomes public.
- [ ] **EVID-04**: The published catalogue is a deterministic, versioned reviewed snapshot; learner-facing requests do not scrape, aggregate, or depend on a live provider site.
- [ ] **EVID-05**: If occupation-and-area wage context is shown, it is dated, source-linked context and clearly not a provider promise or personal salary forecast.

### Governed publication

- [ ] **PUB-01**: Only active authorized staff can create, revise, publish, retire, or restore catalogue records, with validation and audit evidence for each state-changing action.
- [ ] **PUB-02**: A source, claim, boundary, or media-rights failure blocks publication and gives staff a recoverable correction path without silently discarding a valid current record.
- [ ] **PUB-03**: Staff can publish a small validated batch with conflict-safe recovery rather than rewriting an unbounded shared document or automatically publishing imported content.

### Choice-preserving discovery

- [ ] **DISC-01**: A student can browse, filter, save, compare, and open an official next action for opportunities without signing in or completing a story first.
- [ ] **DISC-02**: A student can see a provider, pathway type, delivery/place relationship, published status, reasons to consider it, facts to verify, source/date/status, and alternate paths on every detailed opportunity surface.
- [ ] **DISC-03**: Ordering and filters remain reversible; they do not infer a student’s residence, use passive behaviour, or suppress an opportunity or pathway class.
- [ ] **DISC-04**: Discovery, comparison, provider detail, stale/unknown states, and external-link actions are keyboard-accessible, screen-reader understandable, and usable without horizontal page overflow on supported phone and tablet sizes.

### Qualification and claim safety

- [ ] **MATCH-01**: A student can optionally use ordinary qualifications they deliberately provide—such as diploma/credits, degree, licence, prior work, or voluntary military history—to highlight published requirements they should verify.
- [ ] **MATCH-02**: Qualification information never produces an eligible/ineligible, realistic/safe-match, admission, enlistment, funding, placement, salary, or outcome verdict and never hides an opportunity.
- [ ] **MATCH-03**: Every ranked option shows decomposable student-selected or programme-verified reasons, a material verification step, a plain-language support statement, and a choice-preserving action.
- [ ] **MATCH-04**: GPA, test scores, school prestige, ZIP code, click behaviour, passive engagement, and similar proxies cannot rank or hide opportunities.

### Sensitive support and military information

- [ ] **SAFE-01**: A student can voluntarily open a purpose-specific support-referral panel for sensitive circumstances without that selection changing rank, being inferred, being persisted with the recommendation profile, or being disclosed to a provider.
- [ ] **SAFE-02**: A sensitive-referral panel cannot send a request, write browser storage, add an analytics field/query parameter, or reveal a destination until the student explicitly chooses an approved public human/provider information link.
- [ ] **SAFE-03**: Military-information content uses approved official sources and neutral language, provides a human-verification action, and makes no recruiting-pressure, personal eligibility, or enlistment-outcome claim; minor-facing content uses the separately approved safety wording.

### Provider details, storytelling, and media

- [ ] **MEDIA-01**: A provider detail page uses factual provider-specific content with official sources and displays media only when stored rights evidence identifies it as Scholar Scout-owned, licensed, provider-approved, or an approved embed.
- [ ] **MEDIA-02**: A provider page falls back to factual text and source links when media rights are unknown, expired, revoked, or unsupported.
- [ ] **MEDIA-03**: Scholar Scout-owned transition stories are finite, inclusive, non-authoritative, and motion-safe; they connect students to factual opportunities without implying that a pictured person attended, was placed by, or is endorsed by a provider.

### Operations and release assurance

- [ ] **OPS-06**: Staff can see source-change, link-health, freshness, media-rights, and metro/pathway coverage reports before a record is presented as current.
- [ ] **OPS-07**: The catalogue has automated validation for source, freshness, claims, choice preservation, referral separation, rights fallbacks, and accessible states, plus Preview and human source/rights/accessibility review before launch.

## Future Requirements

### Catalogue scale and platform

- **CAT-01**: Expand beyond the six approved regional areas after the same source, review, and coverage gates are satisfied.
- **CAT-02**: Introduce a narrow independent catalogue persistence model only after measured snapshot volume, revision frequency, or staff concurrency exceeds the safe current boundary.
- **CAT-03**: Offer privacy-approved aggregate measures of decision clarity, option breadth, source quality, and referral usefulness; do not use engagement/conversion to rank options.

### Deeper student services

- **SUP-01**: Add recipient-specific support referral or booking only after consent, retention, withdrawal, access, audit, delete/export, and provider handoff requirements are separately designed and approved.
- **SUP-02**: Add personalized financial-aid or eligibility guidance only after a distinct legal, data-lifecycle, and human-review design; it is not part of v1.1.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated admission, eligibility, enlistment, funding, job, salary, placement, or outcome decision | The product shows published facts and verification actions; it does not decide a student’s future. |
| Provider-site scraping, live learner-facing aggregation, or automatic publishing | Curated, reviewed snapshots keep the catalogue safe, repeatable, and rights-aware. |
| Sensitive-data ranking, inference, profiling, or external provider disclosure | Personal circumstances may support a voluntary referral only; they are never a recommendation signal. |
| Paid organic placement, recruitment pressure, or application submission funnel | Discovery must preserve student agency and broad choice. |
| Unlicensed/uncertain provider media or an infinite/autoplay feed | Provider rights and accessible, controllable motion are required. |
| National rollout, a new database/ORM/CMS, hosted search, or prediction system | The six-area, governed launch should prove the bounded catalogue model first. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REG-01 | Phase 9 | Complete |
| REG-02 | Phase 9 | Complete |
| REG-03 | Phase 9 | Complete |
| EVID-01 | Phase 9 | Complete |
| EVID-02 | Phase 9 | Complete |
| EVID-03 | Phase 10 | Pending |
| EVID-04 | Phase 10 | Pending |
| EVID-05 | Phase 9 | Pending |
| PUB-01 | Phase 10 | Pending |
| PUB-02 | Phase 10 | Pending |
| PUB-03 | Phase 10 | Pending |
| DISC-01 | Phase 11 | Pending |
| DISC-02 | Phase 11 | Pending |
| DISC-03 | Phase 11 | Pending |
| DISC-04 | Phase 11 | Pending |
| MATCH-01 | Phase 12 | Pending |
| MATCH-02 | Phase 12 | Pending |
| MATCH-03 | Phase 12 | Pending |
| MATCH-04 | Phase 12 | Pending |
| SAFE-01 | Phase 14 | Pending |
| SAFE-02 | Phase 14 | Pending |
| SAFE-03 | Phase 14 | Pending |
| MEDIA-01 | Phase 13 | Pending |
| MEDIA-02 | Phase 13 | Pending |
| MEDIA-03 | Phase 13 | Pending |
| OPS-06 | Phase 15 | Pending |
| OPS-07 | Phase 15 | Pending |

**Coverage:**

- v1.1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-22*
*Last updated: 2026-09-22 after v1.1 research synthesis*
