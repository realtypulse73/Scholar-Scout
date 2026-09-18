---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 08
subsystem: release-attestation
tags: [github-deployments, vercel-preview, release-gate, security]
requires:
  - phase: 06-07
    provides: Preview rehearsal boundary and safe evidence contract.
provides:
  - Maintainer-approved, non-secret Vercel GitHub Deployment/status semantics for trusted Preview attestation.
  - A 900-second GitHub-status freshness policy for the next release-gate implementation.
affects: [06-09, preview-rehearsal, release-evidence]
tech-stack:
  added: []
  patterns: [Observe provider identity read-only before allowlisting it in source.]
key-files:
  created:
    - .planning/phases/06-end-to-end-hardening-and-release-readiness/06-ATTESTATION-DISCOVERY.md
  modified: []
key-decisions:
  - "Use observed GitHub Deployment/status semantics, not workflow metadata, as the future Preview attestation allowlist."
  - "Fail the gate for missing, ambiguous, non-Preview, non-successful, future, malformed, or stale statuses older than 900 seconds."
patterns-established:
  - "Provider identity evidence is scrubbed to deployment/status identity, target, time, and outcome facts before it is recorded."
requirements-completed: []
coverage:
  - id: D1
    description: "Approved safe Vercel GitHub Deployment/status semantics for the Phase 6 Preview attestation."
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/06-end-to-end-hardening-and-release-readiness/06-ATTESTATION-DISCOVERY.md"
        status: pass
    human_judgment: true
    rationale: "A future candidate must independently observe and freshness-check its own provider record."
duration: 13min
completed: 2026-09-18
status: complete
---

# Phase 6 Plan 08: Preview Attestation Discovery Summary

**A scrubbed, observed Vercel GitHub Deployment/status record now defines the trusted Preview identity and freshness semantics for the next release-gate implementation.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-18T18:32:00Z
- **Completed:** 2026-09-18T18:45:29Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Recorded the immutable candidate SHA, Vercel bot identity, Preview semantics, successful status, normalized HTTPS Preview URL, and safe timestamps from a read-only provider record.
- Defined the 900-second maximum status-age rule measured from GitHub `created_at` to the runner's injected current UTC time.
- Excluded credentials, provider payloads, headers, cookies, fixture material, Blob paths, and student data from the discovery record.

## Task Commits

1. **Task 1: Approve observed Vercel GitHub deployment semantics** - `924673a` (docs)
2. **Task 1 follow-up: Remove attestation whitespace** - `72ea0d5` (style)

## Files Created/Modified

- `.planning/phases/06-end-to-end-hardening-and-release-readiness/06-ATTESTATION-DISCOVERY.md` - Safe provider identity, Preview target, timestamps, and freshness policy.
- `.planning/phases/06-end-to-end-hardening-and-release-readiness/06-08-SUMMARY.md` - Execution record and handoff to Plan 06-09.

## Decisions Made

- Use the observed `vercel[bot]` `Bot` creator and `Preview` deployment/status semantics as the source-allowlist facts for Plan 06-09; never substitute workflow metadata as proof.
- Require a successful, unambiguous, HTTPS Preview status created no more than 900 seconds before the injected runner time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Formatting] Removed a trailing Markdown whitespace marker from the discovery record.**
- **Found during:** Task 1 verification
- **Issue:** The initial task commit contained trailing whitespace.
- **Fix:** Removed the marker and reran the required-field, sensitive-value, and whitespace checks.
- **Files modified:** `.planning/phases/06-end-to-end-hardening-and-release-readiness/06-ATTESTATION-DISCOVERY.md`
- **Verification:** `ATTESTATION_ARTIFACT_VALID_AND_WHITESPACE_CLEAN`
- **Committed in:** `72ea0d5`

**Total deviations:** 1 auto-fixed (Rule 1 formatting).

## Issues Encountered

- This GSD runtime does not provide the attempted generic `check plan` subcommand. The artifact was instead validated with explicit required-field, sensitive-value, and `git diff --check` assertions.
- The first commit attempt was denied by the workspace Git-write boundary. Inspection found no `index.lock` and no active Git process; the authorized retry committed only the attestation artifact.

## Known Stubs

None.

## Next Phase Readiness

- Plan 06-09 can implement trusted GitHub Deployment/status attestation using the approved provider semantics and freshness threshold.
- Plan 06-10 remains the next storage-isolation implementation step after the attestation dependency is complete.

## Self-Check: PASSED

- Discovery artifact and summary exist at their planned paths.
- Both task commits (`924673a`, `72ea0d5`) exist in Git history.
- Required-field, sensitive-value, and whitespace assertions passed.

---
*Phase: 06-end-to-end-hardening-and-release-readiness*
*Plan: 08*
*Completed: 2026-09-18*
