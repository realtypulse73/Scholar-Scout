---
phase: 03-administrative-and-data-operations-correctness
audited: 2026-08-28
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
threats_total: 20
threats_closed: 20
threats_open: 0
highest_open_severity: none
verdict: SECURED
---

# Phase 3 Security Audit

## Verdict

**SECURED** — all 20 plan-authored threats are closed. No threat at or above the configured high-severity block threshold remains open, and the six plan summaries contain no unregistered `Threat Flags` entries.

## Threat Verification

| Threat | Category | Severity | Disposition | Verification evidence |
|---|---|---|---|---|
| T-03-01 | Tampering / DoS | high | mitigate | JSON, HTTP, and Blob reads distinguish verified absence from invalid or unavailable data; complete import validation precedes use. |
| T-03-02 | Elevation | high | mitigate | The capability handler invokes `requireActiveStaff` before recovery or storage access. |
| T-03-03 | Information disclosure | medium | mitigate | Failures expose only a safe category, generated incident ID, and privacy-minimal evidence. |
| T-03-04 | Tampering | high | mitigate | Recovery envelopes use exact structure, digest, HMAC signature, and timing-safe verification. |
| T-03-05 | Spoofing / Elevation | high | mitigate | Tokens bind actor, source, current-data digest, expiry, and replay/outcome state. |
| T-03-06 | Information disclosure | high | mitigate | Preview exposes count deltas only; lifecycle evidence excludes snapshot contents. |
| T-03-07 | DoS | medium | mitigate | A five-MiB byte ceiling and bounded structural depth are enforced. |
| T-03-08 | Elevation | high | mitigate | Backup list, planning, restore, and hold-release routes authorize staff before parsing or storage access. |
| T-03-09 | Tampering | high | mitigate | Restore accepts only the signed plan token, reason, and exact confirmation; the service verifies token authority. |
| T-03-10 | Information disclosure | high | mitigate | Backup preview returns only counts and safe identifiers; route tests assert provider-detail redaction. |
| T-03-10A | Elevation / Tampering | high | mitigate | Hold release requires staff authorization, exact bounded input, active-hold matching, and one audited write. |
| T-03-11 | Tampering / DoS | high | mitigate | Import validation enforces byte limits plus exact signed-envelope and schema checks. |
| T-03-12 | Elevation | high | mitigate | Import routes authorize staff before input reads; apply uses an actor-bound recovery token. |
| T-03-13 | Spoofing | high | mitigate | Signing uses dedicated current/previous recovery variables and never falls back to `NEXTAUTH_SECRET`. |
| T-03-14 | Elevation | high | mitigate | The UI renders server-advertised operations only, while every server route independently reauthorizes. |
| T-03-15 | Information disclosure | high | mitigate | The UI renders count-only previews and safe identifiers/digests, never snapshot or student records. |
| T-03-16 | Repudiation | medium | mitigate | UI states distinguish last-known/unavailable data, clear stale errors, and announce operation-specific results. |
| T-03-17 | Tampering | high | mitigate | The HTTP fixture returns `404` only for `ENOENT`; malformed or provider reads fail closed. |
| T-03-18 | Repudiation | medium | mitigate | Test, typecheck, lint, build, and approved manual-checkpoint evidence is recorded in `03-VALIDATION.md`. |
| T-03-SC | Tampering | high | mitigate | Phase 3 made no dependency-manifest or lockfile changes. |

## Evidence Locations

- `apps/web/lib/server/data-store.ts`
- `apps/web/lib/server/data-recovery.ts`
- `apps/web/app/api/admin/data/**/route.ts`
- `apps/web/components/admin/ProgrammeAdminManager.tsx`
- `services/http-data-service/src/server.mjs`
- `services/http-data-service/test/server.test.mjs`
- `03-VALIDATION.md`

## Open Threats

None.

## Accepted Risks

None recorded by this audit.
