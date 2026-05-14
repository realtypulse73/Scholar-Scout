# ScholarScout Production Secret Provider Notes

Use these notes when creating production OAuth, data-store, and monitoring secrets. The provider console screens may change, but the ScholarScout environment variable names and callback paths below are stable.

Use [`../.env.production.example`](../.env.production.example) as the variable-name template when configuring hosting or GitHub Actions secrets. It contains placeholders only; keep real values in the provider or secret store.
Use [`../.env.prelaunch.local.example`](../.env.prelaunch.local.example) only for local rehearsal workarounds. It intentionally uses localhost and credentials-only auth; do not use it as the public production configuration.

To create a private production handoff file with generated Auth.js and health-token values, run:

```bash
npm run provision:production-values -- --production-url https://YOUR_DOMAIN --staff-emails staff@example.org
```

The command writes `.env.production.local`, which is ignored by git, and `reports/production-provider-setup.md`, which contains checklist instructions without secret values. Use `--local-file PATH` only when you need a non-default output path.

## Hosting Environment

Set these variables in the production hosting environment before routing real users to the app:

| ScholarScout variable | Required | Notes |
|---|---|---|
| `NEXTAUTH_URL` | Yes | Full production origin, such as `https://scholarscout.example.org` |
| `NEXTAUTH_SECRET` | Yes | Long random secret for Auth.js JWT/session signing |
| `SCHOLARSCOUT_STAFF_EMAILS` | Recommended | Comma-separated trusted staff emails for OAuth role assignment |
| `SCHOLARSCOUT_HEALTH_TOKEN` | Recommended | Bearer token for production data health monitoring |
| `OPENAI_API_KEY` | Optional for AI advisor | Server-only OpenAI API key for `/api/advisor-chat` |
| `OPENAI_MODEL` | Optional for AI advisor | Defaults to `gpt-4.1-mini` when unset |
| `SCHOLARSCOUT_DATA_ADAPTER` | Yes | Use `vercel-blob` or `http` in production |
| `BLOB_READ_WRITE_TOKEN` or `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` | If using Blob | Prefer a dedicated ScholarScout token when available |
| `SCHOLARSCOUT_BLOB_DATA_PATH` | Optional Blob override | Defaults to `scholarscout/data.json` |
| `SCHOLARSCOUT_DATA_SERVICE_URL` | If using HTTP | Full document endpoint for the hosted data service |
| `SCHOLARSCOUT_DATA_SERVICE_TOKEN` | Recommended for HTTP | Bearer token sent on reads and writes |
| `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` | Recommended for monitoring | Comma-separated provider ids expected from `/api/auth/providers` |
| `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` | Optional for monitoring | Per-request smoke-check timeout; defaults to `10000` |
| `SCHOLARSCOUT_SMOKE_RETRIES` | Optional for monitoring | Transient request retry count; defaults to `1` |
| `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` | Optional for monitoring | Per-request latency ceiling; unset by default |

Do not configure `SCHOLARSCOUT_DATA_ADAPTER=json` for production traffic.

## Google OAuth

Configure the Google OAuth client as a web application.
If you need a Google Cloud owner or Workspace admin to grant access, use [`google-oauth-permissions-handoff.md`](google-oauth-permissions-handoff.md).

| Google value | ScholarScout value |
|---|---|
| Client ID | `GOOGLE_CLIENT_ID` |
| Client secret | `GOOGLE_CLIENT_SECRET` |
| Authorized redirect URI | `${NEXTAUTH_URL}/api/auth/callback/google` |

Validation:

1. Deploy with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
2. Visit `${NEXTAUTH_URL}/api/auth/providers`.
3. Confirm the response includes `google`.
4. Sign in with a staff-allowlisted Google email.
5. Confirm `/profile` shows the expected account and `/admin/programmes` opens for staff.

Rotation:

1. Create or rotate the Google client secret.
2. Update `GOOGLE_CLIENT_SECRET` in the hosting environment.
3. Redeploy.
4. Run `npm run smoke:production` against the deployment.
5. Revoke the old client secret after sign-in is healthy.

## GitHub OAuth

Configure the GitHub OAuth app for the production domain.

| GitHub value | ScholarScout value |
|---|---|
| Client ID | `GITHUB_CLIENT_ID` |
| Client secret | `GITHUB_CLIENT_SECRET` |
| Authorization callback URL | `${NEXTAUTH_URL}/api/auth/callback/github` |

Validation:

1. Deploy with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
2. Visit `${NEXTAUTH_URL}/api/auth/providers`.
3. Confirm the response includes `github`.
4. Sign in with a staff-allowlisted GitHub account email.
5. Confirm staff routes return `200` only for staff sessions.

Rotation:

1. Generate a new GitHub client secret.
2. Update `GITHUB_CLIENT_SECRET` in the hosting environment.
3. Redeploy and verify sign-in.
4. Delete the retired secret in GitHub after validation.

## Vercel Blob Data Store

Use this path when the app is deployed on Vercel and a single durable ScholarScout JSON document is acceptable.

| Vercel Blob value | ScholarScout value |
|---|---|
| Read-write token | `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN` |
| Blob pathname | `SCHOLARSCOUT_BLOB_DATA_PATH` |
| Adapter selector | `SCHOLARSCOUT_DATA_ADAPTER=vercel-blob` |

Recommended production values:

```bash
SCHOLARSCOUT_DATA_ADAPTER=vercel-blob
SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN=replace-with-dedicated-token
SCHOLARSCOUT_BLOB_DATA_PATH=scholarscout/data.json
```

Validation:

1. Deploy with the Blob variables.
2. Sign in as staff.
3. Open `/admin/programmes`.
4. Confirm Data operations shows a durable `vercel-blob` adapter.
5. Export data, validate the exported snapshot, and confirm backup retention is within policy.
6. Run staff-authenticated `npm run smoke:production` with `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=vercel-blob`.

Rotation:

1. Export a ScholarScout snapshot before token rotation.
2. Create the replacement Blob read-write token.
3. Update the hosting environment.
4. Redeploy and run smoke checks.
5. Revoke the old token after export and data status checks pass.

## HTTP Data Store

Use this path when a hosted service, database gateway, or CMS adapter owns the ScholarScout data document.

| Service value | ScholarScout value |
|---|---|
| Document endpoint | `SCHOLARSCOUT_DATA_SERVICE_URL` |
| Bearer token | `SCHOLARSCOUT_DATA_SERVICE_TOKEN` |
| Adapter selector | `SCHOLARSCOUT_DATA_ADAPTER=http` |

Recommended production values:

```bash
SCHOLARSCOUT_DATA_ADAPTER=http
SCHOLARSCOUT_DATA_SERVICE_URL=https://data.example.org/scholarscout
SCHOLARSCOUT_DATA_SERVICE_TOKEN=replace-with-service-token
```

Validation:

1. Confirm the service responds to authenticated `GET` with `200` or `404`.
2. Confirm the service accepts authenticated `PUT` with `Content-Type: application/json`.
3. Deploy ScholarScout with the HTTP variables.
4. Sign in as staff and confirm Data operations shows a durable `http` adapter.
5. Run staff-authenticated `npm run smoke:production` with `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=http`.

Rotation:

1. Export a ScholarScout snapshot before changing the service token.
2. Add the new token to the service and hosting environment.
3. Redeploy.
4. Run smoke checks.
5. Remove the old token from the service after reads and exports are healthy.

## GitHub Actions Monitoring Secrets

Configure these repository secrets after production is live:

| GitHub secret | Purpose |
|---|---|
| `SCHOLARSCOUT_SMOKE_BASE_URL` | Production URL for scheduled monitoring |
| `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` | Same value as production `SCHOLARSCOUT_HEALTH_TOKEN`; preferred for scheduled data health checks |
| `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` | Optional staff session cookie for data export smoke checks |
| `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER` | Expected adapter, such as `vercel-blob` or `http` |
| `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` | Expected Auth.js provider ids, such as `google,github` |
| `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` | Optional per-request smoke timeout in milliseconds |
| `SCHOLARSCOUT_SMOKE_RETRIES` | Optional transient request retry count |
| `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` | Optional per-request latency ceiling in milliseconds |

Use the health token for adapter and backup-retention monitoring. Refresh `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` only when export access checks need a staff browser session.

## Secret Freshness

Use this cadence unless your hosting or security policy requires a shorter one:

| Secret area | Freshness check |
|---|---|
| OAuth client secrets | Review at each production release and rotate after provider incidents or staff ownership changes |
| `NEXTAUTH_SECRET` | Rotate during planned auth maintenance, then require fresh sign-in |
| Data-store tokens | Export a snapshot before rotation, redeploy, then verify status and export |
| `SCHOLARSCOUT_HEALTH_TOKEN` | Rotate when monitoring ownership changes or the token appears in logs |
| `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` | Refresh whenever the scheduled export check starts skipping or failing due to session expiry |

After any secret rotation, run `npm run check:production-env` and `npm run smoke:production` against the deployment.
