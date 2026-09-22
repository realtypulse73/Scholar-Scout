---
phase: 07
status: blocking-before-public-release
owner: product-and-student-success
---

# Pre-Launch Referral Release Gate

Phase 07 contains deliberately non-live `*.invalid` referral fixtures only. They are
test data, not provider recommendations, availability claims, or public destinations.

## Required evidence before public release

For every fixture that is replaced or enabled, complete one review record in the
pre-launch release evidence. A record must contain all of the following:

| Required field | What the reviewer records |
| --- | --- |
| Source | A source-linked information or contact destination and the evidence that supports it. |
| Displayed label | The exact label displayed to students. |
| Accountable content owner | The named owner responsible for keeping the destination current. |
| Availability or jurisdiction | The service area, eligibility, or jurisdiction a student must verify. |
| Review date | The date the destination and supporting evidence were reviewed. |
| Accessibility/contact-path review | Confirmation that the destination has an accessible way to obtain current contact or service information. |
| Consent-copy review | Confirmation that the student-facing copy says no personal information is transferred automatically. |
| Human sign-off | Product, privacy, and student-success sign-off with the approved evidence identifier or link. |

## Required privacy confirmation

Before public release, confirm that the referral interaction:

- sends no student identity, profile answer, or selected support area automatically;
- requires an explicit recipient-specific student action before any external transfer;
- does not influence opportunity ranking or explanations; and
- does not retain sensitive support selections in the recommendation profile, browser
  storage, analytics, URL/query data, or referral records.

## Blocking rule

Do not publicly release a referral destination until every required evidence item and
privacy confirmation above is complete. Missing or stale information keeps the
destination disabled and visibly test-only. The authoritative production readiness
checklist, release runbook, and prelaunch evidence template all require this record
before any public referral destination can be enabled.
