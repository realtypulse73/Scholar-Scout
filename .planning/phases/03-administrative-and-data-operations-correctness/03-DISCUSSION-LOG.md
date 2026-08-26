# Phase 3: Administrative and Data Operations Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-25
**Phase:** 03-administrative-and-data-operations-correctness
**Areas discussed:** Admin operation visibility, Restore safeguards, Storage failure recovery, Backup/import policy

---

## Admin operation visibility

| Decision | Options considered | User's choice |
|----------|--------------------|---------------|
| Operation visibility | Capability-driven controls; disabled controls with explanations; read-only first | Capability-driven controls |
| Capability loss after load | Inline recovery state; hide immediately; full-page failure | Inline recovery state |
| Server description | Explicit capability contract; HTTP-status only; client-configured list | Explicit capability contract |
| Refresh policy | On load plus explicit refresh/retry; short polling; per-action checks only | On load plus explicit refresh/retry |

**Notes:** Only implemented, authorized, healthy operations appear. A later failure remains visible with a safe error and Retry action.

---

## Restore safeguards

| Decision | Options considered | User's choice |
|----------|--------------------|---------------|
| Preconditions | Server preview, reason, typed confirmation; preview and checkbox; reason only | Server preview, reason, typed confirmation |
| Preview disclosure | Counts and category deltas; counts plus samples; full snapshot | Counts and category deltas |
| Recovery evidence | Pre-restore backup plus immutable audit; audit only; backup only | Pre-restore backup plus immutable audit |
| Confirmation binding | Short-lived server plan; any prior preview; client-held preview | Short-lived server plan |
| Restore scope | All-or-nothing; category-selective; record-level | All-or-nothing |

**Notes:** The plan is bound to the exact validated source and current data version. Student records and sensitive snapshot contents do not appear in previews.

---

## Storage failure recovery

| Decision | Options considered | User's choice |
|----------|--------------------|---------------|
| Read-failure UI | Explicit unavailable state; last-known snapshot; full-page lockout | Explicit unavailable state |
| Retry semantics | Fresh successful read; restore browser copy; limited writes | Fresh successful read |
| Staff-visible details | Safe category plus incident ID; generic only; backend details | Safe category plus incident ID |
| Mutations during outage | Fail closed with retry guidance; queue; temporary local storage | Fail closed with retry guidance |

**Notes:** No empty-data substitute is editable. The interface remains locked until a fresh read validates; server mutations fail before writing and retain minimal operational evidence.

---

## Backup/import policy

| Decision | Options considered | User's choice |
|----------|--------------------|---------------|
| Package contract | Versioned signed envelope; versioned JSON snapshot; any valid JSON | Versioned signed envelope |
| Retention | Time-and-count limit; time only; count only | Newest 10 for up to 30 days, with unresolved-incident holds |
| Post-validation behavior | Stage for explicit apply; apply immediately; store indefinitely | Stage for explicit apply |
| Audit evidence | Minimal lifecycle audit; outcome only; detailed/content-bearing audit | Minimal lifecycle audit |

**Notes:** Validation is non-mutating. Applying an import uses restore-grade safeguards. Audit records contain identifiers, digest, safe outcomes, and lifecycle events but no snapshot contents or student data.

## the agent's Discretion

- Safe error-category vocabulary and incident-ID presentation.
- Exact UI copy and styling within the locked recovery behavior.
- Restore-plan expiry and package-size limits, guided by research and current platform constraints.

## Deferred Ideas

None.
