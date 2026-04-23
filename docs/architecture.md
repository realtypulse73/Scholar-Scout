# ScholarScout Architecture

ScholarScout is organized as a monorepo with clear boundaries between product surfaces, platform services, shared packages, and infrastructure.

## Current MVP Focus

Phase 1 centers on the `apps/api` NestJS backend and `apps/web` Next.js frontend, backed by PostgreSQL through Prisma and Clerk for authentication. The MVP exposes a matching workflow that links a student's academic profile to eligible scholarship programs.

## Planned Expansion

- `apps/web`: student-facing Next.js experience.
- `apps/admin`: internal operations, support, and school analytics dashboards.
- `services/matching`: dedicated scoring engine once matching logic outgrows the API module.
- `services/ml`: feature store, uplift models, acceptance prediction, bandit routing, causal inference, and recommendation scoring APIs.
- `services/messaging`: chat, alerts, and lifecycle notifications. Phase 2 is also wired through the API's realtime gateway for MVP delivery.
- `services/simulation`: policy, planning, and market scenario modeling.
- `services/governance`: audit trails, compliance, and review workflows.
- `services/billing`: subscriptions, payouts, and Stripe integrations.
- AI chat assistant and workflow automation are expected to sit on top of the API, messaging, ML, and queue layers.
- `packages/*`: shared UI, types, and utilities for consistency across apps.
- `infra/db`: Prisma schema, local Docker-backed PostgreSQL setup, and future migrations.
- `infra/queue`: BullMQ jobs for async workflows.
- `infra/config`: shared environment and deployment configuration.
