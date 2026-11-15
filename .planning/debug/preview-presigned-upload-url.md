---
status: investigating
trigger: "Preview contributor upload cannot retrieve a Vercel Blob presigned URL."
created: "2026-11-14"
updated: "2026-11-14"
---

# Preview Presigned Upload URL

## Symptoms

- **Expected behavior:** An invited Preview contributor with an approved programme, an MP4, and a poster receives a server-authorized presigned URL and the browser starts the private upload.
- **Actual behavior:** The contributor form reports `Failed to retrieve the presigned URL` before either file is transferred.
- **Reproduction:** Use the deployed Preview contributor flow with Huston-Tillotson University — undergraduate information selected and both permitted files attached, then choose Prepare private upload once.

## Evidence

- The private `scholarscout-contributor-media` Blob store is available and connected to `scholar-scout-web` for Preview and Production through OIDC.
- The project connection exposes `SCHOLARSCOUT_PRIVATE_MEDIA_STORE_ID` and `SCHOLARSCOUT_PRIVATE_MEDIA_WEBHOOK_PUBLIC_KEY`, matching the upload route configuration boundary.
- Vercel Runtime Logs and Request Logs do not expose a useful entry because the route currently collapses signing exceptions into a generic safe response.

## Current Focus

hypothesis: "The upload route's presigned-token request is failing at the OIDC signing boundary and its generic error handling hides the safe diagnostic category needed to repair it."
test: "Exercise the route with OIDC-compatible options and add focused regression coverage for failure classification without disclosing credentials."
expecting: "The route either issues a presigned payload with the store's OIDC connection or reports a bounded configuration category suitable for Preview remediation."
next_action: "Deploy the bounded failure classification, then use one Preview retry to identify the OIDC or credential boundary without exposing a secret."

## Diagnostic change

- The direct-upload route now classifies known Blob credential and OIDC failures into bounded, non-secret categories and emits only that category to the server log.
- The browser receives a clear Preview-storage message when no file has been transferred; authorization failures retain the generic safe response.
- Focused coverage uses the current `blob.generate-presigned-url` request shape instead of the legacy client-token event.

## Root-cause correction

- Vercel makes the short-lived OIDC credential available on the function request at runtime. The signing route now passes that credential explicitly to the Blob SDK with the connected private-store ID.
- No credential is persisted, returned to the browser, or logged.
