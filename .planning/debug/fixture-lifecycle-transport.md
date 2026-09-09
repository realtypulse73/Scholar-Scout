---
status: fixed-pending-external-verification
trigger: "Protected Preview fixture lifecycle returns fixture-lifecycle-transport-failed in the GitHub Actions prelaunch rehearsal."
created: 2026-09-09T00:00:00-04:00
updated: 2026-09-09T01:00:00-04:00
---

## Current Focus

hypothesis: "Node fetch's no-body POST carries Content-Length: 0, which the route currently denies even though it cannot contain a request body."
test: "Route regression invokes the lifecycle POST with the exact runner headers and Content-Length: 0, while body-bearing input remains denied."
expecting: "The protected runner can provision the fixture after a fresh Preview deploy; nonzero or body-bearing requests remain denied."
next_action: "Deploy the corrected immutable candidate and rerun the authorized protected Preview rehearsal."

## Symptoms

expected: "The GitHub Actions protected Preview runner provisions, verifies, traces, and cleans the generated fixture against the selected immutable Preview candidate."
actual: "Candidate quality, high-risk coverage, and the local browser proof pass; the protected Preview browser lane writes a scrubbed fixture-lifecycle-transport-failed record before the outage lane runs."
errors: "fixture-lifecycle-transport-failed"
started: "Observed during the Phase 6 protected Preview rehearsal on 2026-09-09."
reproduction: "Dispatch the prelaunch-rehearsal workflow for the isolated protected Preview candidate with runner-only fixture capability and deployment-protection material."

## Eliminated

## Evidence

- timestamp: 2026-09-09T06:00:00Z
  observation: "The existing GitHub Actions run recorded fixture-lifecycle-transport-failed without disclosing a raw exception; its job log contained no additional safe network detail."
- timestamp: 2026-09-09T06:00:00Z
  observation: "A synthetic unauthenticated request to the selected protected Preview was redirected to Vercel login rather than the lifecycle endpoint. No real capability or bypass value was used."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Focused lifecycle tests (18) and production-tooling tests (22) pass after redirect and opaque-value handling coverage was added."
- timestamp: 2026-09-09T06:00:00Z
  observation: "A managed-bypass lifecycle probe reached the protected application but POST/DELETE were denied while GET reached fixture verification. The strict route rejects every Content-Length header."
- timestamp: 2026-09-09T06:00:00Z
  observation: "The route regression with Content-Length: 0 and exact runner headers passes after allowing only that zero-length value; body-bearing input remains denied."

## Resolution

root_cause: "The lifecycle route treated Content-Length: 0 as evidence of a body. Node fetch adds that header for a no-body POST, so a valid protected runner provisioning request was denied before fixture creation. Redirect handling and opaque boundary-value normalization remain defense-in-depth hardening."
fix: "Allow only Content-Length: 0 for an otherwise no-body lifecycle request; continue denying any nonzero length, body, content type, transfer encoding, query, browser metadata, or selector. Retain manual redirect and runner-value normalization hardening."
verification: "pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts (7 passed); node --test scripts/e2e-fixture-lifecycle.test.mjs scripts/preview-deployment-protection.test.mjs (11 passed); previous production-tooling run passed 22 tests."
files_changed: ["apps/web/app/api/internal/e2e-fixture/route.ts", "apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts", "scripts/e2e-fixture-lifecycle.mjs", "scripts/e2e-fixture-lifecycle.test.mjs", "scripts/preview-deployment-protection.mjs", "scripts/preview-deployment-protection.test.mjs"]
