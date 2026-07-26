# ADR 0001: Upgrade Scholar Scout to Node 24 LTS

Status: Accepted

Date: 2026-07-25

Owner: Scholar Scout release maintainer

Decision deadline: before the next long-lived release policy approval

## Context

Phase 1 keeps Node 20 only as a bounded compatibility baseline while the
Corepack-selected pnpm workspace, CI checks, and Vercel deployment path are
stabilized. It is not a long-lived runtime-support commitment. The official
[Node.js release schedule](https://nodejs.org/en/about/previous-releases)
identifies Node 24 as an LTS release and Node 20 as end of life.

## Decision

The supported runtime-upgrade target is **Node 24 LTS**. The Scholar Scout
release maintainer is accountable for governing the upgrade and for confirming
the validation evidence before the next long-lived release policy approval.

This ADR records the target and accountability only. It does not change the
current Node 20 compatibility boundary, package manifests, CI runtime,
portable runtime helper, or Vercel configuration.

## Required Governed Upgrade Scope

A separate runtime-upgrade change must update and validate all of these
surfaces together:

- Root and standalone-service `engines` declarations.
- `scripts/use-portable-node.ps1` and its bundled portable Node runtime.
- GitHub Actions runtime setup and Vercel's configured Node runtime.
- The Corepack-selected pnpm 10.34.5 frozen install:
  `pnpm install --frozen-lockfile --ignore-scripts`.
- Web typecheck, lint, Jest tests, and production build.
- HTTP data-service tests and production-tooling tests.

## Validation and Evidence Boundary

The governed upgrade must retain validation evidence for the listed repository
surfaces. GitHub ruleset enforcement, draft-PR execution, Vercel production
parity, and smoke-event evidence remain maintainer-owned external checks; this
ADR does not represent those dashboard or hosted-runtime checks as complete.

## Consequences

Node 20 remains available solely for the documented Phase 1 compatibility
boundary until the governed Node 24 LTS change lands. Future release-policy
approval must use this ADR's owner, target, and validation scope rather than
silently extending the Node 20 baseline.
