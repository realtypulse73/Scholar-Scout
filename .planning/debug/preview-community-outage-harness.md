---
status: fixing
trigger: "Phase 5 requires a Preview-only authenticated community-provider outage/no-write UAT, but invalidating the shared Upstash configuration also blocks sign-in before a student session exists."
created: 2026-08-30
updated: 2026-08-30
---

## Symptoms

- expected: "A generated Preview-only student can sign in normally, then community note and inbox submissions fail closed without a persistence write while the provider-outage condition is active."
- actual: "The prior invalid-Upstash Preview failed closed before sign-in because credentials and community submissions use the shared reservation provider."
- error_messages: "Community submissions are temporarily unavailable."
- timeline: "Observed during Phase 5 live UAT on 2026-08-29."
- reproduction: "Deploy an isolated Preview with invalid Upstash values, then attempt student sign-in followed by a community submission."

## Current Focus

hypothesis: "A Preview-only, community-scoped outage switch can return the existing fail-closed reservation result before the community provider call while leaving credentials reservations untouched."
falsification_test: "Focused rate-limit and route tests prove the switch is ignored outside Vercel Preview and that both community routes return 503 before their store write."
next_action: "Commit the narrow Preview-only switch and regression coverage, then create an isolated Preview deployment with a per-deployment runtime override."

## Evidence

- timestamp: 2026-08-30
  observation: "Five alternating configured-Upstash Preview submissions succeeded and a sixth was rejected without a remaining count."
- timestamp: 2026-08-30
  observation: "The apparent session-persistence failure was not reproduced through normal client navigation: the authenticated student session remained available across application links."
- timestamp: 2026-08-30
  observation: "The existing invalid-provider Preview cannot prove authenticated community no-write behavior because the shared provider is consulted before credential verification."
- timestamp: 2026-08-30
  observation: "Focused tests confirm the new switch returns unavailable without calling the community limiter, while the sign-in reservation remains allowed; community-route tests confirm unavailable results return 503 before either store write."

## Eliminated

- hypothesis: "The Preview application loses authenticated sessions during normal app navigation."
  reason: "A generated student remained authenticated while navigating through ScholarScout links to the uploader’s inbox/note surface."

## Resolution

- root_cause: ""
- fix: ""
- verification: ""
