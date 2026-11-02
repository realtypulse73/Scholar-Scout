---
status: resolved
trigger: "The configured Preview owner still receives the temporary sign-in-unavailable message after the credential exchange bypass and signed cross-function grant were deployed."
created: "2026-11-02"
updated: "2026-11-02"
---

# Preview Auth Session Callback

## Symptoms

- **Expected behavior:** The configured Preview owner can sign in with an existing local account and reach the profile page.
- **Actual behavior:** The Preview sign-in screen immediately shows the temporary-unavailable message after a valid sign-in attempt.
- **Error messages:** The generic temporary-unavailable message appears; a controlled wrong-password check returns the specific incorrect-password message.
- **Timeline:** The issue persisted after Preview variables were verified and the newest deployment was redeployed.
- **Reproduction:** Open the newest Phase 13 Preview domain and submit the configured owner's valid local credentials.

## Finding

- The full Auth.js callback accepts the signed Preview-owner handoff when Preview-equivalent configuration contains a valid `NEXTAUTH_SECRET`.
- The focused regression test covers CSRF verification, the signed owner grant, and issue of the session cookie.
- The live Preview failure therefore remains outside the application code path: its effective `NEXTAUTH_SECRET` value is missing, blank, or different from the value available to the function serving the sign-in callback.

## Resolution

- Replaced the Preview-only `NEXTAUTH_SECRET` and set the Preview-only `NEXTAUTH_URL` to the current Phase 13 Preview domain.
- Redeployed the Phase 13 Preview branch, then completed a clean sign-out and local sign-in.
- The configured owner returned to the profile page, confirming session creation and the expected Preview callback target.

## Evidence

- timestamp: "2026-11-02"; observation: "A controlled request using the configured owner email and an intentionally incorrect password returned the precise incorrect-password response, confirming the owner-email match and credential route boundary."
- timestamp: "2026-11-02"; observation: "The deployed client shows a temporary-unavailable message only after the Auth.js credentials sign-in call returns an error."
- timestamp: "2026-11-02"; observation: "Vercel Preview scope was confirmed for NEXTAUTH_SECRET, and redeployment did not change the failure."
- timestamp: "2026-11-02"; observation: "Sign-out redirected to an older deployment, identifying a stale Preview NEXTAUTH_URL value after the owner-grant and Auth.js callback tests passed."
- timestamp: "2026-11-02"; observation: "After the Preview-only NEXTAUTH_SECRET and NEXTAUTH_URL were corrected and the Phase 13 Preview branch redeployed, a clean sign-out and local sign-in reached the profile page."

## Eliminated

- hypothesis: "The configured owner email does not match the Preview environment variable."
  evidence: "The controlled wrong-password check passed the owner-only credential boundary and reached password verification."
- hypothesis: "Auth.js rejects a valid Preview signed handoff."
  evidence: "The dedicated callback test passed with Preview-equivalent variables, CSRF protection, and session-cookie issuance."

