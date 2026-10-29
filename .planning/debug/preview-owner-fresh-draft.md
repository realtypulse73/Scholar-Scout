---
status: verified
trigger: "A configured Preview demo owner with an Approved for release private package cannot create a new private upload draft."
created: "2026-10-28"
updated: "2026-10-28"
---

# Preview Owner Fresh Draft

## Symptoms

- **Expected behavior:** The configured Preview demo owner can start a new private media draft without deleting or altering an already approved Preview package.
- **Actual behavior:** After selecting an eligible programme, the uploader briefly checks the package and returns to its button because the only account submission is already `Approved for release`.
- **Reproduction:** Sign in as the Preview owner, open the contributor media intake, select an eligible programme, select the required files, and prepare the private upload after a prior package was approved.

## Scope and safety constraints

- Limit the exception to the exact configured Preview owner.
- Preserve the approved package, its private objects, candidate link, and learner-safe release behavior.
- Do not alter Production behavior or permit ordinary contributors to replace finalized packages.

## Resolution

root_cause: "The account-level submission lookup selected the approved package, and upload issuance correctly rejected that final status."
change: "Allow only the exact configured Preview owner to begin a new Draft after re-attesting through the explicit fresh-draft route; selection now prefers an editable draft without changing the approved package."
verification: "Focused contributor-media and UI tests pass; web lint and TypeScript checks pass. A final upload-form clarity repair is in progress after browser testing showed that native required-file validation concealed whether a selection was retained."
next_action: "Expose selected file names and route missing-file feedback through the form's accessible custom status, then re-run the focused checks."

## Evidence

- timestamp: "2026-10-28"; observation: "The owner selected an eligible Health Sciences programme, but upload preparation immediately returned because the active private status was Approved for release."
- timestamp: "2026-10-28"; observation: "issueContributorMediaUpload rejects any submission whose status is not Draft or Action needed; the current account lookup selects the first submission."
- timestamp: "2026-10-28"; observation: "A new regression test proves that the prior approved package stays unchanged while the new Preview-owner Draft receives the upload capability."
- timestamp: "2026-10-28"; observation: "Firefox testing reproduced a silent missing-file state. The uploader needs visible selected-file confirmation and must not rely on browser-native required-file validation."
