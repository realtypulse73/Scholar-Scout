---
status: verified
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
next_action: "Closed. Keep the isolated Preview available only as retained UAT evidence; no global configuration restore is required because its outage override is deployment-scoped."

## Evidence

- timestamp: 2026-08-30
  observation: "Five alternating configured-Upstash Preview submissions succeeded and a sixth was rejected without a remaining count."
- timestamp: 2026-08-30
  observation: "The apparent session-persistence failure was not reproduced through normal client navigation: the authenticated student session remained available across application links."
- timestamp: 2026-08-30
  observation: "The existing invalid-provider Preview cannot prove authenticated community no-write behavior because the shared provider is consulted before credential verification."
- timestamp: 2026-08-30
  observation: "Focused tests confirm the new switch returns unavailable without calling the community limiter, while the sign-in reservation remains allowed; community-route tests confirm unavailable results return 503 before either store write."
- timestamp: 2026-08-30
  observation: "Isolated Vercel Preview deployment dpl_8GPxTpWo3eF7y6F6hYfDQCJVvDqt is Ready at https://scholar-scout-blyr7m7yb-scholar-scout.vercel.app with the per-deployment outage flag and fresh non-secret Blob data path. Its public student surface loaded successfully."
- timestamp: 2026-08-30
  observation: "A generated non-personal student signed in through normal application links. One clearly marked note returned the existing unavailable status, remained visibly in its form, and did not appear as a posted note. One clearly marked inbox request returned its existing unavailable status and remained visibly in its form; no inbox success state appeared."

## Eliminated

- hypothesis: "The Preview application loses authenticated sessions during normal app navigation."
  reason: "A generated student remained authenticated while navigating through ScholarScout links to the uploader’s inbox/note surface."

## Resolution

- root_cause: "The invalid-Upstash failure injection was shared by credential sign-in and community writes, so it failed before an authenticated community action could be exercised. The apparent session loss was browser direct-navigation behavior, not an application session-persistence defect."
- fix: "Added SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1, honored only when VERCEL_ENV=preview, to return the existing unavailable community reservation result before contacting the community limiter. Sign-in reservation behavior is unchanged."
- verification: "Focused rate-limit and campus-community route tests passed; typecheck and lint passed. On isolated Preview dpl_8GPxTpWo3eF7y6F6hYfDQCJVvDqt, an authenticated generated account submitted exactly one marked note and one marked inbox request. Both returned unavailable, preserved their drafts, and produced no success state; the route tests verify unavailable responses precede both persistence writes. The override was per-deployment only, so no project-level or production configuration was changed or requires restoration."
