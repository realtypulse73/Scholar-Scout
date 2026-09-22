# Feature Landscape

**Domain:** Regional post-secondary and workforce opportunity navigator
**Researched:** 2026-09-22
**Confidence:** MEDIUM for external ecosystem findings; HIGH for Scholar Scout's governing product rules.

## Product Position

Scholar Scout v1.1 should be a student-controlled regional discovery and comparison tool, not a college-only directory, a recruitment funnel, or a prediction engine. A learner starts with a broad, visually engaging set of locally relevant pathways, then can slow down to compare verified details, understand what to confirm, save choices, and take an independently chosen next step.

The “TikTok-like” part is a short, optional transition-story format that helps a student imagine change. The “Realtor-style” part is the factual record: provider, programme, place, pathway type, source, date checked, status, requirements to verify, and action link. The facts must be visible without scrolling through a story or entering a profile.

## Table Stakes

Features students reasonably need in order to make a trustworthy, useful decision. Missing any of these makes the catalogue feel incomplete or unsafe.

| Feature | Why Expected | Complexity | Notes |
|---|---|---:|---|
| Choose or change a metro area | A regional catalogue must make the covered area explicit and never imply nationwide coverage. | Medium | Show official metro label, coverage note, and a clear way to change area. Do not infer location from ZIP code or device location. |
| Browse every pathway type together | Students need college, community college, trades, registered apprenticeship, employer-linked training, and military-information paths visible in one discovery surface. | High | Default to broad results; pathway filters refine, never lock a learner into one route. |
| Filter and sort by student-selected practical preferences | Students expect to narrow by route type, commute/delivery mode, cost sensitivity, schedule, field, and level. | Medium | Explain filters plainly and retain a “show all options” reset. Preferences may rank; they must not suppress pathway categories. |
| Factual opportunity card | A card must identify the provider/programme, route type, place or delivery mode, availability/status, and the source/review date. | High | A fact missing from a source is shown as `Unknown` or `Needs confirmation`, never guessed. |
| Save and compare | Shortlisting and side-by-side comparison are core actions in an expensive, multi-step decision. | Medium | Preserve existing shortlist foundations; compare source/date, published requirements, costs/aid information when available, delivery, supports, and next action. |
| Source-first provider detail page | Once a student chooses an option, they need verified provider-specific content, source links, and a direct official next step. | High | Use only provider-owned, licensed, approved, or appropriately embedded media. Never copy/scrape provider websites. |
| Requirements-to-verify checklist | Students need to see published entry requirements and what to ask next without being told they qualify or do not qualify. | Medium | A student may privately enter ordinary qualifications to highlight requirements to check. Every opportunity remains browseable. |
| Concrete next actions | Exploration must lead to an official provider page, application/contact route, appointment, open-house, aid question, or advisor referral. | Medium | Use neutral wording: “Check with the provider,” not “You are eligible” or “Apply now to secure your place.” |
| Transparent reasons and alternatives | A student needs to understand why a result appears and be able to view lower-cost, transfer, certificate, apprenticeship, or four-year alternatives. | Medium | Reasons are limited to stated preferences and verified programme facts. Never call a rank a likelihood of success. |
| Optional, purpose-separated support referral | Learners may need help locating accessibility, childcare, housing, aid, re-entry, language, or counselling resources. | High | Ask only when needed, explain the purpose, obtain explicit consent, and keep it out of ranking and provider disclosure. |
| Stale-information reporting and status | Catalogue facts change. Students need a visible review date, official source link, and a simple “this looks outdated” report. | Medium | Staff review workflow must make a record unavailable/unknown when it cannot be verified. |
| Mobile, keyboard, and motion-safe navigation | Many learners will use phones and some will be distracted or harmed by unbounded motion. | Medium | Respect reduced-motion settings, keep content usable at narrow widths, and provide one obvious pause/stop control for automatic non-essential motion. |

## Differentiators

Features that make Scholar Scout meaningfully more useful than a generic college search without changing it into a manipulative feed.

| Feature | Value Proposition | Complexity | Notes |
|---|---|---:|---|
| Transformation Signal discovery | A concise, optional visual story can make a pivot from everyday life into welding, barber training, remote learning, community college, university, or technical infrastructure work feel imaginable. | Medium | Scholar Scout owns this story layer. It must show no demographic as naturally suited to or excluded from any path, and never determine ranking. |
| “Story to facts” handoff | Every discovery frame can open a grounded record with source/date, location, provider, published requirements, verification questions, and alternatives. | High | This is the key bridge between TikTok-style attention and Realtor-style decision clarity. The factual record—not the story—is authoritative. |
| Whole-opportunity comparison | Students can compare two- and four-year programmes, apprenticeships, trades, employer-linked training, and military-information routes on a consistent fact model. | High | Do not force false equivalence: display each route's distinct facts and preserve missing/unknown states. |
| Student-controlled requirement lens | A learner can mark only the ordinary qualifications they choose to use, then see “requirements you may want to verify” rather than a verdict. | Medium | Keep all programmes visible and preserve an unpersonalized view. Raw GPA, test scores, prestige, and ZIP code are never used as eligibility gates or proxies. |
| Regional evidence lens | Each result says which approved metro it belongs to, how its location is in scope, and when the information was last checked. | High | Salary information, if shown, is dated occupation-and-area context from an authoritative source—not a provider claim or personal promise. |
| Choice-preserving alternative rail | A result can expose a student-selected alternate route such as lower-cost, transfer, certificate, apprenticeship, or four-year—not merely “more like this.” | Medium | This operationalizes breadth as a student action and makes narrowing reversible. |
| Human-first complex-case handoff | Where information conflicts or a choice carries high financial, transfer, disability, immigration, crisis, or aid risk, the product offers an appropriate human referral instead of pretending to decide. | Medium | Referral is advisory and opt-in. It never changes access to the catalogue. |
| Inclusive transition-story library | Scholar Scout journey pages can depict high-school-age learners, adults changing careers, and varied racial, rural, suburban, apartment, small-town, city, and re-entry contexts with dignity. | Medium | Daily-life scenes must not imply a learner already found a pathway (for example, by always using backpacks); provider-specific pages remain about the provider. |

## Anti-Features

The following should be explicitly excluded from v1.1 because they erode trust, conflict with governance, or create unmaintainable content risk.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Infinite feed, autoplay-to-next, streaks, or engagement-ranked stories | These turn discovery into attention capture; youth-facing products should not use dark-pattern-like pressure or passive engagement as a success metric. | Make stories finite, user-advanced, skippable, saveable, and easy to pause; prioritize compare/verify actions. |
| Personal success, admission, enlistment, aid, placement, or salary predictions | Scholar Scout lacks a validated basis for these claims and they can harm learners. | Show dated, attributable programme facts and a clear verification question. |
| Eligibility verdicts or hidden routes | Qualifications and personal circumstances are incomplete, changeable, and easily become unfair proxies. | Show published requirements to check, make all routes browseable, and surface optional supports separately. |
| Sensitive-data personalization | Disability, health, re-entry, housing, immigration, race, ethnicity, gender, childcare, language, and similar data must not affect rank, visibility, or provider disclosure. | Use explicit, purpose-specific, minimum-data support referral only. |
| Military recruitment targeting or eligibility decision | A military option deserves factual exploration, especially for adults and service-connected learners, but minors and adults should not be pressured or told they qualify. | Link to official service, Guard, Reserve, DoD, and VA sources with neutral “verify with an official representative” language. |
| Paid placement or provider-funded organic ranking | It compromises student control and conflicts with recommendation governance. | Keep organic ranking deterministic and explainable; if sponsorship is ever permitted, isolate and label it without altering results. |
| Provider-site scraping, copied catalogues, or unlicensed campus video | These create accuracy, copyright, and trust failures. | Store attributable facts from official/approved sources and use approved embeds or licensed/owned media only. |
| Unverified employer-training or AI-infrastructure promises | Employer programmes can change quickly, vary by location, and use marketing language. | Require employer-owned source plus local partner/workforce corroboration where possible; otherwise mark availability `Needs confirmation`. |
| Demographic or visual targeting of pathways | Showing a person in a story must never imply that their identity, neighbourhood, or circumstance determines which options are suitable. | Use representation intentionally in visual media while keeping search, comparison, and rank independent of identity. |
| National-coverage claim | Six regional areas are a meaningful initial scope, not a nationwide inventory. | Clearly label the six covered areas and offer neutral external resources for out-of-area exploration. |

## Feature Dependencies

```text
Official metro boundary + source authority
  → source-verified opportunity record + freshness status
    → universal browse/filter + factual cards
      → save/compare + provider detail pages + next-action checklist

Student-selected ordinary preferences
  → transparent reasons + optional requirement lens
    → choice-preserving alternative rail

Purpose-separated consent/data boundary
  → optional support referral

Original/licensed story media + motion controls
  → transformation discovery
    → story-to-facts handoff
```

## MVP Recommendation

Prioritize:

1. A source-verified, six-area opportunity record and browse/filter surface that keeps every pathway type available.
2. Factual cards, save/compare, provider pages, and a requirements-to-verify checklist with a source/date/unknown state.
3. A finite, motion-safe Transformation Signal layer that hands students from inclusive Scholar Scout stories to facts—not an endless feed.
4. Optional support referral only after the purpose-separated consent and non-ranking data boundary is implemented and tested.

Defer:

- National catalogue expansion until the six-area freshness/review process is proven.
- Automated provider ingestion, web scraping, individual outcome predictions, and any social or recruiter messaging mechanics.
- Advanced labour-market personalization until a source model, governance review, and fairness evaluation justify it.

## Sources

- Scholar Scout’s [Recommendation Governance Specification](../../docs/product-recommendation-governance.md) — **HIGH** authority for ranking, consent, choice, and claim boundaries.
- U.S. Department of Education, [College Scorecard institution-level data documentation](https://collegescorecard.ed.gov/assets/InstitutionDataDocumentation.pdf) — **MEDIUM** confidence, official source; supports factual college comparison rather than outcomes promises.
- U.S. Department of Labor, [Apprenticeship Job Finder](https://www.apprenticeship.gov/apprenticeship-job-finder) and [career-seeker guidance](https://www.apprenticeship.gov/career-seekers) — **MEDIUM** confidence, official source; supports current-opening labels and direct sponsor/employer handoff.
- W3C, [WCAG 2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) — **MEDIUM** confidence, primary accessibility guidance; supports user control of non-essential automatic motion.
- Federal Trade Commission, [Dark Patterns Workshop transcript](https://www.ftc.gov/system/files/documents/public_events/1586943/ftc_darkpatterns_workshop_transcript.pdf) — **MEDIUM** confidence, official discussion material; supports avoiding engagement-maximizing autoplay, obstruction, and endless-loop interaction patterns for young users.
