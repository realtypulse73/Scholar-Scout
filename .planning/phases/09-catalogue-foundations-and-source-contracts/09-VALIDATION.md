---
phase: 9
slug: catalogue-foundations-and-source-contracts
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `pnpm --filter @scholar-scout/web run test -- catalogue-contract catalogue-fixtures` |
| **Full suite command** | `pnpm --filter @scholar-scout/web run test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @scholar-scout/web run test -- catalogue-contract catalogue-fixtures` and `pnpm --filter @scholar-scout/web run typecheck`.
- **After every plan wave:** Run `pnpm --filter @scholar-scout/web run lint` and `pnpm --filter @scholar-scout/web run test`.
- **Before `$gsd-verify-work`:** Lint, typecheck, and the full web test suite must be green.
- **Max feedback latency:** 60 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | REG-01, REG-02, REG-03 | T-09-01 | Six regional boundary records and all 36 explicit coverage cells are valid; Kingston never carries a CBSA identifier. | unit | `pnpm --filter @scholar-scout/web run test -- catalogue-fixtures` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | EVID-01, EVID-02 | T-09-02 | Fact evidence requires attribution, dates, status, and verification action; stale/missing facts cannot become current. | unit | `pnpm --filter @scholar-scout/web run test -- catalogue-contract` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | EVID-05 | T-09-03 | Wage context is separately dated/source-linked and cannot encode a provider or personal pay promise. | unit | `pnpm --filter @scholar-scout/web run test -- catalogue-contract` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/__tests__/lib/catalogue-contract.test.ts` — contract, freshness, evidence, employer-paid-training, and wage-context cases.
- [ ] `apps/web/__tests__/lib/catalogue-fixtures.test.ts` — six-region, full-coverage, and boundary/local-focus fixture cases.
- [ ] `apps/web/lib/catalogue-contract.ts` — pure contract and validation helpers.
- [ ] `apps/web/lib/catalogue-fixtures.ts` — safe representative fixture data.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fixture facts do not invent a provider, local office, restriction, support, pay term, or local availability claim. | REG-03, EVID-01, EVID-05 | Source truth and claim wording need human judgment beyond a type contract. | Review fixture sources and all displayed values against their cited authority before publication. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verification or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verification.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 60s.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
