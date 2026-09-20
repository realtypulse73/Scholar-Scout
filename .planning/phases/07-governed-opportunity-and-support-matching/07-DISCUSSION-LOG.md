# Phase 7: Governed Opportunity and Support Matching - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents. Decisions are captured in `07-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-09-20
**Phase:** 07-governed-opportunity-and-support-matching
**Areas discussed:** Match purpose, Student control, Match cards

---

## Match purpose

| Option | Description | Selected |
|---|---|---|
| Programme/pathway with documented support bundle | Present a pathway and its documented support together. | ✓ |
| Separate opportunity and support results | Show disconnected pathway and resource result sets. | |
| Support first | Start from a support resource and then show pathways. | |

**User's choice:** Each result is a programme or pathway with its documented support bundle.

| Option | Description | Selected |
|---|---|---|
| Show with a verification prompt | Keep the pathway at the same rank when support is undocumented. | |
| Show but rank lower | Keep the pathway visible but lower it when requested support is undocumented. | ✓ |
| Hide it | Remove the pathway from results. | |

**User's choice:** Keep visible but rank lower.

**Clarification:** An initial request to infer any support that might help was not adopted because governance prohibits guessing a sensitive need. The selected safe alternative is documented support with explicit category selection.

| Option | Description | Selected |
|---|---|---|
| Documented supports with explicit category selection | Personalize only from programme/provider documentation and an explicit student selection. | ✓ |
| All documented supports without personalization | Show every documented support without using it for matching. | |
| Programme-provided supports only | Exclude linked independent providers. | |

**User's choice:** Documented supports with explicit category selection.

| Option | Description | Selected |
|---|---|---|
| Human or qualified-provider referral | Refer rather than rank a “best” programme for a high-stakes need. | ✓ |
| Normal matching with caution | Continue automated matching with a warning. | |
| Exclude sensitive categories | Do not support them at all. | |

**User's choice:** Human-advisor or qualified-provider referral.

---

## Student control

| Option | Description | Selected |
|---|---|---|
| Editable onboarding preferences | Use ordinary preferences, with student edit/clear controls. | ✓ |
| Ask every time | Require renewed confirmation before ordinary matching. | |
| No ordinary personalization | Do not personalize opportunities. | |

**User's choice:** Use editable onboarding preferences.

| Option | Description | Selected |
|---|---|---|
| Separate consent for referral only | Use a sensitive category only after purpose-specific consent and only for a referral. | ✓ |
| Use profile automatically | Treat existing profile information as general consent. | |
| Browser-only without referral | Never create a referral. | |

**User's choice:** Separate consent for a referral only.

| Option | Description | Selected |
|---|---|---|
| Do not save sensitive details | Use them once to find the referral, then discard them. | ✓ |
| Save a deletable referral profile | Retain a separate sensitive profile. | |
| Add to ordinary profile | Blend sensitive details into recommendation data. | |

**User's choice:** Do not save sensitive details.

| Option | Description | Selected |
|---|---|---|
| Open provider information without sharing data | Let the student decide whether to contact the provider. | ✓ |
| Recipient-specific referral message | Send a message only after another approval. | |
| Automatic referral | Send a referral after initial consent. | |

**User's choice:** Open provider information without sharing data.

---

## Match cards

| Option | Description | Selected |
|---|---|---|
| Two to four plain-language reasons | Explain each match in student-facing language. | ✓ |
| Overall fit score | Present one unexplained score. | |
| Technical factor breakdown | Present every internal ranking calculation. | |

**User's choice:** Two to four plain-language reasons.

| Option | Description | Selected |
|---|---|---|
| Fact, source, date, and verification prompt | Include a material fact, source link, date when available, and visible verification language. | ✓ |
| Source links only | Do not explain source age or verification. | |
| One page-level notice | Put a general notice only at the bottom. | |

**User's choice:** Fact, source, date, and verification prompt.

| Option | Description | Selected |
|---|---|---|
| Save, compare, visit source, alternate path | Preserve practical choices from every card. | ✓ |
| Visit source only | Provide no other direct actions. | |
| Start an application | Submit from Scholar Scout. | |

**User's choice:** Save, compare, visit source, and alternate path.

| Option | Description | Selected |
|---|---|---|
| State unknown and offer source/referral | Be explicit about missing, old, or conflicting information. | ✓ |
| Omit the section | Keep uncertainty hidden. | |
| Estimate from similar programmes | Guess from analogous records. | |

**User's choice:** State unknown/needs verification and offer a source or referral.

---

## the agent's Discretion

- Exact accessible layout, source-evidence schema, deterministic weighting, and test fixtures remain available to the implementation plan, constrained by the context decisions and governance document.

## Deferred Ideas

- Protected persistent sensitive-referral profiles, automated referrals, eligibility/admissions predictions, and application submission are not part of this phase.
