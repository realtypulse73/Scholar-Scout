# External Integrations

**Analysis Date:** 2026-07-25

## APIs & External Services

**AI assistance:**
- OpenAI Responses API - produces optional, context-bounded advisor replies from `apps/web/app/api/advisor-chat/route.ts`.
  - SDK/Client: native `fetch` to `https://api.openai.com/v1/responses`; the `openai` package is declared but not currently used by this route in `apps/web/package.json`.
  - Auth: `OPENAI_API_KEY`; optional model selection uses `OPENAI_MODEL` in `apps/web/app/api/advisor-chat/route.ts`.
  - Resilience: missing credentials and unsuccessful upstream responses return the route's local fallback reply in `apps/web/app/api/advisor-chat/route.ts`.

**OAuth identity:**
- GitHub OAuth - optional social sign-in provider created only when its client ID and secret are both available in `apps/web/auth.ts`.
  - SDK/Client: `next-auth/providers/github` through `next-auth` in `apps/web/auth.ts`.
  - Auth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`; callback is served beneath `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Google OAuth - optional social sign-in provider created only when its client ID and secret are both available in `apps/web/auth.ts`.
  - SDK/Client: `next-auth/providers/google` through `next-auth` in `apps/web/auth.ts`.
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; callback is served beneath `apps/web/app/api/auth/[...nextauth]/route.ts`.

**GitHub automation:**
- GitHub Issues API - the webhook runner can post a Codex job packet as an issue comment in `services/codex-webhook-runner/src/server.mjs`.
  - SDK/Client: native `fetch` to the issue `comments_url` supplied by the GitHub webhook payload.
  - Auth: `GITHUB_TOKEN` in `services/codex-webhook-runner/src/server.mjs`.
- Codex agent endpoint - the same runner forwards a job packet to an externally configured worker endpoint in `services/codex-webhook-runner/src/server.mjs`.
  - SDK/Client: native `fetch`.
  - Auth: endpoint configuration only via `CODEX_AGENT_ENDPOINT`; no request-authentication header is implemented in this service.

**Education reference links:**
- Institution web sites - static programme and campus data links to official admissions and information pages from `apps/web/lib/western-new-york.ts`.
  - SDK/Client: no live SDK or server-side fetch; URLs are rendered as reference links.
  - Auth: Not applicable.

## Data Storage

**Databases:**
- No relational, document-database, ORM, or managed database integration is detected in `apps/web/package.json` or the server data code.
- Local JSON document store - the default `json` adapter reads and writes a full ScholarScout document through Node filesystem APIs in `apps/web/lib/server/data-store.ts`.
  - Connection: `SCHOLARSCOUT_DATA_FILE` optionally overrides the default `data/scholarscout-data.json` path.
  - Client: custom `JsonScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
- HTTP data service - optional adapter reads the full document with `GET` and replaces it with `PUT` through `apps/web/lib/server/data-store.ts`.
  - Connection: `SCHOLARSCOUT_DATA_SERVICE_URL`.
  - Client: custom `HttpScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
  - Compatible fixture: `services/http-data-service/src/server.mjs` exposes `/scholarscout` and `/health`.
- Vercel Blob - optional durable private JSON document adapter in `apps/web/lib/server/data-store.ts`.
  - Connection: `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`; optional object path `SCHOLARSCOUT_BLOB_DATA_PATH`.
  - Client: dynamically imported `@vercel/blob` `get` / `put` calls in `apps/web/lib/server/data-store.ts`.

**File Storage:**
- Vercel Blob provides private persisted document storage when the `vercel-blob` adapter is selected in `apps/web/lib/server/data-store.ts`.
- Local filesystem storage is used by the default JSON adapter in `apps/web/lib/server/data-store.ts` and the HTTP fixture in `services/http-data-service/src/server.mjs`, which creates timestamped local backups.
- Static application media is repository-served from `apps/web/public/images/`; no separate public object-store upload integration is detected.

**Caching:**
- No standalone cache service is detected in `apps/web/` or `services/`.
- HTTP data-adapter reads opt out of caching, while Vercel Blob writes use a 60-second cache-control maximum age in `apps/web/lib/server/data-store.ts`.

## Authentication & Identity

**Auth Provider:**
- Auth.js / NextAuth.js with JWT sessions in `apps/web/auth.ts` and `apps/web/app/api/auth/[...nextauth]/route.ts`.
  - Implementation: email/password credentials are verified against the configured ScholarScout data store; Google and GitHub are conditionally enabled OAuth providers; OAuth users are stored or resolved through `apps/web/lib/server/data-store.ts`.
  - Session configuration: `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are required production settings validated by `scripts/production-env-check.mjs`.
  - Authorization: staff identities are based on the `SCHOLARSCOUT_STAFF_EMAILS` allowlist in `apps/web/lib/server/data-store.ts`.

## Monitoring & Observability

**Error Tracking:**
- No external error-tracking provider is detected in `apps/web/package.json`, `services/http-data-service/package.json`, or `services/codex-webhook-runner/package.json`.

**Logs:**
- Node services write lifecycle information with `console.log` / `console.warn` in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Production health and route checks run every six hours and publish/upload reports from `.github/workflows/production-monitor.yml`, backed by `scripts/production-smoke.mjs` and `scripts/production-report-summary.mjs`.
- Production configuration validation is run manually through `.github/workflows/production-readiness.yml` and `scripts/production-env-check.mjs`.

## CI/CD & Deployment

**Hosting:**
- Vercel hosts the Next.js app: `vercel.json` sets the framework, root install/build commands, and `apps/web/.next` output directory.
- Separate Node processes may host the optional data fixture and GitHub webhook runner, with start commands in `services/http-data-service/package.json` and `services/codex-webhook-runner/package.json`; deployment platform for those processes is not configured in-repository.

**CI Pipeline:**
- GitHub Actions runs Node 20 quality checks for the web workspace in `.github/workflows/ci.yml`.
- GitHub Actions runs production readiness and scheduled smoke monitoring using repository/environment secrets in `.github/workflows/production-readiness.yml` and `.github/workflows/production-monitor.yml`.
- GitHub Actions can generate operational roadmap artifacts and issue packets in `.github/workflows/autonomous-product-manager.yml`.

## Environment Configuration

**Required env vars:**
- Core production auth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SCHOLARSCOUT_STAFF_EMAILS`, and `SCHOLARSCOUT_HEALTH_TOKEN`, as required by `scripts/production-env-check.mjs`.
- At least one intended OAuth provider: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` or `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, unless credentials-only production is intentionally allowed with `SCHOLARSCOUT_ALLOW_CREDENTIALS_ONLY_PRODUCTION`; validation resides in `scripts/production-env-check.mjs`.
- Storage: select `SCHOLARSCOUT_DATA_ADAPTER`; configure Blob credentials (`SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`) or HTTP settings (`SCHOLARSCOUT_DATA_SERVICE_URL`, optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN`) as implemented in `apps/web/lib/server/data-store.ts`.
- AI advisor: `OPENAI_API_KEY`; optional `OPENAI_MODEL`, used in `apps/web/app/api/advisor-chat/route.ts`.
- Webhook automation: `GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`, and `CODEX_AGENT_ENDPOINT`, used in `services/codex-webhook-runner/src/server.mjs`.

**Secrets location:**
- Deployment values are supplied as hosting environment variables and GitHub Actions secrets; the mappings for production readiness and monitoring are in `.github/workflows/production-readiness.yml` and `.github/workflows/production-monitor.yml`.
- Local prelaunch provisioning writes a local environment file through `scripts/provision-environment.mjs`; example environment files are present at `.env.prelaunch.local.example` and `.env.production.example` and are not read by this audit.

## Webhooks & Callbacks

**Incoming:**
- `POST /github/webhook` - the GitHub webhook runner in `services/codex-webhook-runner/src/server.mjs` accepts qualifying GitHub `issues` events, checks the `x-hub-signature-256` HMAC header when `GITHUB_WEBHOOK_SECRET` is configured, and supports `opened` / `labeled` issue actions with `codex` or `automation` labels.
- `GET /health` - the same service exposes a service liveness endpoint in `services/codex-webhook-runner/src/server.mjs`; the HTTP data fixture exposes its own `GET /health` in `services/http-data-service/src/server.mjs`.
- Auth.js provider callbacks are handled by `apps/web/app/api/auth/[...nextauth]/route.ts`, including GitHub and Google callbacks when those providers are enabled by `apps/web/auth.ts`.

**Outgoing:**
- The GitHub webhook runner comments on qualifying issues via the GitHub Issues API and posts its generated job packet to `CODEX_AGENT_ENDPOINT`, both from `services/codex-webhook-runner/src/server.mjs`.
- The advisor route submits context and a student question to the OpenAI Responses API from `apps/web/app/api/advisor-chat/route.ts`.
- The HTTP data adapter makes authenticated `GET` / `PUT` calls to `SCHOLARSCOUT_DATA_SERVICE_URL` from `apps/web/lib/server/data-store.ts`.

---

*Integration audit: 2026-07-25*
