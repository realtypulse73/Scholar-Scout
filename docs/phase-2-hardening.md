# Phase 2 Hardening

This pass turns the Phase 2 messaging scaffold into a safer development target before adding richer support and school workflows.

## Completed

- Added Clerk bearer-token verification for inbox, messages, and notification read-status routes.
- Wired the Next.js dashboard and inbox API client to send Clerk session tokens on protected requests.
- Enforced ownership checks for conversation creation, message sending, message read updates, notification reads, and inbox reads.
- Added Jest coverage for messaging authorization, notification authorization, realtime emits, and the matching score pipeline.
- Added GitHub Actions CI for dependency install, Prisma client generation, API tests, and app builds.

## Current Auth Boundary

The backend now verifies Clerk bearer tokens at the NestJS boundary and resolves the current user from the verified token payload.

For stable local and production verification, set:

- `CLERK_SECRET_KEY`
- `CLERK_AUTHORIZED_PARTIES`
- optionally `CLERK_JWT_KEY` when you want offline/local JWT verification without a network fetch

## Next Logical Stage

- Add real support and school account roles instead of the temporary `support` participant ID.
- Add e2e tests against a Docker PostgreSQL database.
- Expand protected API coverage beyond inbox flows where appropriate.
- Expand notification events for applications, acceptances, and enrollment outcomes.
- Add GitHub CI database service once migrations become part of the automated pipeline.
