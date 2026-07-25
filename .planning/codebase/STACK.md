# Technology Stack

**Analysis Date:** 2026-07-25

## Languages

**Primary:**
- TypeScript 5.x - application, API routes, React components, server data adapters, and Jest tests in `apps/web/`.
- JavaScript (ES modules) - Node.js services and operational tooling in `services/http-data-service/`, `services/codex-webhook-runner/`, and `scripts/`.

**Secondary:**
- CSS - global styles in `apps/web/app/globals.css`, processed with Tailwind/PostCSS configuration in `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs`.
- YAML - CI, production readiness, monitoring, and automation workflows in `.github/workflows/`.
- JSON - workspace metadata in `package.json`, deployment configuration in `vercel.json`, and the optional persisted ScholarScout document managed by `apps/web/lib/server/data-store.ts`.

## Runtime

**Environment:**
- Node.js 20.x - required by the root workspace and both standalone services in `package.json`, `services/http-data-service/package.json`, and `services/codex-webhook-runner/package.json`.
- Browser/Edge-facing runtime - Next.js App Router pages and route handlers in `apps/web/app/` run through the Next.js server build configured by `apps/web/next.config.mjs`.

**Package Manager:**
- npm 10.x - declared by `packageManager` and `engines` in `package.json`; root scripts use npm workspaces.
- Lockfile: `package-lock.json` is present (lockfile v3). `pnpm-lock.yaml` and `apps/web/pnpm-lock.yaml` are also present, but the root package manager declaration remains npm.

## Frameworks

**Core:**
- Next.js 15.5.15 - full-stack web framework and App Router, used by `apps/web/app/` and configured in `apps/web/next.config.mjs`.
- React 18 - UI component runtime for `apps/web/components/` and `apps/web/app/`.
- Auth.js / NextAuth.js 4.24.14 - JWT session and provider integration configured in `apps/web/auth.ts` and served at `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Tailwind CSS 3.4.1 - utility styling scanned from `apps/web/app/` and `apps/web/components/`, with theme tokens in `apps/web/tailwind.config.ts`.

**Testing:**
- Jest 30.3.0 with Next.js integration (`next/jest`) - browser-like component and route tests configured in `apps/web/jest.config.ts`.
- Testing Library (`@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom`) - React interaction and assertion support declared in `apps/web/package.json`.
- Node built-in test runner - standalone HTTP service tests in `services/http-data-service/test/server.test.mjs`.

**Build/Dev:**
- TypeScript 5.x - strict, no-emit compilation for the web workspace configured in `apps/web/tsconfig.json`.
- ESLint 8 with `eslint-config-next` - linting command and Next core-web-vitals/TypeScript rules configured in `apps/web/package.json` and `apps/web/.eslintrc.json`.
- PostCSS 8 - Tailwind processing configured in `apps/web/postcss.config.mjs`.
- GitHub Actions - CI and production operational jobs in `.github/workflows/ci.yml`, `.github/workflows/production-readiness.yml`, and `.github/workflows/production-monitor.yml`.

## Key Dependencies

**Critical:**
- `next` 15.5.15 - renders pages and executes route handlers under `apps/web/app/`; source version is declared in `apps/web/package.json`.
- `react` / `react-dom` 18 - renders the client UI in `apps/web/components/`; versions are declared in `apps/web/package.json`.
- `next-auth` 4.24.14 - implements credentials, GitHub, and Google sign-in in `apps/web/auth.ts`.
- `@vercel/blob` 2.3.3 - dynamically imported for the optional durable Blob-backed data adapter in `apps/web/lib/server/data-store.ts`.
- `openai` 6.10.0 - declared in `apps/web/package.json`; the current advisor route uses a direct Responses API `fetch` instead of this SDK in `apps/web/app/api/advisor-chat/route.ts`.

**Infrastructure:**
- Node.js built-ins (`node:http`, `node:fs/promises`, `node:crypto`) - implement the local HTTP data fixture in `services/http-data-service/src/server.mjs` and GitHub webhook runner in `services/codex-webhook-runner/src/server.mjs`.
- `ts-node` 10.9.2 - root development dependency declared in `package.json`.

## Configuration

**Environment:**
- Runtime settings are read from `process.env` in `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/app/api/advisor-chat/route.ts`, service entrypoints, and production scripts. Example environment files exist at `.env.prelaunch.local.example` and `.env.production.example`; their contents are not part of this analysis.
- Authentication uses `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, optional OAuth pairs `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` and `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, plus `SCHOLARSCOUT_STAFF_EMAILS`; requirements are enforced by `scripts/production-env-check.mjs`.
- Data storage is selected with `SCHOLARSCOUT_DATA_ADAPTER` in `apps/web/lib/server/data-store.ts`: `json` (default local file, optionally `SCHOLARSCOUT_DATA_FILE`), `http` (`SCHOLARSCOUT_DATA_SERVICE_URL` and optional `SCHOLARSCOUT_DATA_SERVICE_TOKEN`), or `vercel-blob` (`SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN`, with optional `SCHOLARSCOUT_BLOB_DATA_PATH`).
- The optional advisor uses `OPENAI_API_KEY` and optional `OPENAI_MODEL` in `apps/web/app/api/advisor-chat/route.ts`.
- Production readiness and smoke-monitor settings are defined in `scripts/production-env-check.mjs` and consumed by `.github/workflows/production-readiness.yml` and `.github/workflows/production-monitor.yml`.

**Build:**
- Root workspace scripts and workspace topology are configured in `package.json`; web scripts live in `apps/web/package.json`.
- Next.js configuration is intentionally minimal in `apps/web/next.config.mjs`; TypeScript path alias `@/*` resolves from `apps/web/` in `apps/web/tsconfig.json`.
- Vercel builds from repository root with `npm install --ignore-scripts` and `npm run build:vercel`, configured in `vercel.json` and documented in `docs/vercel-deployment.md`.
- Tailwind theme and content globs are configured in `apps/web/tailwind.config.ts`; PostCSS points at the JavaScript Tailwind config in `apps/web/postcss.config.mjs`.

## Platform Requirements

**Development:**
- Node.js 20.x and npm 10.x are required by `package.json`; install dependencies from the root and use `npm run dev` for the web workspace.
- To exercise the HTTP data contract locally, run `npm run dev --workspace @scholar-scout/http-data-service`; its documented local endpoint is described in `docs/http-data-adapter-runbook.md`.
- No Docker dependency is required for current development or the Vercel build path; the supported Docker-free commands are documented in `docs/docker-free-development.md`.

**Production:**
- Vercel is the configured hosting target for the Next.js web app via `vercel.json` and `docs/vercel-deployment.md`.
- Durable production storage must use the Vercel Blob or HTTP adapter; `scripts/production-env-check.mjs` rejects the local JSON adapter for production readiness.
- GitHub Actions runs web quality, production readiness, and scheduled production smoke checks through `.github/workflows/ci.yml`, `.github/workflows/production-readiness.yml`, and `.github/workflows/production-monitor.yml`.

---

*Stack analysis: 2026-07-25*
