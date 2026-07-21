# External Integrations

**Analysis Date:** 2026-07-21

## APIs & External Services

**AI Advisor:**
- OpenAI Responses API - generates short, grounded student-advisor replies with an offline fallback in `apps/web/app/api/advisor-chat/route.ts`.
  - SDK/Client: native server-side `fetch` to `https://api.openai.com/v1/responses`; `openai` ^6.10.0 is installed but not used by this route.
  - Auth: `OPENAI_API_KEY`; optional model override `OPENAI_MODEL`, defaulting to `gpt-4.1-mini`.

**OAuth Identity:**
- Google OAuth - optional sign-in provider registered only when configured in `apps/web/auth.ts`.
  - SDK/Client: `next-auth/providers/google` from `next-auth`.
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- GitHub OAuth - optional sign-in provider registered only when configured in `apps/web/auth.ts`.
  - SDK/Client: `next-auth/providers/github` from `next-auth`.
  - Auth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

**Persistence Services:**
- Vercel Blob - private single-document durable storage through `VercelBlobScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
  - SDK/Client: `@vercel/blob` dynamic imports of `get` and `put`.
  - Auth: `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or fallback `BLOB_READ_WRITE_TOKEN`; path override `SCHOLARSCOUT_BLOB_DATA_PATH`.
- ScholarScout-compatible HTTP data service - full-document GET/PUT persistence through `HttpScholarScoutDataStore` in `apps/web/lib/server/data-store.ts`.
  - SDK/Client: native server-side `fetch`; local contract implementation in `services/http-data-service/src/server.mjs`.
  - Auth: optional bearer token `SCHOLARSCOUT_DATA_SERVICE_TOKEN`; endpoint `SCHOLARSCOUT_DATA_SERVICE_URL`.

**GitHub Automation:**
- GitHub Issues webhooks and REST API - the optional runner verifies issue events, creates Codex work packets, and comments on issues in `services/codex-webhook-runner/src/server.mjs`.
  - SDK/Client: native Node `http`, `crypto`, and `fetch`.
  - Auth: `GITHUB_WEBHOOK_SECRET` for HMAC verification and `GITHUB_TOKEN` for GitHub API calls.
- Optional Codex execution endpoint - forwards generated packets from `services/codex-webhook-runner/src/server.mjs`.
  - SDK/Client: native `fetch`.
  - Auth: endpoint configured by `CODEX_AGENT_ENDPOINT`; no separate endpoint credential is implemented.

## Data Storage

**Databases:**
- No relational or document database client is detected. `apps/web/lib/server/data-store.ts` defines a whole-document `ScholarScoutDataStore` abstraction with JSON, HTTP, and Vercel Blob implementations.
  - Connection: `SCHOLARSCOUT_DATA_ADAPTER` selects the implementation; HTTP uses `SCHOLARSCOUT_DATA_SERVICE_URL`.
  - Client: custom TypeScript adapter in `apps/web/lib/server/data-store.ts`.

**File Storage:**
- Local JSON storage is the development default at `data/scholarscout-data.json`, configurable through `SCHOLARSCOUT_DATA_FILE`, in `apps/web/lib/server/data-store.ts`.
- The local fixture persists its document and timestamped backups through `services/http-data-service/src/server.mjs`, with file override `SCHOLARSCOUT_DATA_SERVICE_FILE`.
- Vercel Blob stores the same full data document privately, defaulting to `scholarscout/data.json`, through `apps/web/lib/server/data-store.ts`.

**Caching:**
- No dedicated cache service is detected. HTTP reads and Blob reads bypass caching in `apps/web/lib/server/data-store.ts`; Blob writes set a short 60-second cache-control maximum.

## Authentication & Identity

**Auth Provider:**
- NextAuth.js with custom credentials plus optional Google and GitHub OAuth in `apps/web/auth.ts`.
  - Implementation: JWT session strategy; the catch-all endpoint is `apps/web/app/api/auth/[...nextauth]/route.ts` and custom sign-in UI is under `apps/web/app/auth/`.
  - Credentials users are persisted by `apps/web/lib/server/data-store.ts`; passwords use Node `scryptSync` with per-user UUID salts and timing-safe comparison.
  - OAuth users are created or matched in the same ScholarScout store by `findOrCreateOAuthUser` in `apps/web/lib/server/data-store.ts`.
  - Staff role assignment is an email allowlist from `SCHOLARSCOUT_STAFF_EMAILS` in `apps/web/lib/server/data-store.ts`.
  - NextAuth production runtime additionally requires `NEXTAUTH_SECRET` and `NEXTAUTH_URL`, as documented in `docs/vercel-blob-data-adapter.md` and `docs/http-data-adapter-runbook.md`.

## Monitoring & Observability

**Error Tracking:**
- No external error-tracking service is detected in `package.json` or application imports.

**Logs:**
- Next.js route failures generally return JSON errors from handlers under `apps/web/app/api/`; no centralized structured logger is detected.
- The HTTP fixture and webhook runner log lifecycle and request failures to the Node console in `services/http-data-service/src/server.mjs` and `services/codex-webhook-runner/src/server.mjs`.
- Product-operation reports and prelaunch evidence are generated into `reports/product-ops/` and `reports/prelaunch-rehearsal/` by scripts in `scripts/`.
- Production smoke monitoring runs through `.github/workflows/production-monitor.yml` and `scripts/production-smoke.mjs`; thresholds and expected providers/adapters are supplied through `SCHOLARSCOUT_SMOKE_*` configuration.

## CI/CD & Deployment

**Hosting:**
- Vercel hosts the Next.js web application according to `vercel.json` and `docs/vercel-deployment.md`; it installs at repository root and builds only `@scholar-scout/web`.
- Hosting for `services/http-data-service/` and `services/codex-webhook-runner/` is not configured in the repository.

**CI Pipeline:**
- GitHub Actions is configured under `.github/workflows/`.
- `.github/workflows/ci.yml` runs Node 20 install, typecheck, lint, Jest tests, and the web build for pushes and pull requests to `main`.
- `.github/workflows/production-readiness.yml` validates production environment readiness and deployment tooling.
- `.github/workflows/prelaunch-rehearsal.yml` runs the prelaunch evidence workflow.
- `.github/workflows/production-monitor.yml` runs production smoke checks and uploads a report artifact.
- `.github/workflows/product-ops.yml` and `.github/workflows/autonomous-product-manager.yml` produce ongoing product-operation artifacts; `.github/workflows/issue-to-pr.md` documents issue automation rather than defining an executable YAML workflow.

## Environment Configuration

**Required env vars:**
- Core production auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (`docs/vercel-blob-data-adapter.md`, `docs/http-data-adapter-runbook.md`).
- Optional OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (`apps/web/auth.ts`).
- Optional advisor: `OPENAI_API_KEY`, `OPENAI_MODEL` (`apps/web/app/api/advisor-chat/route.ts`); absence of the key activates deterministic fallback guidance.
- Persistence selector: `SCHOLARSCOUT_DATA_ADAPTER` (`apps/web/lib/server/data-store.ts`).
- JSON adapter: optional `SCHOLARSCOUT_DATA_FILE` (`apps/web/lib/server/data-store.ts`).
- HTTP adapter: `SCHOLARSCOUT_DATA_SERVICE_URL`, optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN` (`apps/web/lib/server/data-store.ts`).
- Blob adapter: `BLOB_READ_WRITE_TOKEN` or `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN`, optional `SCHOLARSCOUT_BLOB_DATA_PATH` (`apps/web/lib/server/data-store.ts`).
- Roles: optional `SCHOLARSCOUT_STAFF_EMAILS` (`apps/web/lib/server/data-store.ts`).
- HTTP fixture: optional `PORT`, `SCHOLARSCOUT_DATA_SERVICE_FILE`, `SCHOLARSCOUT_DATA_SERVICE_TOKEN` (`services/http-data-service/src/server.mjs`).
- Webhook runner: `GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`, optional `CODEX_AGENT_ENDPOINT` and `PORT` (`services/codex-webhook-runner/src/server.mjs`).
- Operational scripts use `SCHOLARSCOUT_SMOKE_BASE_URL`, `SCHOLARSCOUT_SMOKE_EXPECTED_ADAPTER`, `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS`, `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN`, `SCHOLARSCOUT_SMOKE_STAFF_COOKIE`, timeout/latency/retry settings, and `PRODUCT_OPS_OUTPUT_DIR` in `scripts/`.

**Secrets location:**
- Real secrets belong in Vercel project environment settings and GitHub Actions repository/environment secrets, as used by `.github/workflows/production-readiness.yml` and `.github/workflows/production-monitor.yml`.
- Local/deployment templates `.env.production.example` and `.env.prelaunch.local.example` exist at repository root; do not commit populated environment files.

## Webhooks & Callbacks

**Incoming:**
- `POST /api/auth/[...nextauth]` and related NextAuth callbacks are handled by `apps/web/app/api/auth/[...nextauth]/route.ts` for credentials and configured OAuth providers.
- `POST /github/webhook` receives GitHub issue events in `services/codex-webhook-runner/src/server.mjs`; requests require valid `X-Hub-Signature-256` HMAC when the service is configured.
- Application JSON endpoints under `apps/web/app/api/` receive account, feed, simulation, analytics, advisor, referral, sharing, decision, A/B assignment, registration, and programme-administration requests.

**Outgoing:**
- `apps/web/app/api/advisor-chat/route.ts` calls `https://api.openai.com/v1/responses` for advisor completions.
- `apps/web/lib/server/data-store.ts` calls the configured `SCHOLARSCOUT_DATA_SERVICE_URL` for full-document reads and writes when using the HTTP adapter.
- `services/codex-webhook-runner/src/server.mjs` calls the GitHub API to post issue comments and optionally calls `CODEX_AGENT_ENDPOINT` with a generated execution packet.
- Vercel Blob SDK calls originate in `apps/web/lib/server/data-store.ts` when the `vercel-blob` adapter is selected.

---

*Integration audit: 2026-07-21*
