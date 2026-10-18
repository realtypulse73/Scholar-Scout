---
status: validated-awaiting-preview
trigger: "Latest Austin Preview sign-in returns a 500 ScholarScoutDataStoreReadError after the Greater Austin governed-region update."
created: "2026-10-18"
updated: "2026-10-18"
---

# Preview Austin Checklist Compatibility

## Symptoms

- **Expected behavior:** The latest Preview deployment can read the existing Preview-owner data and the configured owner can sign in.
- **Actual behavior:** `POST /api/auth/credentials` returns 500 with `ScholarScoutDataStoreReadError` and category `invalid-data`.
- **Reproduction:** Open the Ready `dd8f708` Greater Austin Preview deployment and submit the configured local credentials.

## Current Focus

- hypothesis: A candidate staged through an older Preview deployment has a derived checklist that recorded `regional-boundary` as needing correction; the new Greater Austin rule recomputes that field as passing, and the strict canonical-checklist read invariant rejects the whole persisted document.
- test: Recompute only the derived candidate checklist while parsing otherwise structurally valid persisted candidates, then verify the record is readable and preserves all candidate facts and audit entries.
- expecting: The latest Preview reads the document and signs in; Production, credentials, roles, contributor media, and candidate facts remain untouched.
- resolution: Recompute derived checklists only for draft candidates while reading persisted data; the enclosing document must still pass the existing strict import validator before it is accepted.
- next_action: Commit and deploy the Preview-only compatibility repair, then repeat the configured owner sign-in check on the newest Preview URL.

## Evidence

- timestamp: "2026-10-18"; Vercel request logs show `POST /api/auth/credentials` on `scholar-scout-dehq5n0aw-scholar-scout.vercel.app` returning 500 with `ScholarScoutDataStoreReadError` category `invalid-data`.
- timestamp: "2026-10-18"; older Preview endpoints on the same branch read the owner data successfully, isolating the failure to the new rule/data compatibility boundary rather than credentials or runtime configuration.
- timestamp: "2026-10-18"; the new candidate was staged by an older Preview build with a `regional-boundary` correction; current source adds `greater-austin`, so strict stored-checklist equality no longer holds when the candidate is re-evaluated.
- timestamp: "2026-10-18"; regression coverage proves a stale draft checklist is recalculated on read without rewriting the persisted source document, while a non-draft stale checklist remains invalid.
- timestamp: "2026-10-18"; focused datastore and catalogue suites passed (83 tests), and web TypeScript validation passed.
