---
status: validated
scope: phase-13.2-preview-contributor-upload
updated: 2026-11-13
---

# Preview contributor programme eligibility

## Symptom

An invited Preview contributor selected a programme shown in the uploader and received the server response: `Choose a current approved programme before uploading.`

## Root cause

The contributor page populated its selector from governed programmes, which includes seed records. The upload authorization boundary correctly accepts only a current approved catalogue candidate. The Preview data store currently has no approved catalogue candidates, so every displayed seed programme was guaranteed to fail at the server boundary.

## Correction

The contributor page now projects the selector from the same current-approved catalogue-candidate rule enforced by the upload route. When no eligible candidate exists, the page explains the condition and disables the upload submission action rather than accepting a selection that must fail.

## Validation

- Focused contributor server and component suites: passed (21 tests)
- Web TypeScript check: passed
- Web lint: passed

## Remaining Preview UAT dependency

The complete upload, independent review, release, learner-view, and removal rehearsal requires a real approved catalogue candidate in Preview. Creating one as the same contributor would bypass the independent-review control, so that is intentionally not automated by this correction.
