# Phase 3: Administrative and Data Operations Correctness - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Restore trustworthy staff-facing data operations: expose only implemented and authorized capabilities, surface storage read failures without an empty-data fallback, and make backup, import, and restore workflows validated, bounded, recoverable, and auditable. Concurrent-write protection and bounded domain persistence remain Phase 4 work.

</domain>

<decisions>
## Implementation Decisions

### Admin operation visibility
- **D-01:** The admin UI is capability-driven. Show an operation only when the authorized server capability reports that it is available and healthy.
- **D-02:** The capability response states availability, allowed action, a safe reason, and whether retry is appropriate. The client does not maintain an independent operation list.
- **D-03:** If a capability becomes unavailable after load, keep its last-known state visible, show a safe inline error and Retry action, and never claim success.
- **D-04:** Load capabilities initially and refresh only through an explicit staff refresh or retry action; do not add background polling.

### Restore safeguards
- **D-05:** Every restore requires a server-enforced impact preview, a non-empty operator reason, and typed confirmation before any write.
- **D-06:** Preview counts and category deltas only. Do not expose student records, samples, or sensitive snapshot contents.
- **D-07:** Final confirmation uses a short-lived server-issued restore plan bound to the exact validated source and current persisted-data version.
- **D-08:** Phase 3 restores are all-or-nothing. Do not support category-selective or record-level mixing.
- **D-09:** A completed restore creates a pre-restore backup and an immutable, privacy-minimal audit event.

### Storage failure recovery
- **D-10:** A storage read failure produces an explicit unavailable state, disables every data-changing operation, and never substitutes an editable empty dataset.
- **D-11:** Retry must complete a fresh server read and validation. Keep the admin interface locked until that succeeds, then replace the error state with current data.
- **D-12:** Staff see a non-sensitive failure category and correlation or incident ID. Backend and provider details stay out of the UI.
- **D-13:** While storage is unhealthy, mutation requests fail closed before writing, return a structured retryable service-unavailable response, and record minimal operational evidence. Do not queue writes or fall back to process-local storage.

### Backup and import policy
- **D-14:** An accepted package is a bounded, versioned, signed envelope containing creation time, source metadata, a content digest, and completely validated structure. Do not trust filenames or client metadata.
- **D-15:** Retain the newest 10 backups for at most 30 days. Preserve a backup beyond those limits while it is referenced by an unresolved restore incident.
- **D-16:** Import validation never mutates data. It creates a short-lived server-issued plan; applying that plan uses the restore preview, reason, typed-confirmation, version-check, and pre-change-backup safeguards.
- **D-17:** Lifecycle audit evidence includes actor ID, action, package or backup ID, schema version, digest, timestamps, outcome, safe reason category, incident ID, and retention or deletion event. Never copy snapshot contents or student data into audit records.

### the agent's Discretion
- Exact safe error-category names and incident-ID presentation, provided they remain non-sensitive and stable enough for support.
- Exact wording and visual treatment of inline unavailable, retry, preview, and confirmation states, while preserving the locked behavior above.
- Exact plan expiry duration and package-size ceiling, to be selected during research and planning from existing platform constraints.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and acceptance
- `.planning/ROADMAP.md` — Phase 3 goal, dependency, success criteria, and boundary with Phase 4.
- `.planning/REQUIREMENTS.md` — OPS-02, OPS-03, and DATA-03 requirements and milestone definition of done.
- `.planning/PROJECT.md` — incremental data-safety constraint and prohibition on risking production data.

### Architecture and operational risk
- `.planning/codebase/ARCHITECTURE.md` — server/client boundary, whole-document persistence port, and administrative integration points.
- `.planning/codebase/CONCERNS.md` — storage read-reset risk and fragility of snapshot import and restore.
- `docs/http-data-adapter-runbook.md` — supported HTTP adapter contract and operational expectations.
- `docs/vercel-blob-data-adapter.md` — Blob-backed persistence configuration and recovery context.

### Current implementation contracts
- `apps/web/components/admin/ProgrammeAdminManager.tsx` — current admin status, backup, validation, preview, and restore UI flows.
- `apps/web/lib/server/data-store.ts` — storage adapters, whole-document normalization, status, backup, import, and restore operations.
- `apps/web/app/api/admin/data/status/route.ts` — current authorized data-status route.
- `apps/web/app/api/admin/data/backups/route.ts` — current authorized backup-list route.
- `apps/web/app/api/admin/data/backups/[id]/plan/route.ts` — current backup restore-preview route.
- `apps/web/app/api/admin/data/backups/[id]/restore/route.ts` — current backup restore route.
- `apps/web/app/api/admin/data/import/validate/route.ts` — current non-mutating import validation route.
- `apps/web/app/api/admin/data/import/restore/route.ts` — current import apply route.
- `apps/web/__tests__/api/admin-data-routes.test.ts` — current administrative route contract coverage.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProgrammeAdminManager`: already owns data-status, backup listing, restore preview, typed confirmation, reason, validation, and result state; Phase 3 can refine this surface rather than introduce a second admin namespace.
- `requireActiveStaff`: established fresh server-side staff authorization boundary used by the admin data routes.
- Data-store status, backup, validation, and restore helpers in `data-store.ts`: existing server seams to harden with capability, health, plan-binding, retention, and failure contracts.
- `admin-data-routes.test.ts`: existing route-level harness for authorization and data-operation contracts.

### Established Patterns
- Privileged routes authorize with `requireActiveStaff` before parsing or accessing storage.
- Expected route failures return structured JSON with explicit status codes; unexpected failures are not disguised as successful empty data.
- Server-only persistence lives under `apps/web/lib/server/`, while the client reaches it only through App Router handlers.
- Phase 2 established minimal authorization audit evidence and safe external error contracts; Phase 3 should preserve those privacy boundaries.

### Integration Points
- Extend the `/api/admin/data/*` route family with one coherent capability and recovery contract rather than client-side endpoint assumptions.
- Ensure every status, backup, plan, import, and restore path distinguishes storage unavailability from a valid empty dataset.
- Bind restore/import plans to validated server state and adapter data version at the `data-store.ts` boundary.
- Apply retention and incident holds where backup metadata is created, listed, and deleted; keep audit metadata separate from snapshot contents.

</code_context>

<specifics>
## Specific Ideas

- Staff should see counts and category deltas in previews, never record samples.
- Recovery is deliberately manual: initial load plus explicit Refresh/Retry, with no polling.
- A restore incident creates a retention hold so its recovery backup is not pruned while the incident remains unresolved.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-administrative-and-data-operations-correctness*
*Context gathered: 2026-08-25*
