---
status: fixed-pending-external-verification
trigger: "Protected Preview fixture lifecycle returns fixture-lifecycle-transport-failed in the GitHub Actions prelaunch rehearsal."
created: 2026-09-09T00:00:00-04:00
updated: 2026-09-09T01:00:00-04:00
---

## Current Focus

hypothesis: "The lifecycle client must fail closed if Vercel protection redirects it away from the exact endpoint, while runner-owned opaque values must be normalized without disclosure."
test: "Regression tests verify manual redirect handling and boundary-whitespace normalization; a synthetic unauthenticated request confirms the protected Preview redirects to Vercel login."
expecting: "A rerun from GitHub Actions will now reject any protection redirect as provisioning failure and proceed only on a direct authorized endpoint response."
next_action: "Rerun the protected Preview rehearsal from an authorized maintainer workflow; do not change provider settings in this debug session."

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

## Resolution

root_cause: "The lifecycle client followed protection redirects, allowing an authentication gateway response to masquerade as a successful lifecycle response; it also did not normalize boundary whitespace on opaque runner-owned values. The original transport category contains no raw cause, so external rerun is still required to confirm the provider-side path."
fix: "Use manual redirects for lifecycle requests and normalize only surrounding whitespace on runner-owned bypass and fixture capability values; add regression tests."
verification: "node --test scripts/e2e-fixture-lifecycle.test.mjs scripts/preview-deployment-protection.test.mjs scripts/run-preview-release-tracer.test.mjs scripts/run-preview-outage-rehearsal.test.mjs (18 passed); pnpm test:production-tooling (22 passed)."
files_changed: ["scripts/e2e-fixture-lifecycle.mjs", "scripts/e2e-fixture-lifecycle.test.mjs", "scripts/preview-deployment-protection.mjs", "scripts/preview-deployment-protection.test.mjs"]
