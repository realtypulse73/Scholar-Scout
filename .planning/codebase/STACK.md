# Technology Stack

**Analysis Date:** 2026-07-21

## Languages

**Primary:**
- TypeScript 5.x - Next.js pages, API route handlers, React components, domain logic, server storage adapters, and Jest tests under `apps/web/`.
- JavaScript (ECMAScript modules) - repository automation and the two lightweight Node services under `scripts/` and `services/`.

**Secondary:**
- CSS - global design tokens and application styling in `apps/web/app/globals.css`.
- PowerShell - portable Node/npm bootstrapping on Windows in `scripts/use-portable-node.ps1` and `scripts/npm-portable.ps1`.
- YAML - GitHub Actions workflows in `.github/workflows/`.

## Runtime

**Environment:**
- Node.js 20.x - declared in `package.json` and `services/codex-webhook-runner/package.json`; Vercel and GitHub Actions are configured for Node 20.
- Browser runtime - React client components use browser APIs and call same-origin Next.js endpoints from `apps/web/components/` and `apps/web/app/feed/page.tsx`.
- Next.js server runtime - server components, route handlers, authentication, persistence, and OpenAI requests run from `apps/web/app/`, `apps/web/auth.ts`, and `apps/web/lib/server/`.

**Package Manager:**
- npm 10.x - authoritative workspace manager declared by `packageManager` and `engines` in `package.json`.
- Lockfile: present at `package-lock.json`; use it from the repository root for reproducible workspace installs.
- A secondary pnpm lock/workspace file exists at `apps/web/pnpm-lock.yaml` and `apps/web/pnpm-workspace.yaml`, but root scripts, CI, and deployment use npm; do not update pnpm metadata unless deliberately standardizing package management.

## Frameworks

**Core:**
- Next.js ^15.5.15 - App Router web application, server rendering, server components, and HTTP route handlers in `apps/web/app/`.
- React ^18 and React DOM ^18 - interactive UI under `apps/web/components/` and client pages such as `apps/web/app/feed/page.tsx`.
- NextAuth.js ^4.24.14 - JWT sessions, credentials authentication, and optional OAuth in `apps/web/auth.ts` and `apps/web/app/api/auth/[...nextauth]/route.ts`.
- Tailwind CSS ^3.4.1 with PostCSS ^8 - styling pipeline configured by `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs`.

**Testing:**
- Jest ^30.3.0 - web unit, component, and route tests configured in `apps/web/jest.config.ts`.
- Testing Library React ^16.3.2, jest-dom ^6.9.1, and user-event ^14.6.1 - DOM/component assertions under `apps/web/__tests__/`.
- Node built-in test runner - service and production-tooling tests in `services/http-data-service/test/server.test.mjs` and `scripts/test-production-tooling.mjs`.

**Build/Dev:**
- Next.js CLI - `next dev`, `next build`, and `next start` in `apps/web/package.json`.
- TypeScript compiler ^5 - strict no-emit validation configured by `apps/web/tsconfig.json`.
- ESLint ^8 with eslint-config-next ^15.5.15 - linting for `.ts` and `.tsx` through `apps/web/package.json`.
- ts-jest ^29.4.9 and ts-node ^10.9.2 - TypeScript Jest configuration and transforms in `apps/web/jest.config.ts`.

## Key Dependencies

**Critical:**
- `next` ^15.5.15 - owns routing, rendering, compilation, and API endpoints for `apps/web/`.
- `next-auth` ^4.24.14 - owns identity/session integration through `apps/web/auth.ts`.
- `@vercel/blob` ^2.3.3 - optional durable JSON document persistence selected by `apps/web/lib/server/data-store.ts`.
- `openai` ^6.10.0 - declared in `apps/web/package.json`; the current advisor implementation calls the Responses REST endpoint directly from `apps/web/app/api/advisor-chat/route.ts` rather than using the SDK.

**Infrastructure:**
- Native Node `http`, `fs/promises`, and `crypto` - implement the no-dependency HTTP data fixture in `services/http-data-service/src/server.mjs`, webhook runner in `services/codex-webhook-runner/src/server.mjs`, local JSON adapter, password hashing, and webhook verification.
- Vercel configuration - deploys the web workspace using root `vercel.json` and `npm run build:vercel` from `package.json`.

## Configuration

**Environment:**
- Environment is read only on server-side code, chiefly `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/app/api/advisor-chat/route.ts`, and the services under `services/`.
- Example templates are present as `.env.production.example` and `.env.prelaunch.local.example`; their contents were not inspected. Store real values in deployment settings or an uncommitted local environment file.
- Select persistence with `SCHOLARSCOUT_DATA_ADAPTER`: `json` (default), `http`, or `vercel-blob`, as implemented in `apps/web/lib/server/data-store.ts`.
- Configure TypeScript imports through the `@/*` alias in `apps/web/tsconfig.json`; resolve it relative to `apps/web/`.

**Build:**
- `package.json` - npm workspace graph, Node/npm engines, root quality commands, production scripts, and Vercel build entry.
- `apps/web/next.config.mjs` - minimal Next.js configuration.
- `apps/web/tsconfig.json` - strict TypeScript, bundler module resolution, ES2017 target, and `@/*` alias.
- `apps/web/tailwind.config.ts` and `apps/web/postcss.config.mjs` - CSS processing.
- `apps/web/jest.config.ts` and `apps/web/jest.setup.ts` - jsdom tests and DOM matchers.
- `vercel.json` - root install/build commands and `apps/web/.next` output.

## Platform Requirements

**Development:**
- Use Node.js 20.x and npm 10.x from the repository root; install with `npm install` or the deployment-compatible `npm install --ignore-scripts`.
- Start the web application with `npm run dev`; start the local HTTP persistence fixture separately with `npm run dev --workspace @scholar-scout/http-data-service` when exercising the HTTP adapter.
- Use `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build:web` as the baseline gates defined in `package.json`.
- Windows environments without a global Node installation can use `scripts/use-portable-node.ps1` and `scripts/npm-portable.ps1`.

**Production:**
- Vercel is the documented web target in `vercel.json` and `docs/vercel-deployment.md`, building from the repository root on Node 20.x.
- Production persistence must use a durable adapter (`vercel-blob` or compatible `http` service); the default JSON adapter in `apps/web/lib/server/data-store.ts` writes local process storage and is explicitly non-durable.
- The standalone services in `services/http-data-service/` and `services/codex-webhook-runner/` require their own Node 20-compatible hosts if deployed; they are not part of the Vercel web build.

---

*Stack analysis: 2026-07-21*
