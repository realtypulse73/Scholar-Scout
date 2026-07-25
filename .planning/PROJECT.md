# Scholar Scout

## What This Is

Scholar Scout is a web application that helps students explore higher-education pathways, compare programmes, understand fit, and make more informed next-step decisions. It combines a programme catalogue, personalised onboarding and recommendations, simulations, community-oriented features, and optional advisor guidance.

## Core Value

Students can confidently discover and act on the education pathways that fit their goals and circumstances.

## Business Context

- **Customer**: Students exploring college, career, and programme options; staff curate programme information.
- **Success metric**: Students can complete a trustworthy pathway-discovery journey without exposing their information or losing progress.
- **Strategy notes**: Improve the existing application safely before expanding its feature surface.

## Requirements

### Validated

- ✓ Programme discovery, filtering, and profile-informed ranking — existing
- ✓ Account onboarding and saved shortlist capabilities — existing
- ✓ Interactive simulations, engagement signals, and recommendation support — existing
- ✓ Staff-managed programme catalogue foundation — existing

### Active

- [ ] Protect user data and cost-bearing integrations with consistent authentication, authorization, validation, and abuse controls.
- [ ] Restore reliable administration, CI, and test signals so changes can be released safely.
- [ ] Complete and validate the in-progress school, peer-community, campus-community, and Western New York product work.
- [ ] Establish an incremental path from whole-document persistence to durable, safe multi-user data operations.

### Out of Scope

- Wholesale replacement of the application stack — preserve delivery momentum and migrate high-risk boundaries incrementally.
- Broad new product expansion before the current security, reliability, and in-progress feature work is validated — safety and operational confidence come first.

## Context

The application is a Next.js monolith deployed to Vercel, with NextAuth, a programme catalogue, personalised discovery, simulations, and optional OpenAI advisor guidance. Its server state currently uses a pluggable JSON/HTTP/Vercel Blob whole-document store; this makes concurrent writes, targeted data operations, and growth fragile. The codebase map at `.planning/codebase/` identifies exposed unauthenticated routes, a webhook runner that fails open without a signature secret, missing admin data-operation routes, an unrelated failing CI job, and weak route/E2E coverage.

There is a substantial uncommitted feature cluster in the working tree, including school, peer-community, campus-community, and Western New York work. It must remain isolated from stabilization work until it has an explicit validation and release path.

## Constraints

- **Tech stack**: Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation — avoid unnecessary platform churn.
- **Data safety**: Do not risk production data while replacing whole-document persistence — use incremental, tested migration boundaries.
- **Delivery**: Preserve and validate the existing in-progress feature work — do not overwrite or silently absorb it into unrelated changes.
- **Operations**: CI must become a reliable quality gate before it is used for release decisions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize security and reliability before broader feature expansion | Public data exposure, anonymous AI spend, broken administrative paths, and failing CI are release blockers | — Pending |
| Treat the current uncommitted feature cluster as a separately validated release slice | It has broad scope and should not be obscured by stabilization work | — Pending |
| Modernize persistence incrementally | A wholesale rewrite would create unacceptable delivery and data-migration risk | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-25 after initialization*
