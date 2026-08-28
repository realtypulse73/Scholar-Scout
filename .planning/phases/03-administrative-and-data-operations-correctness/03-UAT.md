---
status: testing
phase: 03-administrative-and-data-operations-correctness
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md]
started: 2026-08-28T21:40:00-04:00
updated: 2026-08-28T22:46:00-04:00
---

## Current Test

number: 8
name: Authorized Backup List and Count-Only Preview
expected: |
  Data operations lists available backups newest first. Selecting Preview shows only counts and safe identifiers, never student or snapshot contents.
awaiting: authorization for a disposable Preview-only recovery fixture and apply/restore cycle

## Tests

### 1. Cold Start and Admin Page Smoke Test
expected: The preview starts cleanly, sign-in loads, and an authorized staff user can open programme administration and see Data operations without an error screen.
result: pass
source: manual
evidence: The deployed Preview showed the disabled Continue with Apple control and its unavailable explanation; after authorized local account creation, /admin/programmes visibly rendered Data operations with no non-empty error alert.

### 2. Fresh Authorized Capabilities
expected: Authorized capability requests use fresh verified counts and server-owned operation availability.
result: pass
source: automated
coverage_id: 03-01-D1

### 3. Safe Storage Outage
expected: A storage outage produces a safe retryable unavailable result and privacy-minimal evidence rather than empty editable data.
result: pass
source: automated
coverage_id: 03-01-D2

### 4. Verified Absence Only
expected: JSON, HTTP, and Blob adapters treat data as empty only when absence is verified and reject invalid or failed reads.
result: pass
source: automated
coverage_id: 03-01-D3

### 5. Signed Bound Recovery Plans
expected: Recovery envelopes are signed and plans are bound to the staff actor and current stored state while exposing counts only.
result: pass
source: automated
coverage_id: 03-02-D1

### 6. Idempotent Recovery Apply
expected: Recovery apply performs one protected write, creates a pre-change backup, supports safe retry, and records privacy-minimal audit evidence.
result: pass
source: automated
coverage_id: 03-02-D2

### 7. Bounded Retention and Hold Release
expected: Backup retention is bounded and an incident hold can be released only through a freshly authorized operator route.
result: pass
source: automated
coverage_id: 03-02-D3

### 8. Authorized Backup List and Count-Only Preview
expected: Data operations lists available backups newest first. Selecting Preview shows only counts and safe identifiers, never student or snapshot contents.
result: blocked
source: manual
evidence: The authenticated Preview rendered Recovery backup history safely and reported 0 saved backups. With no backup available, ordering and count-only preview cannot be exercised without first creating a data-changing recovery fixture.

### 9. Exact Restore Confirmation
expected: After a valid preview, the reason and exact confirmation controls appear. Apply stays disabled until the required phrase is entered and reports a clear complete or unchanged result.
result: blocked
source: manual
evidence: No recovery backup exists in Preview, so a valid restore preview and its confirmation gate cannot be reached without an authorized data-changing fixture/apply cycle.

### 10. Signed Import Validation
expected: Import validation is visibly non-mutating. A valid signed package produces a count-only preview; an invalid or oversized package produces a safe error without enabling Apply.
result: blocked
source: manual
evidence: The live UI clearly labels validation as non-mutating and exposes a bounded 5 MiB signed-package input, but no approved signed Preview fixture is available to exercise valid and invalid package outcomes.

### 11. Capability Failure and Retry
expected: If a refresh fails, the page labels previous counts as last verified, shows Retry and a safe incident identifier, focuses the alert, and disables every data-changing action until a fresh read succeeds.
result: blocked
source: manual
evidence: The live Preview storage check is healthy. Inducing a provider failure would require an explicit Preview configuration/outage exercise and is not safe to perform implicitly against the shared deployment.

### 12. Responsive and Accessible Recovery UI
expected: At phone, tablet, and desktop widths, long identifiers wrap or scroll inside their own region; keyboard focus remains visible; alerts and results are announced once with operation-specific text.
result: pass
source: manual
evidence: The authenticated live Preview was checked at 320x700, 768x900, and 1280x900. Data operations remained visible with no document-level horizontal overflow at every width, and the recovery refresh control showed a high-contrast keyboard focus ring. The current empty-history state exposed no long identifier or operation result to duplicate.

### 13. Operator Recovery Guidance
expected: The HTTP and Vercel Blob runbooks clearly distinguish implemented one-write recovery behavior from deferred Phase 4 transaction, compare-and-set, and crash-atomicity guarantees.
result: pass
source: manual
evidence: Both operator runbooks state that approved recovery performs one application-port document write and explicitly defer transactions, compare-and-set/concurrent-write protection, and crash atomicity to Phase 4.

## Summary

total: 13
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 4

## Gaps

- truth: "After an authorized staff sign-in, programme administration loads without an error and shows Data operations."
  status: resolved
  reason: "Root cause was a missing Preview staff allowlist. The variable was added to Preview, a fresh branch deployment completed, and an authorized local staff session rendered Data operations without an error."
  severity: major
  test: 1
  root_cause: "The Vercel Preview environment did not define SCHOLARSCOUT_STAFF_EMAILS, so active-staff authorization correctly failed closed."
  artifacts: []
  missing: []
  debug_session: ".planning/debug/resolved/staff-admin-data-ops-missing.md"

## Coverage Notes

- `03-05-SUMMARY.md` and `03-06-SUMMARY.md` contain malformed structured coverage entries without required IDs/descriptions and with unsupported verification-kind labels. Their deliverables were retained as human checkpoints rather than dropped.
- The canonical phase `03-VERIFICATION.md` is currently missing. UAT may proceed, but Phase 3 cannot transition until canonical goal verification passes.
