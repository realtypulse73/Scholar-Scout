# Phase 5 Preview Outage and Screen-Reader UAT

Use this runbook only for Phase 5 release validation. It never authorizes a
production deployment, real student data, or a persistent project-wide outage
setting.

## Preview-only provider-outage check

The app recognizes `SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1` only
when Vercel sets `VERCEL_ENV=preview`. It affects only the community submission
reservation; registration and sign-in continue to use the configured provider.
Production ignores the flag even if it is accidentally present.

1. Start from the committed Phase 5 UAT-harness revision and create a new
   **Preview** deployment only. Do not use `--prod` and do not add the flag in
   Vercel Project Settings.
2. Supply the runtime deployment override
   `SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1`. Vercel documents
   `vercel deploy --env KEY=value` for a deployment-only runtime variable.
3. Use a fresh, non-secret `SCHOLARSCOUT_BLOB_DATA_PATH` deployment override so
   generated UAT accounts and notes cannot mix with another Preview's records.
   Reuse the project-managed Preview Blob token without reading or copying it.
4. Create/sign in only with a generated `@example.test` student account.
   Confirm profile navigation works, then submit one clearly marked test note
   and one clearly marked inbox request.
5. Expected result: each form reports its existing unavailable message (503),
   retains its entered draft, creates neither a public note nor an inbox record,
   and never displays a remaining count.
6. Capture the Preview URL, deployment ID/commit, UTC time, sign-in success,
   exact visible unavailable messages, and evidence that no submitted record
   appears. Never capture credentials, cookies, environment values, or logs
   containing them.
7. Do not promote or alias the deployment. Its one-off override disappears with
   the deployment; no project environment variable needs removal or restoration.

## Human screen-reader UAT

**Environment:** the approved isolated Preview, never production. Use NVDA with
Firefox or VoiceOver with Safari. Do not enter real student data.

1. Open `/western-new-york`; then open a populated school locker and an empty
   school-locker state.
2. Navigate with Tab/Shift+Tab and the screen reader's heading, landmark, form,
   and link commands. Check the verification notice, filters, result cards,
   empty-state recovery, and every visible official-source link.
3. Confirm each control has a clear spoken name/state, focus order matches the
   visible order, dialogs return focus to their initiating control, and long
   Unicode labels wrap without clipped or horizontally overflowing content.
4. Open each source link and verify it reaches the intended official institution
   or resource. Do not assess admissions, eligibility, aid, or outcome claims.

### Capture template

```text
Preview URL and commit/deployment:
Date/time (UTC):
Assistive technology + version:
Browser + version:
Routes tested:
Keyboard/focus observations:
Screen-reader announcements/reading order:
Official source-link result summary:
Unicode/wrapping observation:
Pass or defect (include route, control/link, expected, actual):
```

Record the tester's exact observed outcome in
`.planning/phases/05-school-community-and-wny-release-slice/05-UAT.md`.
