---
phase: 9
slug: catalogue-foundations-and-source-contracts
status: draft
nyquist_compliant: true
created: 2026-09-22
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with `next/jest` |
| **Config file** | `apps/web/jest.config.ts` |
| **Fast target-unit command** | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` (substitute `catalogue-fixtures.test.ts` for fixture tasks) |
| **Full suite command** | `pnpm --filter @scholar-scout/web run test` |
| **Target feedback latency** | under 30 seconds for the one-file, in-band unit command; full-suite timing is tracked separately at wave gates. |

---

## Sampling Rate

- **After every task commit:** Run the exact task-target command from the map below. For contract tasks use `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand`; for fixture tasks substitute `catalogue-fixtures.test.ts`. This fast unit feedback is required before the next task begins.
- **After every plan wave:** Run `pnpm --filter @scholar-scout/web run lint` and `pnpm --filter @scholar-scout/web run test`.
- **Before `$gsd-verify-work`:** Lint, typecheck, and the full web test suite must be green.
- **Maximum target-unit feedback latency:** 30 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | REG-01, REG-02, REG-03, EVID-01, EVID-02 | T-09-01, T-09-02 | One region-to-coverage tracer has mandatory source metadata, explicit boundary version/ID, structured source date, and injected-clock freshness behavior. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | created by this task | ⬜ pending |
| 09-01-02 | 01 | 1 | REG-01, REG-02, REG-03, EVID-01, EVID-02 | T-09-01, T-09-02 | Matrix failures and 731-day boundary freshness are deterministic; unavailable/malformed/future source dates are never current. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | created by 09-01-01 | ⬜ pending |
| 09-02-01 | 02 | 2 | REG-01 | T-09-04, T-09-06 | Six source-bearing boundary/local-focus records have required source-date metadata, fixed source roster, and explicit Kingston no-CBSA value. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` | created by this task | ⬜ pending |
| 09-02-02 | 02 | 2 | REG-02, REG-03 | T-09-05 | All 36 explicit coverage cells are ordered `not-yet-verified` and never infer local availability. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-fixtures.test.ts --runInBand` | created by 09-02-01 | ⬜ pending |
| 09-03-01 | 03 | 2 | EVID-01, EVID-02 | T-09-07 | Fact evidence requires authority, structured source/review dates, status, and verification action; unavailable or stale evidence cannot be current. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | extended by this task | ⬜ pending |
| 09-03-02 | 03 | 2 | EVID-01, EVID-02, EVID-05 | T-09-08, T-09-10 | Employer training and wage context have independently dated evidence and cannot encode a provider or personal pay promise. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | extended by this task | ⬜ pending |
| 09-03-03 | 03 | 2 | EVID-01, EVID-02, D-08 | T-09-11 | A non-sensitive opportunity record carries sourced or visibly unresolved location, pathway, taught skill, payer, cost/tuition, verification state, duration, and delivery facts. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | extended by this task | ⬜ pending |
| 09-04-01 | 04 | 3 | REG-01, REG-02, REG-03, EVID-01, EVID-02, EVID-05 | T-09-12 through T-09-18 | RED regressions prove forged region provenance, impossible chronology, unsupported verified coverage, malformed text facts, invalid unresolved/commitment states, and mutable fixture aliases are rejected. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts __tests__/lib/catalogue-fixtures.test.ts --runInBand` | existing test files extended by this task | ⬜ pending |
| 09-04-02 | 04 | 3 | REG-01, REG-02, REG-03, EVID-01, EVID-02, EVID-05 | T-09-12 through T-09-17 | Contract validators bind exact region provenance, enforce evidence chronology and discriminated verified coverage, return errors for malformed values, and retain claim-safe card/employment states. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | existing test file extended by 09-04-01 | ⬜ pending |
| 09-04-03 | 04 | 3 | REG-01, REG-02, REG-03 | T-09-18 | Frozen six-region and 36-cell fixtures are deeply immutable with independent source-date objects while retaining the exact roster and explicit coverage baseline. | unit + quality gate | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts __tests__/lib/catalogue-fixtures.test.ts --runInBand && pnpm --filter @scholar-scout/web run typecheck && pnpm --filter @scholar-scout/web run lint && pnpm --filter @scholar-scout/web run test --runInBand` | existing test files extended by 09-04-01 | ⬜ pending |
| 09-05-01 | 05 | 4 | REG-01, REG-02, REG-03, EVID-01, EVID-02 | T-09-19 through T-09-21 | RED regressions prove injected-clock coverage chronology and recoverable malformed card-evidence, region-entry, and coverage-row import validation. | unit | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | existing test file extended by this task | ✅ green |
| 09-05-02 | 05 | 4 | REG-01, REG-02, REG-03, EVID-01, EVID-02 | T-09-19 through T-09-21 | Contract validation rejects forged coverage review chronology and returns stable errors for malformed card evidence and matrix entries without losing valid-pair evaluation. | unit + quality gate | `pnpm --filter @scholar-scout/web run test -- __tests__/lib/catalogue-contract.test.ts --runInBand` | existing test file extended by 09-05-01 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Test-Creation Ordering

- Plan 09-01 Task 1 creates the contract module and its focused test file as a red-to-green tracer.
- Plan 09-02 Task 1 creates the fixture module and its focused test file after Plan 09-01 exports the metadata/freshness interface.
- Plan 09-03 extends the Plan 09-01 test file after Plan 09-01 completes; it has no fixture-plan dependency.
- Plan 09-04 Task 1 adds all review regressions to both existing test files before any production-module edit; Task 2 resolves contract regressions and Task 3 resolves fixture immutability regressions before the full quality gate.
- Plan 09-05 Task 1 adds coverage-chronology and malformed-import RED regressions before Task 2 hardens the pure contract validators; Task 3 records the repair map before the focused, typecheck, lint, and full-suite quality gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fixture facts do not invent a provider, local office, restriction, support, pay term, or local availability claim. | REG-03, EVID-01, EVID-05 | Source truth and claim wording need human judgment beyond a type contract. | Review fixture sources and all displayed values against their cited authority before publication. |

---

## Validation Sign-Off

- [x] Every executable task is mapped to its exact target-unit command and source files.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Test-creation ordering is explicit and no artificial Wave-0 prerequisite remains.
- [ ] No watch-mode flags.
- [x] Fast target-unit feedback command and under-30-second cadence are specified for every commit.
- [x] `nyquist_compliant: true` is set because task mapping and feedback cadence are complete.

**Approval:** pending
