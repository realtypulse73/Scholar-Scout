# ScholarScout Production Readiness Checklist

Use this checklist before turning on production traffic or rotating production credentials. It keeps OAuth, staff access, and the governed data store aligned without requiring Docker.

Provider-specific setup notes for Google, GitHub, Vercel Blob, the HTTP adapter, and GitHub Actions monitoring live in [`production-secret-provider-notes.md`](production-secret-provider-notes.md). The release sequence lives in [`production-release-runbook.md`](production-release-runbook.md), and incident response notes live in [`production-incident-response.md`](production-incident-response.md).
The variable-name template lives in [`../.env.production.example`](../.env.production.example).

## 1. Choose The Durable Data Store

Pick one production adapter before provisioning account traffic:

| Adapter | Required secrets | Use when |
|---|---|---|
| Vercel Blob | `SCHOLARSCOUT_DATA_ADAPTER=vercel-blob`, `BLOB_READ_WRITE_TOKEN` or `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN`, optional `SCHOLARSCOUT_BLOB_DATA_PATH` | ScholarScout is deployed on Vercel and needs a simple governed JSON document store |
| HTTP service | `SCHOLARSCOUT_DATA_ADAPTER=http`, `SCHOLARSCOUT_DATA_SERVICE_URL`, optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN` | A hosted service, database gateway, or CMS adapter owns the data document |
| JSON file | `SCHOLARSCOUT_DATA_ADAPTER=json`, optional `SCHOLARSCOUT_DATA_FILE` | Local development only |

Production should not use the JSON adapter.

## 2. Provision Auth Secrets

Set these in the hosting environment:

| Secret | Purpose | Rotation note |
|---|---|---|
| `NEXTAUTH_URL` | Canonical production URL | Update when the production domain changes |
| `NEXTAUTH_SECRET` | Signs Auth.js session tokens | Rotate by setting a new value and requiring fresh sign-in |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Enables first-launch GitHub OAuth | Rotate from the GitHub OAuth app |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enables later Google OAuth | Rotate from the Google Cloud OAuth client |
| `SCHOLARSCOUT_STAFF_EMAILS` | Comma-separated staff allowlist for OAuth accounts | Review before launches, staff changes, and incident response |
| `SCHOLARSCOUT_HEALTH_TOKEN` | Bearer token for production data health checks | Rotate when monitoring access changes |

Keep credentials sign-in enabled unless the project intentionally retires password accounts.

Use [`production-secret-provider-notes.md`](production-secret-provider-notes.md) for provider-specific value mapping, callback URLs, validation, and rotation steps.

## 3. Configure OAuth Redirects

Add production callback URLs in each provider console:

| Provider | Callback URL |
|---|---|
| Google | `https://YOUR_DOMAIN/api/auth/callback/google` |
| GitHub | `https://YOUR_DOMAIN/api/auth/callback/github` |

For preview deployments, either add explicit preview callback URLs or test OAuth only on the production domain.

## 4. Validate Staff Access

Before publishing admin operations:

1. Add at least one trusted staff email to `SCHOLARSCOUT_STAFF_EMAILS`.
2. Sign in through the configured OAuth provider.
3. Visit `/admin/programmes`.
4. Confirm `/api/admin/data/status` returns `200` for staff.
5. Confirm the same endpoint returns `403` when signed out.

Do not add broad domains or wildcard-style entries to the staff allowlist.

## 5. Validate Data Operations

Before importing or restoring data:

1. Visit `/admin/programmes`.
2. Confirm the Data operations panel shows the expected durable adapter.
3. Confirm Backup retention is marked `Within policy`.
4. Export a data snapshot from `/api/admin/data/export`.
5. Paste the exported snapshot into the restore validator.
6. Confirm validation counts match the expected users, profiles, shortlists, programmes, and audit events.
7. Confirm backup history is visible after any restore.
8. Preview saved-backup restore impact before using restore execution.

Every restore path creates a backup before replacing the active data document.

## 6. Run Deployment Checks

From the repository root:

```bash
npm run check:production-env
npm run rehearse:prelaunch -- --skip-smoke
npm run test:production-tooling
npm run test
npm run typecheck
npm run lint
npm run build:vercel
npm run vercel:docker-free
```

`npm run check:production-env` should run in an environment that has the intended production values loaded. It reports pass/warn/fail results without printing secret values, and it fails the command when launch-blocking values are missing or malformed.
For local rehearsal plumbing before real provider secrets exist, copy `.env.prelaunch.local.example` to `.env.prelaunch.local`, fill local-only values, and pass `--env-file .env.prelaunch.local`.

`npm run vercel:docker-free` intentionally installs with `--ignore-scripts` before building. If a new dependency requires postinstall scripts, update the Vercel Docker workaround before merging that dependency.

After deployment, run the production smoke check against the deployed URL:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN npm run smoke:production
```

This checks public routes, Auth.js provider discovery, and signed-out protection for admin data APIs.

After signing in as a staff account, copy the browser request cookie for the deployed domain and run the authenticated smoke checks:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN \
SCHOLARSCOUT_SMOKE_HEALTH_TOKEN='PASTE_HEALTH_TOKEN' \
SCHOLARSCOUT_SMOKE_STAFF_COOKIE='PASTE_STAFF_COOKIE' \
SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=vercel-blob \
npm run smoke:production
```

The health-token smoke check verifies data status, durable adapter state, and backup retention policy. The staff-cookie check verifies export access. Do not commit or paste health tokens or staff cookies into issue trackers, docs, or logs.

## 7. Enable Scheduled Monitoring

After production secrets are live, configure these GitHub Actions repository secrets:

| Secret | Required | Purpose |
|---|---|---|
| `SCHOLARSCOUT_SMOKE_BASE_URL` | Yes | Production ScholarScout URL for scheduled monitoring |
| `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` | Recommended | Service-token checks for data status, durable adapter, and backup retention |
| `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` | Recommended | Staff-authenticated checks for data status, export access, durable adapter, and backup retention |
| `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER` | Recommended | Expected production adapter, such as `vercel-blob` or `http` |
| `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` | Recommended | Use `github` for first launch; change to `github,google` after Google is added |

The workflow at `.github/workflows/production-monitor.yml` runs every six hours and can also be triggered manually from GitHub Actions. Prefer `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` for scheduled data health checks. If only the staff cookie is configured and it expires, signed-out route checks still run, but staff data health checks are skipped until the cookie secret is refreshed.

The workflow at `.github/workflows/production-readiness.yml` runs the production environment checker manually against repository or environment secrets and uploads a JSON readiness report artifact. The workflow at `.github/workflows/prelaunch-rehearsal.yml` runs the broader prelaunch rehearsal and uploads the full rehearsal folder.

## 8. Rotation Checklist

When rotating secrets:

1. Create the replacement secret in the provider console.
2. Update the hosting environment variable.
3. Redeploy ScholarScout.
4. Sign out and sign back in with OAuth.
5. Check `/profile`, `/shortlist`, and `/admin/programmes` with the expected account role.
6. Revoke the old secret only after the new deployment is healthy.
7. Record the rotation date and owner in the project operations notes.

For data-store token rotation, export a snapshot before changing the token, then verify export and status again after redeploy.
