# Phase 2 Hardening

This pass turns the Phase 2 messaging scaffold into a safer development target before adding richer support and school workflows.

## Completed

- Added a temporary `x-user-id` API guard for inbox, messages, and notification read-status routes.
- Wired the Next.js dashboard and inbox API client to send the Clerk-synced backend user ID on protected requests.
- Enforced ownership checks for conversation creation, message sending, message read updates, notification reads, and inbox reads.
- Added Jest coverage for messaging authorization, notification authorization, realtime emits, and the matching score pipeline.
- Added GitHub Actions CI for dependency install, Prisma client generation, API tests, and app builds.

## Current Auth Boundary

The backend guard is intentionally lightweight for local MVP development. It confirms that protected routes receive an `x-user-id` header and that the requested or mutated resource belongs to that user.

Before production, replace this shim with Clerk JWT verification at the NestJS boundary so the API verifies signed session claims instead of trusting a client-provided header.

## Next Logical Stage

- Add real support and school account roles instead of the temporary `support` participant ID.
- Add e2e tests against a Docker PostgreSQL database.
- Add Clerk JWT middleware/guard in the NestJS API.
- Expand notification events for applications, acceptances, and enrollment outcomes.
- Add GitHub CI database service once migrations become part of the automated pipeline.
