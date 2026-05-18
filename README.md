# Scholar-Scout Monorepo

ScholarScout is a rejection-free post-secondary discovery platform that matches students with programmes that fit their goals, budget, and life circumstances.

## Workspace Layout

- `apps/web`: Next.js web application
- `packages/*`: shared packages reserved for extracted libraries and configs
- `services/*`: backend or worker services
- `docs`: project docs and backlog notes

The project shortcut/rubric lives at [`docs/scholarscout-rubric.md`](docs/scholarscout-rubric.md).

## Prerequisites

- Node.js 18+
- npm 10+

## Install Dependencies

```bash
npm install
```

npm will install the workspace root plus every package under `apps/*`, `packages/*`, and `services/*`.

Docker is not required for the current frontend workspace. If Docker is unavailable, use the Node/npm workflow in [`docs/docker-free-development.md`](docs/docker-free-development.md).

For cloud builds, deploy from the repository root with Vercel using [`docs/vercel-deployment.md`](docs/vercel-deployment.md). If Docker is unavailable, use the explicit Vercel workaround in [`docs/vercel-docker-workaround.md`](docs/vercel-docker-workaround.md).
Vercel access and role requirements are captured in [`docs/vercel-permissions-handoff.md`](docs/vercel-permissions-handoff.md).

Before enabling production traffic, use the OAuth, staff allowlist, and durable data-store checklist in [`docs/production-readiness-checklist.md`](docs/production-readiness-checklist.md).
Provider-specific production secret setup notes live in [`docs/production-secret-provider-notes.md`](docs/production-secret-provider-notes.md).
Google OAuth access requirements are captured in [`docs/google-oauth-permissions-handoff.md`](docs/google-oauth-permissions-handoff.md).
GitHub-first OAuth setup lives in [`docs/github-oauth-first-handoff.md`](docs/github-oauth-first-handoff.md).
The production release sequence lives in [`docs/production-release-runbook.md`](docs/production-release-runbook.md).
Production incident response notes live in [`docs/production-incident-response.md`](docs/production-incident-response.md).
Prelaunch evidence can use [`docs/prelaunch-evidence-template.md`](docs/prelaunch-evidence-template.md).
Use [`.env.production.example`](.env.production.example) as the production variable name template.
Use [`.env.prelaunch.local.example`](.env.prelaunch.local.example) for a local rehearsal workaround before real provider secrets exist.

## Common Commands

From the repository root:

```bash
npm run dev
npm run build
npm run build:vercel
npm run check:production-env
npm run provision:env
npm run provision:production-values
npm run rehearse:prelaunch
npm run report:production
npm run vercel:docker-free
npm run smoke:production
npm run test:production-tooling
npm run lint
npm run test
npm run typecheck
```

Local staff tools:

- Programme draft CMS: `/admin/programmes`
- Feed analytics: `/admin/feed`
- Operations dashboard: `/admin/ops`
- Student shortlist comparison: `/shortlist`
- TikTok-style pathway feed: `/feed`
- Simulation player: `/simulate`
- AI advisor chat: `/advisor`
- Explainable recommendations: `/recommendations`
- Creator profile example: `/u/maya-health`

Auth and account-backed data:

- Sign in: `/auth/sign-in`
- Sign up: `/auth/sign-up`
- Profile: `/profile`
- Runtime env: set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for NextAuth.
- Optional OAuth providers: launch with `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` first; add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` later. OAuth accounts are created in the active data store on first sign-in.
- Optional AI advisor: set server-only `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. `/api/advisor-chat` uses the OpenAI Responses API when configured and falls back to a deterministic advisor reply when no key is present.
- Optional staff allowlist: set `SCHOLARSCOUT_STAFF_EMAILS` as a comma-separated list for OAuth users who should receive staff access.
- Optional health token: set `SCHOLARSCOUT_HEALTH_TOKEN` to enable bearer-token production data health checks at `/api/admin/data/health`.
- Optional smoke provider expectation: set `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` as a comma-separated list such as `github` for the first launch or `github,google` after Google is added.
- Optional smoke timeout: set `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` to tune per-request smoke-check timeouts; the default is 10000.
- Optional smoke retry count: set `SCHOLARSCOUT_SMOKE_RETRIES` for transient network retries; the default is 1.
- Optional smoke latency ceiling: set `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` to fail smoke checks when any successful request is slower than the configured milliseconds.
- Optional local data path: set `SCHOLARSCOUT_DATA_FILE`; otherwise the app writes development account data under `data/scholarscout-data.json`.
- Optional data adapter selector: set `SCHOLARSCOUT_DATA_ADAPTER=json` for the local JSON adapter, `SCHOLARSCOUT_DATA_ADAPTER=http` with `SCHOLARSCOUT_DATA_SERVICE_URL` and optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN` for a service-backed adapter, or `SCHOLARSCOUT_DATA_ADAPTER=vercel-blob` with `BLOB_READ_WRITE_TOKEN` for Vercel Blob storage. The HTTP adapter operations handoff lives in [`docs/http-data-adapter-runbook.md`](docs/http-data-adapter-runbook.md), and the Vercel Blob setup lives in [`docs/vercel-blob-data-adapter.md`](docs/vercel-blob-data-adapter.md).
- Local HTTP service fixture: run `npm run dev --workspace @scholar-scout/http-data-service` to test the HTTP adapter contract without Docker.
- Production env check: run `npm run check:production-env` in an environment that has the intended production secrets to catch missing OAuth, staff allowlist, data adapter, and health-token settings before deployment.
- Local env provisioning: run `npm run provision:env` to generate an ignored `.env.prelaunch.local` and a production provisioning checklist.
- Production value handoff: run `npm run provision:production-values -- --production-url https://YOUR_DOMAIN --staff-emails you@example.org` to generate ignored local production secrets and a provider setup checklist. Use `--local-file PATH` only when you need a non-default output path.
- Production env report: run `npm run check:production-env -- --json` when CI or release notes need a machine-readable readiness report without printing secret values.
- Env-file workaround: append `-- --env-file .env.prelaunch.local` to `check:production-env`, `rehearse:prelaunch`, or `smoke:production` after copying the local prelaunch template and filling placeholders.

Target just the web app:

```bash
npm run dev --workspace @scholar-scout/web
npm run build --workspace @scholar-scout/web
```

## Current App Structure

```text
apps/
  web/
    app/
    components/
    lib/
    __tests__/
    package.json
packages/
services/
  http-data-service/
docs/
```

## Notes

- The original single-app scaffold has been converted into an npm workspace layout.
- Shared packages and services are scaffolded as top-level workspace folders so future additions follow the same install and build flow.
- If you add another app, package, or service, give it its own `package.json` and matching scripts so the root workspace commands pick it up automatically.

