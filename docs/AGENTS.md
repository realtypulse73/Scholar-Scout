# ScholarScout AGENTS

This file is the operating contract for the ScholarScout repository.

## Repository Shape

The canonical Phase 1 MVP structure is:

- `apps/web`: Next.js student-facing application
- `apps/api`: NestJS API
- `infra/db`: Prisma schema, migrations, and seed data
- `docs`: architecture, roadmap, API notes, and delivery guidance

Other directories may exist for future phases, but Phase 1 work should keep these four paths healthy first.

## Phase 1 MVP Requirements

Phase 1 is complete when the repository provides:

- Clerk-based user authentication in `apps/web`
- Student profile creation and editing
- Program data model and listing API
- Matching endpoint using GPA fit, program match, and location preference
- Dashboard and match results pages
- Local PostgreSQL via Docker
- Prisma migrations and seed data that let a fresh clone boot the MVP

## Integration Contract

- The web app is the user-facing entry point.
- The API is the only backend integration surface for the web app.
- Prisma is the source of truth for backend persistence.
- Seeded programs must be sufficient to exercise the match flow locally.

## Delivery Standard

Before committing Phase 1 work:

- pull latest code
- keep `apps/web`, `apps/api`, `infra/db`, and `docs` aligned
- ensure the web app talks to the API instead of using local-only placeholders
- ensure Prisma client generation, migrations, seed, API tests, and builds succeed

## Operating Loop

ScholarScout development should follow this repeating loop:

1. ChatGPT defines the feature, requirement, or architecture direction.
2. `docs/AGENTS.md` is updated in GitHub to reflect the current contract.
3. Codex reads the repository state and builds the required code.
4. Codex commits implementation updates back to GitHub.
5. GitHub becomes the source of truth for the latest agreed state.
6. Repeat from the next feature or architecture update.

When there is tension between chat context and repository state, prefer the latest committed GitHub state unless a newer architecture instruction has been deliberately written back into `docs/AGENTS.md`.

## Current Notes

- `docs/alignment.md` records the current GitHub and local branch relationship.
- `docs/phase-2-hardening.md` documents the current Phase 2 messaging hardening pass.
- Clerk JWT verification in NestJS is still a future improvement; the current MVP uses a lightweight header-based development guard for protected inbox flows.
