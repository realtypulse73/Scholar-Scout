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

1. Open `/phase-5-accessibility-uat` on the approved Preview. This is a
   non-indexed, Preview-only, static fixture. Confirm the three headings are
   announced in a logical heading/reading order: `No pathways match these
   priorities yet`, `No programme details are available for this school yet`,
   and the long-Unicode `École supérieure… 漢字かなカナ العربية` sample. At 200%
   browser zoom, confirm the Unicode heading and its source-label sample wrap
   without clipping, overlap, or horizontal page scrolling. The fixture must
   contain no links, textboxes, or buttons.
2. Open `/western-new-york`. Navigate with Tab/Shift+Tab and the screen
   reader's landmark, heading, form, and link commands. Check the verification
   notice, four filters, populated result cards, and every visible official
   source link.
3. Open `/schools/north-valley-college` for the populated locker and
   `/schools/metro-technical-institute` for the empty community-board recovery
   state. Confirm their verification guidance and headings. Open one `Report
   this note` dialog on the populated locker and cancel it only; focus must
   return to that same report control. Do not confirm a report or submit data.
4. Confirm each control has a clear spoken name/state and focus order matches
   visible order. Open each source link and verify it reaches the intended
   official institution or resource. Do not assess admissions, eligibility,
   aid, or outcome claims.

The fixture is not a replacement for a real screen-reader observation. Record
Test 1 as `pass` only after a human reports every applicable observation above;
record a route/control-specific defect instead when any observation fails.

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
