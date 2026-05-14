# ScholarScout Provider Hosting Setup

Generated: 2026-05-11T08:31:12.657Z

## Files

- Local production handoff file: `.env.production.local`
- This file is ignored by git. Do not paste it into tickets or chat.

## Provider Actions

1. Create or access the Vercel project and deploy ScholarScout from this repository.
2. Confirm Vercel permissions with `docs/vercel-permissions-handoff.md`.
3. In Vercel Project Settings, set environment variables from `.env.production.local` for Production and Preview as appropriate.
4. In Vercel Storage, create a Private Blob store connected to the project and copy its read-write token into `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`.
5. Create the GitHub OAuth client first. Use `docs/github-oauth-first-handoff.md`. Add Google later with `docs/google-oauth-permissions-handoff.md`. Use the deployed callback URL:
   - Google: `https://YOUR_DOMAIN/api/auth/callback/google`
   - GitHub: `https://YOUR_DOMAIN/api/auth/callback/github`
6. Copy OAuth client id/secret into Vercel environment variables.
7. Add GitHub Actions repository secrets for readiness, smoke, and prelaunch workflows.
8. Redeploy after environment variables are set.
9. Run `npm run rehearse:prelaunch -- --env-file .env.production.local` locally or trigger the Prelaunch Rehearsal workflow.

## GitHub Actions Secrets To Add

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Later: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `SCHOLARSCOUT_STAFF_EMAILS`
- `SCHOLARSCOUT_HEALTH_TOKEN`
- `SCHOLARSCOUT_DATA_ADAPTER`
- `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`
- `SCHOLARSCOUT_BLOB_DATA_PATH`
- `SCHOLARSCOUT_SMOKE_BASE_URL`
- `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN`
- `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER`
- `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github`
