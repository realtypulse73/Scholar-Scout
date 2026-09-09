---
status: blocked-external-verification
trigger: "Protected Preview fixture lifecycle returns fixture-lifecycle-transport-failed in the GitHub Actions prelaunch rehearsal."
created: 2026-09-09T00:00:00-04:00
updated: 2026-09-09T01:00:00-04:00
---

## Current Focus

hypothesis: "The lifecycle request must not carry the browser-only bypass-cookie header because Vercel correctly redirects that request, while the lifecycle transport correctly rejects redirects."
test: "Protected-runner regressions prove direct lifecycle transport retains only the bypass header, while Playwright retains cookie setup."
expecting: "The protected runner provisions directly and the browser receives its bypass cookie independently."
next_action: "An authorized Vercel maintainer must verify the deployment-protection bypass material against the project and then rerun the protected Preview rehearsal."

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
- timestamp: 2026-09-09T06:00:00Z
  observation: "The hardened manual-redirect transport continued to record provisioning failure because the lifecycle request also carried x-vercel-set-bypass-cookie. Vercel uses that browser-only header to redirect after setting a cookie."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Nineteen focused lifecycle/protection/tracer tests and twenty-two production-tooling tests pass after separating direct lifecycle headers from browser context headers."
- timestamp: 2026-09-09T06:00:00Z
  observation: "Fresh isolated baseline and outage Previews for candidate f0fbfe970851f2b1d849862145c7ba3ef57c3215 were Ready. The authorized workflow reached the protected browser lane but recorded only fixture-provision-failed; the outage and aggregation lanes remained fail-closed and did not run."

## Resolution

root_cause: "Two valid runner request details were denied: Node fetch adds Content-Length: 0 to a no-body POST, and the lifecycle transport reused the browser-only x-vercel-set-bypass-cookie header. The route interpreted the former as a body; Vercel correctly redirects the latter while the lifecycle transport correctly rejects redirects."
fix: "Allow only Content-Length: 0 for an otherwise no-body lifecycle request, and use only the direct protection-bypass header for lifecycle transport. Keep bypass-cookie setup only in the Playwright browser context. All nonzero/body-bearing lifecycle input, browser metadata, selectors, and redirects remain fail-closed."
verification: "pnpm --filter @scholar-scout/web test --runInBand __tests__/app/api/internal/e2e-fixture/route.test.ts (7 passed); node --test scripts/e2e-fixture-lifecycle.test.mjs scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs scripts/run-preview-outage-rehearsal.test.mjs (19 passed); pnpm test:production-tooling (22 passed). External rehearsal 34320893425 remains blocked at a scrubbed fixture-provision-failed result."
files_changed: ["apps/web/app/api/internal/e2e-fixture/route.ts", "apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts", "scripts/e2e-fixture-lifecycle.mjs", "scripts/e2e-fixture-lifecycle.test.mjs", "scripts/preview-deployment-protection.mjs", "scripts/preview-deployment-protection.test.mjs", "scripts/run-preview-release-tracer.mjs", "scripts/run-preview-outage-rehearsal.mjs", "scripts/run-preview-release-tracer.test.mjs", "scripts/run-preview-outage-rehearsal.test.mjs"]
