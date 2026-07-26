# Scholar Scout Recommendation Governance Specification

**Status:** Product and engineering baseline  
**Date:** 2026-07-26  
**Source inputs:** `.planning/.research/Student Potential Research Framework.md`, `.planning/.research/Student Opportunity Support Matching.md`, and `.planning/.research/Student Opportunity Platform Research Agenda.md`

## Product decision

Scholar Scout recommends **opportunity-and-support combinations** based on a student's stated goals, constraints, and the documented features of programmes. It helps a student compare viable next steps; it does not decide admission, eligibility, financial aid, employment, or a student's inherent potential.

The first release must not claim to discover "hidden talent," predict completion, infer aptitude from behaviour, or assign a universal potential score. Those claims require validation that Scholar Scout does not yet have.

## Evidence grades

These grades describe how safely a concept may guide this product today. They do not independently verify every citation in the source briefs.

| Grade | Meaning | Product treatment |
|---|---|---|
| A — established and low-risk | Directly supports student choice or transparent comparison without estimating personal capacity. | Release-one recommendation or explanation signal. |
| B — supported but context-dependent | Credible mechanism, but usefulness depends on accurate programme data and student choice. | Release-one guidance with clear provenance and verification prompts. |
| C — promising, not validated here | Plausible signal that needs a consented study before it affects ranking. | Optional pilot only; never a gate or eligibility proxy. |
| D — high-risk or unsupported | Vulnerable to bias, gaming, privacy harm, or unjustified inference. | Do not collect for ranking; do not infer or expose. |

## Governed signal inventory

| Signal or feature | Grade | Allowed use | Prohibited use |
|---|---|---|---|
| Student-selected interests, pathway, location, affordability sensitivity, and support preferences | A | Filter and rank options; explain the matching reason. | Treat as evidence of academic capability or eligibility. |
| Verified programme pathway, delivery, published cost, deadlines, transfer route, and documented support services | A | Compare options and produce verification checklists. | Present as guaranteed availability or outcome. |
| Student-selected support needs | B | Surface compatible services and referral choices using asset-based language. | Lower rank, label a student deficient, or disclose to providers without consent. |
| Programme completion, transfer, debt, placement, and support-capacity data from attributable primary sources | B | Display as dated comparison facts and quality cautions. | Convert incomplete data into a definitive quality score. |
| Contextualized academic measures, structured biodata, or learning-velocity activities | C | Voluntary research pilot with separate consent, human review, and fairness testing. | Rank, screen, or exclude students in the production recommendation engine. |
| Raw GPA, test scores, school prestige, or ZIP code | C/D | A student may use them privately to find published programme requirements. | Use as a standalone gate, proxy for potential, or reason to suppress ambitious pathways. |
| Disability, mental-health, housing, childcare, language, immigration, race, ethnicity, gender, or other protected/sensitive data | D for ranking | Voluntary support referral only, with purpose-specific consent and minimum necessary access. | Infer, rank, share externally, or use as a proxy for outcome/potential. |
| Essays, recommendation letters, free-form chat interpretation, device telemetry, or passive engagement logs | D | None for matching; students may retain their own notes locally. | Infer personality, motivation, aptitude, risk, or potential. |

## Required product behavior

### Student-facing explanations

Every ranked option must show:

1. The 2–4 student-selected or programme-verified reasons it appears.
2. At least one material fact to verify, with the date and source where available.
3. A plain-language support statement, such as "This programme lists peer tutoring; confirm availability and eligibility with the programme."
4. A choice-preserving action: save, compare, ask a question, or view a lower-cost/alternate path.

The interface must avoid deficit labels such as "high risk," "underprepared," or "not college material." Describe a structural requirement and the available support instead.

### Ranking and choice safeguards

- Always permit discovery of ambitious, lower-cost, transfer, apprenticeship, certificate, and four-year pathways. Do not hide a path because of a student's income, school, postcode, GPA band, or support request.
- Treat a lower fit as an invitation to verify conditions or consider a support bundle, not an automated rejection.
- Keep ranking deterministic and inspectable. A score may summarize stated preference alignment, but it must be decomposable into visible reasons and must not be called likelihood of success.
- Do not optimize ranking from clicks, dwell time, application conversion, or provider payment. These may be measured only as aggregate product-health events after privacy review.
- Do not accept paid placement in a ranking unless it is visually separate, clearly labeled, and never alters organic recommendations.

### Human referral triggers

The product must offer a human advisor, counsellor, or qualified provider rather than automate a conclusion when a student asks for clinical, disability, crisis, immigration, or complex financial guidance; when programme information is conflicting or materially incomplete; or when a choice creates high debt, credit-transfer, academic-dismissal, or aid-loss risk.

Human review is advisory. It may add context and resources, but it may not override the disclosure, consent, and non-discrimination safeguards above.

## Consent and data boundary

Use a purpose-separated data model:

- **Recommendation profile:** stated preferences needed to personalize results. A student can revise or delete it.
- **Support referral profile:** optional sensitive needs used only to locate support. Store and expose it separately from recommendation signals; no external sharing without an explicit recipient-specific action.
- **Research profile:** any contextual-potential or learning-velocity study. Require informed consent, a plain-language purpose, retention period, withdrawal path, and a statement that participation does not affect recommendations or access.

Do not collect a sensitive field "just in case." Existing persisted whole-document storage is not appropriate for newly collecting high-sensitivity data until purpose separation, access control, auditability, retention, and delete/export behavior are implemented and tested.

## Current Scholar Scout mapping

| Current surface | Release-one treatment | Required adjustment |
|---|---|---|
| `apps/web/lib/onboarding-types.ts` | Current preference and support fields are acceptable as student-controlled inputs. | Preserve the distinction between preferences and sensitive support referral data; do not add potential measures here. |
| `apps/web/lib/preference-matching.ts` | Its transparent interest, pathway, location, affordability, support, and access signals form the initial governed model. | Rename student-facing "fit score" language to preference alignment where practical; ensure every negative signal becomes a verification/support prompt, not a disqualifier. |
| `apps/web/lib/adaptive-recommendations.ts` | Shortlist and plan signals can improve recall of student-chosen options. | Do not treat browsing, notes, or engagement as aptitude or outcome evidence; make any ranking boost visible. |
| `apps/web/components/recommendations/RecommendationDashboard.tsx` | It can display transparent reasons, cautions, next actions, and comparison options. | Add source/date/unknown-data labels for programme facts and an advisor-referral route for material-risk cases. |
| `apps/web/lib/programmes.ts` and governed programme records | Programme facts and support listings are the basis for opportunity-and-support matching. | Add provenance, last-verified date, eligibility caveats, and an "unknown/not documented" state before calculating support-capacity comparisons. |
| `apps/web/app/api/account/onboarding/route.ts` and `lib/server/data-store.ts` | Existing account-backed profile persistence supports ordinary preferences. | Validate input server-side and complete the planned security/persistence work before saving any new sensitive or experimental data. |

## Release-one implementation slice

1. Create a programme-evidence schema for source URL, source type, last verified date, availability status, and unknown fields.
2. Update fit explanations to use "matches your stated preferences" rather than predictive language, and make each caution a concrete verification step.
3. Add visible support-bundle cards for documented tutoring, advising, aid, transit, childcare, housing, and accessibility resources; show "not documented" rather than guessing.
4. Add a privacy-reviewed human-referral flow for complex cases, with no sensitive details carried into the recommendation rank.
5. Log only aggregate, de-identified outcome metrics needed to assess whether explanations and referrals help students act.

## Measures and validation

Success is not clicks or profile completion alone. Assess the release-one model with the following measures, split by voluntarily reported and privacy-approved equity strata only when a suitable governance process exists:

| Outcome | Initial measure | Guardrail |
|---|---|---|
| Decision quality | Percentage of students who can correctly name why an option was shown and what they must verify. | Test comprehension, not trust or conversion. |
| Opportunity breadth | Mix of viable pathway types viewed, saved, and compared. | Detect systematic suppression of ambitious or low-cost routes. |
| Support follow-through | Student-confirmed connection to a listed support or advisor. | Never infer from sensitive status or expose referral identity. |
| Information quality | Rate of stale, disputed, or unavailable programme facts. | Remove/flag a record before it can be treated as verified. |
| Equity | Difference in explanation clarity, option breadth, and referral completion across approved audit groups. | Investigate disparities; do not use group membership to personalize rank. |

Before a Grade C pilot changes any recommendation, preregister the hypothesis; test incremental value over current preference alignment; evaluate subgroup reliability and disparate impact; conduct human review of errors; and publish a decision to retain, revise, or remove the feature. A randomized or strong quasi-experimental design is required before claiming that Scholar Scout causes completion, earnings, or mobility gains.

## Claims catalogue

Scholar Scout may say: "These options align with the preferences you shared and the programme details we have verified." It may say: "This path may work better when paired with these documented supports; confirm availability directly."

Scholar Scout may not say: "You are likely to succeed here," "we found your potential," "this is the best path for you," or "this programme is safe/high-quality" unless each claim is separately supported by a validated, attributable method and subject to the appropriate human governance.

## Review cadence and ownership

Product owns student-facing language and scope. Data operations owns source provenance and freshness. Security/privacy owns sensitive-data boundaries and referral consent. An advisor or student-success lead owns referral content. Any change to a Grade C/D signal, ranking objective, provider incentive, or sensitive-data flow requires documented review before release.

Review this specification at least quarterly and whenever the recommendation engine, data model, provider relationships, or applicable policy changes.
