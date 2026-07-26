---
status: testing
phase: 01-release-and-ci-baseline
source: [01-VERIFICATION.md]
started: 2026-07-26T00:00:00-04:00
updated: 2026-07-26T00:00:00-04:00
---

## Current Test

number: 1
name: Draft pull request reports all six Scholar Scout quality checks
expected: |
  A draft pull request shows the six independently named Scholar Scout checks
  from GitHub Actions and each check passes.
awaiting: user response

## Tests

### 1. Draft pull request quality checks

expected: A draft pull request shows passing build, typecheck, lint, Jest, HTTP fixture, and production-tooling checks.
result: pending

### 2. Main branch protection

expected: The GitHub main ruleset requires pull requests, an up-to-date branch, and the six Scholar Scout checks, preventing direct pushes.
result: pending

### 3. Vercel production build

expected: A main-branch production deployment uses the Corepack/pnpm frozen-install path and records a successful build.
result: pending

### 4. Production smoke success evidence

expected: A Vercel production-success event dispatches the smoke workflow against that deployment URL and retains the smoke artifact.
result: pending

### 5. Controlled smoke-failure response

expected: A safe controlled smoke-failure exercise creates or updates the incident issue, retains evidence, and records a human rollback acknowledgement without automatic rollback.
result: pending

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

None recorded.
