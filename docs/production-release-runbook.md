# ScholarScout Production Release Runbook

Use this runbook after production secrets are provisioned and before routing real student traffic to a new deployment.

## Prerequisite: Use The Pinned Dependency Graph

From the repository root, use the pnpm version selected by the root `packageManager` field and install only from the reviewed lockfile:

```bash
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
```

Do not substitute another package manager or regenerate the lockfile during a release.

## 1. Confirm Secret Shape

If production provider values have not been assembled yet, generate the ignored local handoff file first:

```bash
pnpm run provision:production-values -- --production-url https://YOUR_DOMAIN --staff-emails staff@example.org
```

This writes `.env.production.local` with generated `NEXTAUTH_SECRET` and `SCHOLARSCOUT_HEALTH_TOKEN` values plus placeholders for OAuth and durable data credentials. Copy values from that file into Vercel and GitHub Actions secrets, but do not commit or paste the file into tickets.

Load the intended production environment and run:

```bash
pnpm run check:production-env
```

For a release artifact or handoff note, also capture the JSON report:

```bash
pnpm run check:production-env -- --json
```

The report contains variable names, statuses, and practical messages only. It must not include secret values.

## 2. Run The Manual Readiness Workflow

In GitHub Actions, run **ScholarScout Production Readiness**.

Use the `base_url` override when validating a preview or newly promoted URL. The workflow installs dependencies without postinstall scripts, runs the same production environment checker, and uploads `production-env-readiness.json`.

For a fuller launch rehearsal, run **ScholarScout Prelaunch Rehearsal** or locally:

```bash
pnpm run rehearse:prelaunch
```

The rehearsal writes readiness, tooling, optional smoke, and summary artifacts under `reports/prelaunch-rehearsal`.
Use [`prelaunch-evidence-template.md`](prelaunch-evidence-template.md) for the launch-readiness note.

If real provider secrets are not available yet, use the local workaround only for rehearsal plumbing:

```bash
pnpm run provision:env
pnpm run rehearse:prelaunch -- --skip-smoke --env-file .env.prelaunch.local
```

The local workaround intentionally allows credentials-only auth and a localhost HTTP data service. It is not a substitute for the real production launch rehearsal with OAuth and a durable hosted data adapter.

### Candidate Rehearsal (separate from production)

Before any rehearsal, open a normal pull request to `main` and record its immutable head commit passing, in order:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm run lint
pnpm run typecheck
pnpm run build:vercel
```

Then run the high-risk route, webhook, and HTTP-data-service suites, followed by the owned local Chromium command:

```bash
node scripts/run-e2e-fixture.mjs --spec apps/web/e2e/student-release-journey.spec.ts --project chromium
```

That local command creates its own temporary JSON file and an internal, local-only
fixture flag. It cannot activate the lifecycle in a Vercel deployment; Preview
rehearsal projects remain Blob-only and use their fixed fixture namespace.

The permanent baseline and outage rehearsal projects deploy that pull request automatically. Each has a separate Blob store and only generated data. Dispatch **ScholarScout Prelaunch Rehearsal** with the full candidate SHA; it reads the two Vercel Git statuses for that exact commit, reads those two deployment IDs through Vercel's deployment API with their project-scoped Preview tokens, runs the normal journey and the outage proof, and cleans each fixture automatically.

The workflow needs only the two permanent runner capabilities plus its two static project-scoped Preview-environment Vercel tokens. It never receives production credentials, Vercel branch overrides, manually copied URLs, bypass cookies, or a temporary handoff file. It writes only candidate commit, generated Preview URL, UTC, pass/fail result, and safe error category.

For the one-time rehearsal-project configuration, follow [the rehearsal environment runbook](rehearsal-environment-runbook.md). Preview rehearsal evidence supplements—but never replaces—protected-main CI, the real production build log, post-deploy smoke, and incident evidence.

### Referral Destination Release Gate

Phase 07 referral links are test-only `.invalid` fixtures, not public destinations.
Before replacing a fixture or enabling any public referral destination, complete one
per-destination record in
[`07-PRELAUNCH-REFERRAL-RELEASE-GATE.md`](../.planning/phases/07-governed-opportunity-and-support-matching/07-PRELAUNCH-REFERRAL-RELEASE-GATE.md).
The release owner must confirm the source, displayed label, accountable owner,
availability or jurisdiction, review date, accessibility/contact-path review,
consent-copy review, and human sign-off. A missing, stale, or failed record blocks
public referral enablement. Record only the approved evidence identifier or link,
owner role, review date, and pass/fail result in the launch evidence; never include
student information or a provider credential.

## 3. Deploy

Deploy from the repository root with the Docker-free path:

```bash
pnpm run build:vercel
```

Keep the production data adapter on `vercel-blob` or `http`. Do not launch production traffic on the JSON adapter.

## 4. Smoke Test The Deployment

Run unauthenticated checks first:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN pnpm run smoke:production
```

Then run service-token checks:

```bash
SCHOLARSCOUT_SMOKE_BASE_URL=https://YOUR_DOMAIN \
SCHOLARSCOUT_SMOKE_HEALTH_TOKEN='PASTE_HEALTH_TOKEN' \
SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER=vercel-blob \
SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github \
pnpm run smoke:production
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
pnpm run report:production -- --env-report production-env-readiness.json --smoke-report production-smoke-report.json
```

## 7. Record The Protected Release Evidence

Production releases reach Vercel only from a protected `main` merge. Before considering a release complete, retain all of the following in the project operations notes:

1. The protected-`main` pull request and the six successful ScholarScout CI checks.
2. The Vercel production deployment/build-log URL.
3. The **ScholarScout Post-deploy Smoke** workflow run triggered by the successful production deployment and its retained `production-smoke-report` artifact.
4. If smoke fails, the created-or-updated maintainer incident issue, its run/artifact links, and the acknowledgement that [`production-incident-response.md`](production-incident-response.md) was reviewed.
5. For each public referral destination, the completed
   [`07-PRELAUNCH-REFERRAL-RELEASE-GATE.md`](../.planning/phases/07-governed-opportunity-and-support-matching/07-PRELAUNCH-REFERRAL-RELEASE-GATE.md)
   review record and its approved evidence identifier or link.

The post-deploy workflow runs only for successful production deployment events. A smoke failure alerts maintainers and preserves evidence; it never triggers an automatic rollback. Follow the human, data-safe rollback decision process in the incident runbook.

Record the deployment date, adapter, enabled OAuth providers, readiness report result, smoke result, secret rotation owner, and the evidence above in the project operations notes.

If the monitor fails after release, use [`production-incident-response.md`](production-incident-response.md).
