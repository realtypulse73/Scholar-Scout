# ScholarScout Production Release Runbook

Use this runbook after production secrets are provisioned and before routing real student traffic to a new deployment.

## 1. Confirm Secret Shape

If production provider values have not been assembled yet, generate the ignored local handoff file first:

```bash
npm run provision:production-values -- --production-url https://YOUR_DOMAIN --staff-emails staff@example.org
```

This writes `.env.production.local` with generated `NEXTAUTH_SECRET` and `SCHOLARSCOUT_HEALTH_TOKEN` values plus placeholders for OAuth and durable data credentials. Copy values from that file into Vercel and GitHub Actions secrets, but do not commit or paste the file into tickets.

Load the intended production environment and run:

```bash
npm run check:production-env
```

For a release artifact or handoff note, also capture the JSON report:

```bash
npm run check:production-env -- --json
```

The report contains variable names, statuses, and practical messages only. It must not include secret values.

## 2. Run The Manual Readiness Workflow

In GitHub Actions, run **ScholarScout Production Readiness**.

Use the `base_url` override when validating a preview or newly promoted URL. The workflow installs dependencies without postinstall scripts, runs the same production environment checker, and uploads `production-env-readiness.json`.

For a fuller launch rehearsal, run **ScholarScout Prelaunch Rehearsal** or locally:

```bash
npm run rehearse:prelaunch
```

The rehearsal writes readiness, tooling, optional smoke, and summary artifacts under `reports/prelaunch-rehearsal`.
Use [`prelaunch-evidence-template.md`](prelaunch-evidence-template.md) for the launch-readiness note.

If real provider secrets are not available yet, use the local workaround only for rehearsal plumbing:

```bash
npm run provision:env
npm run rehearse:prelaunch -- --skip-smoke --env-file .env.prelaunch.local
```

The local workaround intentionally allows credentials-only auth and a localhost HTTP data service. It is not a substitute for the real production launch rehearsal with OAuth and a durable hosted data adapter.

## 3. Deploy

Deploy from the repository root with the Docker-free path:

```bash
npm run build:vercel
```

Keep the production data adapter on `vercel-blob` or `http`. Do not launch production traffic on the JSON adapter.

## 4. Smoke Test The Deployment

Run unauthenticated checks first:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN npm run smoke:production
```

Then run service-token checks:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN \
SCHOLARSCOUT_SMOKE_HEALTH_TOKEN='PASTE_HEALTH_TOKEN' \
SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=vercel-blob \
SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github \
npm run smoke:production
```

Use `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` to match the OAuth providers intentionally enabled for the deployment. Launch with `github`; change to `github,google` after Google OAuth is configured.
Use `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` only when the deployed platform consistently needs a longer per-request timeout than the 10000ms default.
Use `SCHOLARSCOUT_SMOKE_RETRIES` for transient network tolerance; keep the value low so repeated failures still surface quickly.
Use `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` only when you want the release smoke check to enforce a simple per-request latency ceiling.

## 5. Verify Staff Operations

Sign in as a staff-allowlisted OAuth account and check:

1. `/profile` shows the expected account.
2. `/admin/programmes` opens.
3. Data operations shows a durable adapter.
4. Backup retention is within policy.
5. Export, restore validation, and backup restore preview work with test data only.

For export smoke checks, refresh `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` only when the scheduled export check is needed. Prefer `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` for recurring monitoring because it is not tied to a browser session.

## 6. Enable Monitoring

Confirm the **ScholarScout Production Monitor** workflow has these secrets:

| Secret | Purpose |
|---|---|
| `SCHOLARSCOUT_SMOKE_BASE_URL` | Production URL |
| `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` | Bearer token for `/api/admin/data/health` |
| `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER` | Expected durable adapter |
| `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` | Expected OAuth provider ids |
| `SCHOLARSCOUT_SMOKE_STAFF_COOKIE` | Optional export access check |

The monitor uploads `production-smoke-report.json` after each run.
The workflow summary also renders the report in Markdown. For local release notes, run:

```bash
npm run report:production -- --env-report production-env-readiness.json --smoke-report production-smoke-report.json
```

## 7. Record The Release

Record the deployment date, adapter, enabled OAuth providers, readiness report result, smoke result, and secret rotation owner in the project operations notes.

If the monitor fails after release, use [`production-incident-response.md`](production-incident-response.md).
