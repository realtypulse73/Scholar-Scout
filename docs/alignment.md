# ScholarScout Alignment

This document links the current state of ScholarScout across ChatGPT, Codex, and GitHub so the repository carries the working truth instead of leaving it split across chat threads.

## GitHub Repository

- Repository: https://github.com/realtypulse73/Scholar-Scout
- Default branch: `main`
- Draft PR: https://github.com/realtypulse73/Scholar-Scout/pull/2
- Active integration branch: `codex/monorepo-scaffold`
- Current integration commit: `b5e29a1`
- Tracking issues:
  - https://github.com/realtypulse73/Scholar-Scout/issues/3
  - https://github.com/realtypulse73/Scholar-Scout/issues/4
  - https://github.com/realtypulse73/Scholar-Scout/issues/5
- Current comparison target:
  - `main` still represents the earlier single-app Next.js repository state
  - `codex/monorepo-scaffold` contains the aligned Phase 1 monorepo MVP plus Phase 2 hardening work

## Repository Truth

GitHub is the system of record once changes are committed and pushed. ChatGPT should define architecture and features, but the latest committed GitHub state wins unless `docs/AGENTS.md` is deliberately updated with a newer contract first.

## Current Implemented State

The current Codex workspace at `C:\Users\spdav\Documents\New project\scholarscout` matches the pushed `codex/monorepo-scaffold` branch.

Key local files:

- `package.json`: monorepo scripts and Docker/Postgres helpers.
- `docker-compose.yml`: local PostgreSQL container.
- `apps/api`: NestJS API with Prisma, users, student profiles, programs, matching, notifications, conversations, messages, and realtime gateway.
- `apps/web`: Next.js frontend with Clerk auth, profile UI, programs catalog, match results, inbox, dashboard, and bearer-token API calls for protected inbox flows.
- `apps/admin`: initial school analytics dashboard shell.
- `infra/db/schema.prisma`: PostgreSQL schema for User, StudentProfile, Program, Match, Notification, Conversation, and Message.
- `infra/db/migrations`: committed baseline Prisma migration for fresh setup.
- `services/*`: foundations for messaging, billing, ML, simulation, and governance.
- `docs/architecture.md`: platform architecture.
- `docs/api-spec.md`: API contract.
- `docs/roadmap.md`: phased roadmap.
- `docs/AGENTS.md`: the operating contract for ChatGPT, Codex, and GitHub handoff.
- `docs/phase-2-hardening.md`: the current messaging hardening status and next implementation targets.

## Current Tooling Status

- Local project-scoped `git` is available through `.tools`.
- Local project-scoped `gh` is available through `.tools`, but is not authenticated right now.
- Docker is not available in this shell.
- Node/npm are available through `.tools`.
- The GitHub connector token used by ChatGPT/Codex is currently expired.

Updated toolchain status:

- `npm install` completed.
- `npm run prisma:generate` completed.
- `npm run test:api` completed.
- `npm run build:api` completed.
- `npm run build:web` completed.
- `npm run build:admin` completed.

## Alignment Status

- `docs/AGENTS.md` defines the operating loop.
- `docs/alignment.md` records the current shared state.
- `codex/monorepo-scaffold` is the current implementation branch.
- Draft PR #2 is the review surface comparing the old single-app repo against the current monorepo direction.

## Auth Gap To Resolve

To fully reconnect GitHub and ChatGPT/Codex:

1. Reauthenticate local GitHub CLI with `gh auth login`.
2. Reauthenticate the GitHub connector inside Codex/ChatGPT so plugin calls stop returning `token_expired`.
3. After both are restored, use the draft PR and repository comments as the shared coordination surface instead of relying on chat memory alone.

## Next Stage Readiness

Phase 1 MVP is present on the integration branch, and the repository is ready for the next delivery stage:

- Phase 2 messaging hardening is already in place
- Clerk verification now protects inbox/message routes in NestJS
- the next step is e2e coverage against Docker PostgreSQL and richer support/school role flows
