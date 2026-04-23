# Codex Monorepo Scaffold Sync

This branch is the coordination point for the Codex-generated ScholarScout monorepo scaffold.

## Current GitHub State

The `main` branch currently contains the earlier single Next.js onboarding prototype.

Recent known commits:

- `a5dfab1`: Next.js security upgrade to `15.5.15`
- `f0c8c78`: ScholarScout branding metadata update
- `34e907f`: mobile-first onboarding wizard

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

A project-local Node/npm toolchain was created under `.tools/` because system Node/npm were unavailable.

Completed checks:

- `npm install`: completed
- `npm run prisma:generate`: completed
- `npm run build:api`: completed
- `npm run build:web`: completed
- `npm run build:admin`: completed

Known blocker:

- Docker Desktop could not be completed from the Codex shell because the shell is not running as Administrator. Docker Desktop installation requires an elevated Windows session.

## Why This PR Exists

This draft PR exists to keep GitHub, Codex, and ChatGPT aligned before replacing or restructuring the existing app. The full monorepo scaffold should be pushed to this branch from a local environment with `git` available, then reviewed here before merging into `main`.

## Next Sync Step

From a local machine with Git installed:

```powershell
cd "C:\Users\spdav\Documents\New project\scholarscout"
git init
git remote add origin https://github.com/realtypulse73/Scholar-Scout.git
git fetch origin
git checkout -B codex/monorepo-scaffold origin/codex/monorepo-scaffold
# copy or move the monorepo files into the repo root as intended
git add -A
git commit -m "feat: scaffold ScholarScout monorepo"
git push -u origin codex/monorepo-scaffold
```

After that push, this draft PR will show the full file-by-file monorepo diff.
