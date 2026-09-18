---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 09
subsystem: release-attestation
tags: [github-deployments, vercel-preview, release-gate, github-actions]
requires:
  - phase: 06-08
    provides: Observed Vercel GitHub Deployment/status identity semantics and 900-second freshness policy.
provides:
  - Fresh, unique GitHub Deployment/status attestation before Preview rehearsal traffic.
  - Step-scoped read-only GitHub deployment token wiring for both Preview lanes.
affects: [06-10, preview-rehearsal, release-evidence]
tech-stack:
  added: []
  patterns: [Injected GitHub API fetcher, fail-closed trusted target attestation, step-scoped Actions token.]
key-files:
  created:
    - scripts/preview-deployment-attestation.mjs
    - scripts/preview-deployment-attestation.test.mjs
  modified:
    - scripts/preview-deployment-protection.mjs
    - scripts/run-preview-release-tracer.mjs
    - scripts/run-preview-outage-rehearsal.mjs
    - .github/workflows/prelaunch-rehearsal.yml
key-decisions:
  - "Treat only a fresh, unique Vercel GitHub Deployment/status match as a trusted Preview target."
  - "Pass github.token only to the two attestation runner steps with deployments: read permission."
patterns-established:
  - "Preview runners return a fixed scrubbed failure without a target when attestation rejects."
  - "Historical statuses may be observed, but only a fresh matching status can authorize traffic."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: Fresh unique Vercel Preview status attestation rejects stale, malformed, wrong, or tied provider records.
    requirement: OPS-04
    verification:
      - kind: unit
        ref: node --test scripts/preview-deployment-attestation.test.mjs scripts/preview-deployment-protection.test.mjs
        status: pass
    human_judgment: false
  - id: D2
    description: Baseline and outage Preview runners attest before any lifecycle, browser, or outage traffic and keep tokens out of outcomes.
    requirement: PROD-04
    verification:
      - kind: integration
        ref: node --test scripts/run-preview-release-tracer.test.mjs scripts/run-preview-outage-rehearsal.test.mjs
        status: pass
      - kind: integration
        ref: pnpm test:production-tooling
        status: pass
    human_judgment: false
duration: 39min
completed: 2026-09-18
status: complete
---

# Phase 6 Plan 09: Trusted Preview Deployment Attestation Summary

**GitHub Deployment/status attestation now authorizes each Preview rehearsal target before protected lifecycle, browser, or outage traffic can begin.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-09-18T21:55:00Z
- **Completed:** 2026-09-18T22:34:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added paginated GitHub Deployment/status attestation that accepts only one fresh Vercel `Preview` status for the exact candidate SHA and normalized target URL.
- Replaced runner-supplied Preview metadata with independent attestation before baseline lifecycle/browser and outage traffic.
- Scoped the read-only GitHub deployment token to the two Preview runner steps, with workflow tests guarding against job-level tokens and old metadata shortcuts.

## Task Commits

1. **Task 1: Attest the newest unique Vercel Preview status** - `494c9ea` (test), `84236d8` (feat)
2. **Task 2: Pass GitHub token only to attestation at each Preview runner step** - `101f4d6` (test), `35a7205` (feat)

## Files Created/Modified

- `scripts/preview-deployment-attestation.mjs` - Paginated, fresh, unique GitHub Deployment/status resolver with scrubbed failures.
- `scripts/preview-deployment-attestation.test.mjs` - Deterministic freshness, tie, pagination, malformed identity, and disclosure tests.
- `scripts/preview-deployment-protection.mjs` - Requires the attested descriptor rather than runner metadata.
- `scripts/run-preview-release-tracer.mjs` - Attests before fixture/browser work and emits target-free attestation failures.
- `scripts/run-preview-outage-rehearsal.mjs` - Applies the same no-traffic attestation gate to the outage lane.
- `.github/workflows/prelaunch-rehearsal.yml` - Requires distinct baseline/outage URLs and scopes `github.token` to runner steps.

## Decisions Made

- The newest unique fresh successful status decides target trust; ties, stale records, future/invalid timestamps, wrong URL/SHA, and missing provider data stop the rehearsal.
- Attestation errors never carry provider bodies, tokens, or submitted URLs into a record.

## Deviations from Plan

None - plan executed as specified. The test-only sandbox filesystem permission issue was resolved by rerunning the unchanged command with approved workspace access; it did not change product behavior.

## Issues Encountered

- The sandbox initially denied Git index writes and one Node filesystem lookup. Narrow retries with approved workspace access succeeded; all committed files and verification commands completed normally.
- An initial multi-file test replacement patch was rejected before writing changes. The runner regression tests were applied as focused additions instead, then passed after the planned implementation.

## Known Stubs

None.

## Next Phase Readiness

- Plan 06-10 can now bind baseline and outage rehearsal lifecycles to distinct fixture-bound Blob paths, knowing no Preview traffic can start until the actual target is independently attested.
- No external deployment, production configuration, or secret value was changed by this plan.

## Self-Check: PASSED

- Task commits `494c9ea`, `84236d8`, `101f4d6`, and `35a7205` exist in Git history.
- Attestation, runner, protection, and production-tooling suites all passed.

---
*Phase: 06-end-to-end-hardening-and-release-readiness*
*Plan: 09*
*Completed: 2026-09-18*
