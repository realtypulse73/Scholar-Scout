---
phase: 04-incremental-durable-persistence-boundaries
created: 2026-08-28
source: roadmap-defined
status: ready-for-research-and-planning
---

# Phase 4: Incremental Durable Persistence Boundaries — Context

<domain>
## Phase Boundary

Phase 4 makes Scholar Scout's existing persistence conflict-safe incrementally. It introduces explicit atomic or version-conflict outcomes and bounded domain operations for student, programme, and operational records while retaining the supported JSON, HTTP, and Vercel Blob adapters and the Phase 3 recovery workflows.

This phase does not replace the application stack, perform a wholesale datastore migration, add new product capabilities, or change production without separate authorization.
</domain>

<decisions>
## Locked Decisions

### Roadmap-defined outcome
- A stale student or staff change must preserve current data and return an explicit conflict or retry result; silent last-writer-wins loss is not acceptable.
- Student, programme, and operational records must be accessible through bounded domain operations rather than requiring an unbounded shared-document replacement for every event.
- Migration must proceed one high-risk persistence boundary at a time, with compatibility and adapter-level verification at each step.

### Compatibility and safety
- Retain Next.js 15, React 18, TypeScript, NextAuth, Vercel, and the current port-and-adapter foundation.
- Preserve JSON, HTTP, and Vercel Blob support during incremental migration.
- Preserve Phase 3 signed backup, restore, import, retention, and audit behavior throughout the change.
- Keep production data and production deployment out of Phase 4 implementation unless separately authorized.
- Use a tracer-first plan: establish the versioned bounded persistence contract and prove one end-to-end migrated boundary before expanding the same pattern across the remaining roadmap domains.

### Existing foundation to reuse
- Programme records already carry revisions and expose explicit stale-edit conflict behavior at the application boundary; Phase 4 must strengthen this into an adapter/provider-level concurrency guarantee rather than discard it.
- Phase 3 already binds recovery plans to current-state digests and documents provider transaction/CAS guarantees as Phase 4 work.
- Existing server-only persistence modules and route authorization/validation boundaries remain the integration seams.

### Agent discretion for research and planning
- Select the first tracer boundary using repository evidence about write frequency, data-loss impact, and the smallest safe adapter-spanning proof—not a new product-priority decision from the user.
- Choose the exact version-token/CAS representation and compatibility interface after comparing the three supported adapters.
- Split later expansion plans according to domain coupling and testability while ensuring all three roadmap domains are covered before phase verification.
</decisions>

<code_context>
## Existing Code Context

- `apps/web/lib/server/data-store.ts` defines the shared `ScholarScoutDataStore` port, all three adapters, full-document read/write helpers, programme revision checks, and recovery integration.
- `apps/web/lib/server/platform-store.ts` contains multiple read-modify-write paths that currently finish with `writeScholarScoutData(data)` and therefore need bounded operations or conflict detection.
- `apps/web/app/api/admin/programmes/route.ts` and `ProgrammeRevisionConflictError` provide the existing explicit programme conflict contract to preserve and strengthen.
- `apps/web/lib/server/data-recovery.ts` provides current-state digest binding, one-write apply, retention, and audit semantics that must remain safe.
- `services/http-data-service/src/server.mjs` currently exposes the whole-document HTTP contract; Phase 4 research must define an incremental compatible bounded/CAS extension.
- `docs/http-data-adapter-runbook.md` and `docs/vercel-blob-data-adapter.md` explicitly identify transactions, compare-and-set, crash atomicity, and concurrent-write protection as Phase 4 limitations.
</code_context>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — authoritative Phase 4 goal, success criteria, dependency, and risk.
- `.planning/REQUIREMENTS.md` — locked DATA-01 and DATA-02 requirements and milestone definition of done.
- `.planning/PROJECT.md` — incremental migration, data-safety, delivery, and stack constraints.
- `.planning/phases/03-administrative-and-data-operations-correctness/03-VERIFICATION.md` — passed predecessor gate and explicit Phase 4 deferred boundary.
- `.planning/phases/03-administrative-and-data-operations-correctness/03-CONTEXT.md` — recovery behaviors that Phase 4 must preserve.
- `docs/http-data-adapter-runbook.md` — current HTTP boundary and explicit Phase 4 limitations.
- `docs/vercel-blob-data-adapter.md` — current Blob boundary and explicit Phase 4 limitations.
- `PROJECT-INDEX.md` — canonical project document routing.
</canonical_refs>

<deferred>
## Out of Scope / Deferred

- Wholesale application or datastore rewrite.
- Separate analytics storage and background jobs (`DATA-04`, `DATA-05`, v2).
- Phase 5 school/community/WNY product work.
- Production migration or deployment without separate authorization.
</deferred>

