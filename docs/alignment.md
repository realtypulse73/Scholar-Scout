# ScholarScout Alignment

This document links the current state of the ScholarScout work across Codex/local files, GitHub, and the planned draft PR.

## GitHub Repository

- Repository: https://github.com/realtypulse73/Scholar-Scout
- Default branch: `main`
- Draft PR: https://github.com/realtypulse73/Scholar-Scout/pull/2
- Tracking issues:
  - https://github.com/realtypulse73/Scholar-Scout/issues/3
  - https://github.com/realtypulse73/Scholar-Scout/issues/4
  - https://github.com/realtypulse73/Scholar-Scout/issues/5
- Current remote shape: single Next.js app with onboarding wizard work.
- Existing remote branches:
  - `main`
  - `copilot/build-mobile-first-onboarding-wizard`
- Recent remote commits:
  - `a5dfab1`: Next.js security upgrade to `15.5.15`
  - `f0c8c78`: ScholarScout branding metadata update
  - `34e907f`: mobile-first onboarding wizard

## Codex Local Scaffold

The current Codex workspace contains a proposed monorepo direction under `scholarscout/`.

Key local files:

- `package.json`: monorepo scripts and Docker/Postgres helpers.
- `docker-compose.yml`: local PostgreSQL container.
- `apps/api`: NestJS API with Prisma, matching, users, profiles, programs, notifications, and realtime gateway.
- `apps/web`: Next.js frontend with Clerk auth, profile UI, match results, inbox, and dashboard.
- `apps/admin`: initial school analytics dashboard shell.
- `infra/db/schema.prisma`: PostgreSQL schema for User, StudentProfile, Program, Match, Notification, Conversation, and Message.
- `services/*`: foundations for messaging, billing, ML, simulation, and governance.
- `docs/architecture.md`: platform architecture.
- `docs/api-spec.md`: API contract.
- `docs/roadmap.md`: phased roadmap.

## Publish Plan

The safe GitHub publishing plan is:

1. Create branch `codex/monorepo-scaffold` from `main`.
2. Push the local monorepo scaffold to that branch.
3. Open a draft PR into `main`.
4. Use the draft PR to compare the existing single-app Next.js repo with the proposed monorepo architecture before merging anything.

## Current Tooling Status

- Local `git` is not available in this shell.
- Local project-scoped `git` is available through `.tools`.
- Local project-scoped `gh` is available through `.tools`, but is not authenticated yet.
- Docker is not available in this shell.
- Node/npm are available through `.tools`.
- GitHub connector access is available for `realtypulse73/Scholar-Scout`.

Updated toolchain status:

- `npm install` completed.
- `npm run prisma:generate` completed.
- `npm run build:api` completed.
- `npm run build:web` completed.
- `npm run build:admin` completed.

## Alignment Note

Until the draft PR is opened, GitHub `main` remains the source of truth for the existing production repo, while this Codex workspace is the source of truth for the proposed monorepo scaffold.

## Next Stage Readiness

The local scaffold has been adjusted so the next logical stage is Phase 2 messaging:

- notifications are now persisted in Prisma
- conversations and messages are now persisted in Prisma
- realtime delivery remains available through the NestJS WebSocket gateway
- the inbox UI consumes notification and conversation API data, listens for live events, sends support messages, and marks items read
- seeded programs give the matching endpoint useful development data
