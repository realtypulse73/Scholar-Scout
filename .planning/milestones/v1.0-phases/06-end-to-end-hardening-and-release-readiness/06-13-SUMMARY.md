---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 13
subsystem: rehearsal-infrastructure
tags: [node-24, vercel, preview, rehearsal, blob]
requires:
  - 06-10-SUMMARY.md
  - 06-11-SUMMARY.md
provides:
  - permanent-isolated-baseline-and-outage-rehearsals
  - automatic-github-deployment-discovery
affects: [release-readiness, phase-7]
tech-stack:
  added: []
  patterns: [code-owned-rehearsal-paths, permanent-preview-test-infrastructure]
key-files:
  created: []
  modified:
    - .github/workflows/prelaunch-rehearsal.yml
    - scripts/discover-rehearsal-preview-deployments.mjs
    - scripts/preview-deployment-attestation.mjs
    - docs/rehearsal-environment-runbook.md
key-decisions:
  - "Use permanent isolated baseline and outage rehearsal projects instead of per-run branch configuration."
  - "Allow generated-data rehearsal Preview deployments to be reachable without Vercel member login."
requirements-completed: [OPS-04, PROD-04]
coverage:
  - id: D1
    description: "Baseline and outage rehearsals use isolated Preview infrastructure and data paths."
    requirement: OPS-04
    verification:
      - kind: integration
        ref: "node --test scripts/test-production-tooling.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "A PR-head rehearsal automatically discovers both rehearsal deployments and completes normal and outage proofs."
    requirement: PROD-04
    verification:
      - kind: e2e
        ref: "GitHub Actions ScholarScout Prelaunch Rehearsal #110"
        status: pass
    human_judgment: false
metrics:
  tasks_completed: 5
status: complete
---

# Phase 6 Plan 13: Permanent Isolated Rehearsals Summary

Scholar Scout now has permanent, isolated baseline and outage Preview rehearsal
projects that automatically provide the two deployment targets needed for a
candidate-bound Phase 6 proof.

## Completed Tasks

1. Upgraded the rehearsal tooling and workflow contracts to Node 24.
2. Made rehearsal fixture storage code-owned and constrained to Preview
   rehearsal mode.
3. Connected separate baseline and outage projects to separate test-only
   storage and fixture capabilities.
4. Replaced manual URL and temporary branch handoffs with GitHub deployment
   discovery and dedicated-environment attestation.
5. Ran current candidate `5af38998ba43320b71aed47d54a0fe415fb0de0f` through
   successful GitHub Actions rehearsal
   [#110](https://github.com/realtypulse73/Scholar-Scout/actions/runs/35500148139).

## Key Commits

- `9626b9e` — discover rehearsal previews through GitHub.
- `944e56b` — use the workflow token for Preview attestation.
- `393995b` — attest dedicated rehearsal environments.
- `5af3899` — pass the Preview bypass setting to the workflow.

## Decisions Made

- The two rehearsal projects expose only generated test data and are not
  protected by Vercel member login; the main application and Production were
  not changed.
- The workflow discovers candidate-matched GitHub deployments rather than
  relying on manually copied URLs or configuration values.

## Deviations from Plan

Vercel's automation-bypass setting was absent in both test-only projects. The
approved, simpler remedy was to disable Vercel member-login protection on only
those two generated-data rehearsal projects. This removed the redirect that
blocked the runner without affecting the main project or Production.

## Self-Check: PASSED

- Vercel authentication is disabled only for the baseline and outage rehearsal
  projects.
- GitHub Actions run #110 succeeded in 2m 26s.
- The workflow completed baseline, outage/restoration, aggregate, summary, and
  artifact-upload steps successfully.

## Next Phase Readiness

Phase 6 has current end-to-end evidence and is ready to be marked complete.
Phase 7 can begin from the updated project tracker.

---
*Phase: 06-end-to-end-hardening-and-release-readiness*
*Completed: 2026-09-20*
