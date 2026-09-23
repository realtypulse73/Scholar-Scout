---
phase: 10
slug: curated-import-and-governed-staff-publication
status: draft
nyquist_compliant: true
created: 2026-09-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. This map implements the validation architecture in `10-RESEARCH.md`; all routes, commands, and stored snapshots remain local, reviewed application state rather than live-provider integrations.

---

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | Jest 30.3.0 with `next/jest` |
| **Config file** | `apps/web/jest.config.ts` |
| **Fast pure-contract command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts` |
| **Fast server/API command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/server/catalogue-publications.test.ts __tests__/api/admin-catalogue-publications.test.ts` |
| **Fast component command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CataloguePublicationManager.test.tsx` |
| **Store-compatibility command** | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/data-store.test.ts` |
| **Full quality command** | `corepack pnpm --filter @scholar-scout/web run typecheck; corepack pnpm --filter @scholar-scout/web run lint; corepack pnpm --filter @scholar-scout/web test -- --runInBand` |
| **Target feedback latency** | Under 60 seconds for a targeted in-band Jest command; record a failing command before a production-code repair. |

## Sampling Rate

- **After every task commit:** Run the exact targeted command in the per-task map.
- **After every execution wave:** Run typecheck, lint, and the full web Jest suite.
- **Before phase verification:** Run the full quality command and execute the staff UAT of failed checklist correction, independent review, weekly preview/release, conflict reasoning, emergency correction, restore, audit redaction, and rights fallback.
- **Failure protocol:** Treat a failing rehearsal or test as a repair-planning signal: preserve its safe error detail, identify the responsible contract/server/API/component/store layer, add a focused regression, then repair before unrelated work proceeds.

## Requirement Coverage Map

| Requirement | Observable proof | Primary planned tests/files | Command |
|---|---|---|---|
| **EVID-03** | The server checklist returns exact source, material-evidence, freshness, claim-boundary, regional-boundary, and media-rights correction codes and a safe six-category reviewer summary; its fixed disclosure says pass means editorial completeness, not verified provider truth. Review/release/emergency actions rerun it and edits clear approval. | `__tests__/lib/catalogue-publication.test.ts`; `__tests__/lib/server/catalogue-publications.test.ts`; `__tests__/api/admin-catalogue-publications.test.ts`; `__tests__/components/CataloguePublicationManager.test.tsx` | Fast pure-contract, server/API, and component commands |
| **EVID-04** | The public seam returns only a clone of the deterministic active stored snapshot in stable order, with no candidate/audit data and no provider-network call. | `__tests__/lib/server/catalogue-publications.test.ts`; `__tests__/api/admin-catalogue-publications.test.ts` | Fast server/API command |
| **PUB-01** | Inactive, missing-capability, and wrong-capability actors cannot create, revise, approve, publish, retire, restore, or emergency-correct; allowed actions add concise audit evidence. | `__tests__/api/admin-catalogue-publications.test.ts`; `__tests__/lib/server/catalogue-publications.test.ts`; `__tests__/components/CataloguePublicationManager.test.tsx` | Fast server/API and component commands |
| **PUB-02** | Invalid drafts stay private and correction-ready; final failures quarantine only the invalid candidate while preserving the active snapshot and passing release records. | `__tests__/lib/catalogue-publication.test.ts`; `__tests__/lib/server/catalogue-publications.test.ts`; `__tests__/components/CataloguePublicationManager.test.tsx` | Fast pure-contract, server/API, and component commands |
| **PUB-03** | One-to-25 schema-versioned changes stage privately; 26 or malformed changes do not write; preview has no mutation; weekly/emergency/restore commands use one CAS and return recoverable conflicts. | `__tests__/lib/catalogue-publication.test.ts`; `__tests__/lib/server/catalogue-publications.test.ts`; `__tests__/api/admin-catalogue-publications.test.ts`; `__tests__/lib/data-store.test.ts` | Fast pure-contract, server/API, and store-compatibility commands |

## Decision and Security Coverage Map

| Decision | Required behavior under test | Planned layer and files |
|---|---|---|
| **D-01** | Current active allowlist plus editor/reviewer/administrator capability checks guard every privileged action before body parsing; concise audit carries actor and capability. | API/server: `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` |
| **D-02** | Regular approval rejects self-review; editor-plus-administrator self-approval is permitted only after a passing server checklist. | API/server: `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` |
| **D-03** | The injected-clock checklist checks source, material evidence, freshness, claim wording, regional boundary, and media-rights metadata at stage, approval, release, and emergency time. Reviewer DTO and console render all six safe category statuses and the fixed editorial-completeness/not-provider-truth disclosure. | Pure/server/API/component: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-04** | Failure preserves a private draft and ordered correction list; edit/resubmission invalidates prior approval. | Pure/server/component: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-05** | Individual edits and schema-versioned JSON import stage candidates only; imports neither alter the public read model nor invoke a provider. | Pure/server/API: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts` |
| **D-06** | Exactly one through 25 changes are eligible; a 26th change fails without mutation and release ordering remains bounded. | Pure/server: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` |
| **D-07** | Administrator preview is non-mutating and reports server-derived normal-release eligibility; normal release rechecks current state and builds a deterministic named manifest/snapshot only Monday 09:00 inclusive through 17:00 exclusive in `America/New_York`, once per canonical `YYYY-Www` ISO-week period. Injectable clock/time-zone seams prove boundary, DST/calendar, and duplicate-period behavior; public reads use only active stored data. | Pure/server/API/component: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-08** | A weekly replacement retains the prior snapshot and manifest internally; restore creates a new lineage entry rather than exposing historical learner browsing. | Server/API: `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts` |
| **D-09** | A stale write exposes only safe current/attempted values; an older-value choice requires a bounded reason recorded in the audit. | Server/API/component: `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-10** | Reviewer emergency correction requires capability, reason, fresh checklist, CAS, new `emergency` manifest/audit type, and prior snapshot retention; it is separately authorized and exempt from normal Monday/ISO-week release policy. | Server/API/component: `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-11** | Final record blockers quarantine only the failed candidate with its correction codes; passing candidates release and invalid claims never enter public data under a substitute state. | Pure/server/API: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts` |
| **D-12** | Only documented ownership, licence, provider approval, or approved embed qualifies media; otherwise the published record is factual text plus official sources. | Pure/server: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` |
| **D-13** | Release and emergency paths reevaluate expiry/revocation/uncertainty and remove unusable media immediately. | Pure/server: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` |
| **D-14** | Missing media proof blocks media only, preserving an otherwise valid factual record and official-source fallback. | Pure/server/component: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx` |
| **D-15** | Candidate/snapshot audit history is concise and redacted; learner, secret, token, raw-import, candidate, and provider-private values are absent from history and public DTOs. | API/server/component/store: `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx`, `__tests__/lib/data-store.test.ts` |

### Negative Security and No-Live-Provider Assertions

- API tests must prove denied, inactive, malformed-capability, and missing-capability requests return a safe forbidden result before `request.json()` or store access is invoked.
- Import tests must prove malformed, oversized, deep, duplicate, stale, and 26-change input has no partial write and cannot touch unrelated application state.
- Server/read tests must spy on or replace `global.fetch` and assert `getPublishedCatalogueSnapshot()` makes zero network calls while returning only a clone of the active stored snapshot.
- Source-level regression tests in `__tests__/lib/server/catalogue-publications.test.ts` must reject a provider URL/client or network import/call in the public snapshot read seam; this checks the architecture boundary in addition to runtime behavior.
- DTO tests must assert no secret/configuration, token, raw import, candidate, learner, reviewer-private rights, or provider-private audit field is serialized to staff history or public snapshot readers.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement and decisions | Test layer/files | Automated command | Status |
|---|---:|---:|---|---|---|---|
| 10-01-01 | 01 | 1 | EVID-03, PUB-01, PUB-02; D-01, D-03, D-04 | API route tracer: `__tests__/api/admin-catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/api/admin-catalogue-publications.test.ts` | ⬜ pending |
| 10-01-02 | 01 | 1 | EVID-03, PUB-02; D-03, D-12, D-13, D-14, D-15 | Pure contract and store normalization: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/data-store.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/data-store.test.ts` | ⬜ pending |
| 10-02-01 | 02 | 2 | PUB-01, PUB-02, PUB-03; D-04, D-05, D-06 | Pure parser and CAS staging: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ⬜ pending |
| 10-02-02 | 02 | 2 | EVID-03, PUB-01, PUB-02; D-01, D-02, D-03, D-15 | Independent review, redacted history, and safe six-category reviewer DTO: `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/api/admin-catalogue-publications.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ⬜ pending |
| 10-03-01 | 03 | 3 | EVID-03, PUB-02, PUB-03; D-03, D-06, D-07, D-08, D-11, D-12, D-13, D-14 | Manifest/release lifecycle including fixed-window, ISO-period, and emergency exemption rules: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ⬜ pending |
| 10-03-02 | 03 | 3 | EVID-04, PUB-01, PUB-02, PUB-03; D-07, D-08, D-11, D-15 | Preview/release/history/public seam including server-derived schedule and no-network checks: `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/api/admin-catalogue-publications.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ⬜ pending |
| 10-04-01 | 04 | 4 | PUB-01, PUB-02, PUB-03; D-09, D-10, D-15 | Conflict/emergency/restore commands: `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/server/catalogue-publications.test.ts __tests__/api/admin-catalogue-publications.test.ts` | ⬜ pending |
| 10-04-02 | 04 | 4 | EVID-03, PUB-01, PUB-02; D-02, D-03, D-04, D-09, D-15 | Accessible intake/review/conflict UI including six-category checklist disclosure and safe API feedback: `__tests__/components/CataloguePublicationManager.test.tsx`, `__tests__/api/admin-catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CataloguePublicationManager.test.tsx __tests__/api/admin-catalogue-publications.test.ts` | ⬜ pending |
| 10-05-01 | 05 | 5 | EVID-03, EVID-04, PUB-01, PUB-02, PUB-03; D-07, D-08, D-10, D-11, D-13, D-14, D-15 | Release/recovery/audit console plus fixed-window schedule and emergency-exemption routes/commands: `__tests__/components/CataloguePublicationManager.test.tsx`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/components/CataloguePublicationManager.test.tsx __tests__/api/admin-catalogue-publications.test.ts __tests__/lib/server/catalogue-publications.test.ts` | ⬜ pending |
| 10-05-02 | 05 | 5 | EVID-03, EVID-04, PUB-01, PUB-02, PUB-03; D-01 through D-15 | Full lifecycle, redaction, CAS, no-live-provider, and persistence regression matrix: `__tests__/lib/catalogue-publication.test.ts`, `__tests__/lib/server/catalogue-publications.test.ts`, `__tests__/api/admin-catalogue-publications.test.ts`, `__tests__/components/CataloguePublicationManager.test.tsx`, `__tests__/lib/data-store.test.ts` | `corepack pnpm --filter @scholar-scout/web test -- --runInBand __tests__/lib/catalogue-publication.test.ts __tests__/lib/server/catalogue-publications.test.ts __tests__/api/admin-catalogue-publications.test.ts __tests__/components/CataloguePublicationManager.test.tsx __tests__/lib/data-store.test.ts; corepack pnpm --filter @scholar-scout/web run typecheck` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Test-Creation Ordering

1. Plan 10-01 Task 1 starts the real route tracer with a red API test; Plan 10-01 Task 2 creates the pure-contract and data-store suites before expanding candidate lifecycle behavior.
2. Plan 10-02 Task 1 adds bounded-import and CAS command regressions to the existing pure/server suites before parser and staging work; Task 2 adds independent-review, safe six-category reviewer DTO, and history API/server coverage.
3. Plan 10-03 Task 1 adds deterministic manifest, fixed Monday release-window/ISO-period, emergency-exemption, quarantine, retirement, and final-recheck regressions before release implementation; Task 2 extends API/server coverage with server-derived schedule eligibility, preview non-mutation, redaction, clone isolation, and no-network public-read checks.
4. Plan 10-04 Task 1 adds conflict/emergency/restore regressions before command work; Task 2 creates the component suite for role-aware, accessible intake/review/conflict behavior.
5. Plan 10-05 expands the component/API/server regression matrix and then records proof for every requirement and D-01 through D-15, including legacy/recovery persistence tests in `__tests__/lib/data-store.test.ts`.

## Manual-Only Verifications

| Behavior | Requirement/decision | Why manual | Test instructions |
|---|---|---|---|
| Staff can understand ordered correction codes, all six reviewer checklist categories, role limits, and the distinction between checklist completeness and a provider-truth assertion. | EVID-03, D-01 through D-04 | Clarity and operational comprehension require a human staff reader. | As editor, stage a broken candidate; as reviewer/admin, inspect the six-category summary and correction list, approve a passing record, and confirm the screen says that pass is editorial completeness rather than external truth. |
| The release/recovery console makes its fixed normal-release window, separate emergency path, and recovery consequences clear and remains keyboard-operable. | PUB-01 through PUB-03, D-07 through D-11, D-15 | Focus and assistive-technology behavior need interactive inspection. | With the staff test accounts during the Monday 09:00–17:00 America/New_York window, preview and publish once, confirm a duplicate normal release is refused, make an emergency correction outside that policy, reconcile a conflict with an older-value reason, restore, and navigate every control by keyboard. |
| Rights evidence is genuinely sufficient for a real provider image/video. | D-12 through D-14 | Automated validation checks stored structure and dates, not legal authority or licence truth. | Before entering real media, a human reviews ownership/licence/provider approval/embed documentation and expiry information; otherwise retain factual text and official source links only. |

## Validation Sign-Off

- [x] Every executable task has an exact targeted command and named test files.
- [x] Every Phase 10 requirement and locked decision D-01 through D-15 maps to one or more planned test layers.
- [x] Negative access-control, malformed-import, audit-redaction, snapshot-clone, and no-live-provider assertions are explicit.
- [x] Test creation precedes the production behavior it proves, with focused feedback after each commit.
- [x] `nyquist_compliant: true` is set because the planned architecture has a complete validation and sampling contract.

**Approval:** pending
