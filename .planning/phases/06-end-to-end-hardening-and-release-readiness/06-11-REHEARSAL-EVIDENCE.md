---
phase: 06-end-to-end-hardening-and-release-readiness
plan: 11
candidate_commit: 089d969368e597c368fe7fa50856a092937fa457
workflow_run: 35355815777
status: passed
---

# Phase 6 Plan 11: Candidate-Bound Rehearsal Evidence

## Scope

This is a scrubbed verification record for the already-authorized Preview-only
rehearsal. It validates one immutable candidate and does not represent a
Production deployment, a Production configuration change, or a replacement for
protected-main release gates.

## Candidate and Workflow

- Candidate commit: `089d969368e597c368fe7fa50856a092937fa457`
- Workflow: `ScholarScout Prelaunch Rehearsal`
- Workflow result: `completed` / `success`
- Workflow started (UTC): `2026-09-18T14:22:26Z`
- Workflow completed (UTC): `2026-09-18T14:25:08Z`
- Run: <https://github.com/realtypulse73/Scholar-Scout/actions/runs/35355815777>
- Job: <https://github.com/realtypulse73/Scholar-Scout/actions/runs/35355815777/job/105634783059>
- Artifact: `prelaunch-rehearsal`

## Passed Workflow Steps

The following exact workflow steps completed successfully for the shared
candidate commit:

| Step | Result |
| --- | --- |
| `Verify candidate checkout` | passed |
| `Run candidate quality, high-risk, and local browser proof` | passed |
| `Protected Preview browser proof (maintainer-owned runner)` | passed |
| `Separate Preview outage and restoration proof (maintainer-owned runner)` | passed |
| `Aggregate candidate release rehearsal` | passed |

## Artifact Aggregate Validation

The named artifact was downloaded to a disposable local directory and validated
from a clean detached checkout at
`089d969368e597c368fe7fa50856a092937fa457` after a successful immutable
`pnpm install --frozen-lockfile --ignore-scripts`.

Aggregate command, with the disposable artifact location intentionally redacted:

```text
pnpm run rehearse:prelaunch -- --release-gate --aggregate-only --candidate-commit 089d969368e597c368fe7fa50856a092937fa457 --output-dir <artifact-dir> --preview-browser-record <artifact-dir>/preview-browser.json --preview-outage-record <artifact-dir>/preview-outage.json
```

Result: passed. The aggregate accepted five separate records, each bound to the
same candidate commit:

| Lane | Result |
| --- | --- |
| candidate-quality | passed |
| high-risk | passed |
| local-browser | passed |
| preview-browser | passed |
| preview-outage | passed |

The detached checkout, downloaded artifact, and their exact disposable parent
directory were removed after validation; no fixture identifier, capability,
storage path, request material, cookie, token, student content, or deployment
configuration is retained in this note.

## Evidence Boundary

This evidence shows that the corrected candidate passed its local, protected
Preview, outage/restoration, and aggregate rehearsal lanes. It supplements but
does not replace future protected-main CI, a Production deployment/build record,
or post-deploy Production smoke evidence.
