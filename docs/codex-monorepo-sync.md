# Codex Monorepo Scaffold Sync

This branch is the coordination point for the Codex-generated ScholarScout monorepo scaffold.

## Current GitHub State

The `main` branch currently contains the earlier single Next.js onboarding prototype.

## Current Codex Local State

The newer scaffold exists locally in the Codex workspace at:

`C:\Users\spdav\Documents\New project\scholarscout`

It includes:

- monorepo workspace setup
- `apps/web`: Next.js student frontend with Clerk auth, profile, matches, inbox, and dashboard UI
- `apps/api`: NestJS API with Prisma, users, student profiles, programs, matching, notifications, conversations, messages, and WebSockets
- `apps/admin`: internal dashboard shell
- `infra/db`: Prisma schema, seed script, and local PostgreSQL docs
- `docker-compose.yml`: local PostgreSQL service
- `services/*`: foundations for messaging, billing, ML, simulation, and governance
- `docs/alignment.md`: local alignment record across ChatGPT, Codex, and GitHub

## Validation Completed Locally

Using project-local tooling under `.tools/`:

- `npm install` completed
- `npm run prisma:generate` completed
- `npm run build:api` completed
- `npm run build:web` completed
- `npm run build:admin` completed

Known blocker:

- Docker Desktop could not be completed from the Codex shell because the shell is not running as Administrator. Docker Desktop requires an elevated Windows session.

## Why This PR Exists

This draft PR lets us compare the existing single-app Next.js repo with the proposed monorepo architecture before merging anything into `main`.

