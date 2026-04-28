# ScholarScout

ScholarScout is moving from a single-app prototype toward a monorepo with a student-facing web app, NestJS API, Prisma/PostgreSQL data layer, and service foundations for messaging, billing, ML, simulation, and governance.

## Local Setup

Prerequisites:

- Node.js 20+ and npm, or the project-local `.tools` toolchain
- Docker Desktop

Activate the local Node/npm/Git/GitHub CLI toolchain if system tools are unavailable:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\activate-toolchain.ps1
```

If `.tools` has not been created yet:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-node-toolchain.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\install-git-gh-toolchain.ps1
```

Start PostgreSQL:

```bash
npm run db:up
```

Install dependencies:

```bash
npm install
```

Create API environment:

```bash
cp apps/api/.env.example apps/api/.env
```

Generate and migrate Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

If you change the schema locally and need to create a new migration:

```bash
npm run prisma:migrate:dev
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

Run API tests:

```bash
npm run test:api
```

## Current Stage

Phase 1 is the MVP foundation:

- Clerk-authenticated web shell
- student profile form
- program model
- matching endpoint
- dashboard and inbox UI
- Docker-backed local PostgreSQL
- committed Prisma migrations in `infra/db/migrations`

The next logical stage is Phase 2 messaging:

- persisted notifications
- persisted conversations and messages
- realtime WebSocket delivery
- inbox UI connected to API data
- inbox message composer
- read-status tracking for notifications and messages

After that, the next stage should add authenticated backend guards, real support/school users, and automated tests around the matching and messaging flows.

The current branch includes the first hardening pass for that stage: Clerk-backed protected inbox/message routes, frontend bearer-token wiring, API unit tests, and GitHub Actions CI. See `docs/phase-2-hardening.md` for details and remaining auth follow-up work.

`docs/AGENTS.md` is the repository contract for keeping the Phase 1 MVP aligned across `apps/web`, `apps/api`, `infra/db`, and `docs`.

## Important Note

The GitHub `main` branch currently contains the earlier single Next.js onboarding prototype. This monorepo should be compared in a draft PR before replacing that structure.
