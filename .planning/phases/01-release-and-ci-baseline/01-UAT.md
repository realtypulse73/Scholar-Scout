---
status: testing
phase: 01-release-and-ci-baseline
source: [01-VERIFICATION.md]
started: 2026-07-26T00:00:00-04:00
updated: 2026-07-26T02:10:00-04:00
---

## Current Test

number: 5
name: Controlled smoke-failure response
expected: |
  A safe controlled smoke-failure exercise creates or updates the incident issue,
  retains evidence, and records a human rollback acknowledgement without automatic rollback.
awaiting: explicit authorization for a safe production failure exercise

## Tests

### 1. Draft pull request quality checks

expected: A draft pull request shows passing build, typecheck, lint, Jest, HTTP fixture, and production-tooling checks.
result: pass
evidence: "PR #10 CI run 30187775624 passed all six named Scholar Scout jobs."

### 2. Main branch protection

expected: The GitHub main ruleset requires pull requests, an up-to-date branch, and the six Scholar Scout checks, preventing direct pushes.
result: pass
evidence: "GitHub main branch protection requires an up-to-date pull request and the six Scholar Scout checks; enforcement includes administrators."

### 3. Vercel production build

expected: A main-branch production deployment uses the Corepack/pnpm frozen-install path and records a successful build.
result: pass
evidence: "Vercel production redeploy 88PRmSZjhkMH8VrA1m2Z3TU99wTp for main commit 0e89216 completed Ready using the committed Corepack/pnpm build path and new Production environment."

### 4. Production smoke success evidence

expected: A Vercel production-success event dispatches the smoke workflow against the configured stable public production domain and retains the smoke artifact.
result: pass
evidence: "GitHub Actions run 30190594818 (repository_dispatch, commit 0e89216) passed 7 checks with 3 optional skips and uploaded production-smoke-report artifact 8628423729."

### 5. Controlled smoke-failure response

expected: A safe controlled smoke-failure exercise creates or updates the incident issue, retains evidence, and records a human rollback acknowledgement without automatic rollback.
result: pending

## Summary

total: 5
passed: 4
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

None recorded.
