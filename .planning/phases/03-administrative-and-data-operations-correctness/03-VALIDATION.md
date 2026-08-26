---
phase: 03
slug: administrative-and-data-operations-correctness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-25
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with Next Jest and Testing Library 16.3.2 |
| **Config file** | `apps/web/jest.config.ts` |
| **Quick run command** | `pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/data-recovery.test.ts __tests__/lib/data-store.test.ts __tests__/api/admin-data-routes.test.ts __tests__/components/ProgrammeAdminManager.test.tsx` |
| **Full suite command** | `pnpm --filter @scholar-scout/web run test -- --runInBand` |
| **Estimated runtime** | Measure and record during Wave 0; keep focused feedback under 120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the focused test files covering the changed server, route, or component boundary.
- **After every plan wave:** Run `pnpm --filter @scholar-scout/web run test -- --runInBand` and the web typecheck.
- **Before `$gsd-verify-work`:** Run root `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build:vercel`; all must be green.
- **Max feedback latency:** 120 seconds for focused task feedback; split focused commands if this ceiling is exceeded.
- **Execution prerequisite:** Complete the remaining Phase 2 live credential-limiter UAT before Phase 3 execution begins.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-W0-01 | TBD | 0 | OPS-03 | T-03-01 | Adapter absence is distinct from corrupt, unreadable, timeout, or provider failure; failures never become editable empty data | unit | focused `data-store.test.ts` and `data-recovery.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-02 | TBD | 0 | DATA-03 | Envelopes, plans, retention, audit, and apply invariants reject tampering, replay, stale state, oversized input, and partial writes | unit | focused `data-recovery.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-03 | TBD | 0 | OPS-02, OPS-03, DATA-03 | Staff authorization precedes storage access; capability and recovery routes return bounded 4xx/5xx contracts and never write on failure | route | focused `admin-data-routes.test.ts` | ⚠ extend | ⬜ pending |
| 03-W0-04 | TBD | 0 | OPS-02, DATA-03 | Loading, empty, unavailable, preview, confirmation, conflict, pending, success, failure, focus, and responsive-safe states follow UI-SPEC | component | focused `ProgrammeAdminManager.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/__tests__/lib/data-recovery.test.ts` — envelope, digest, server-plan, retention, audit, replay, and apply invariants.
- [ ] Extend `apps/web/__tests__/lib/data-store.test.ts` — adapter absence versus malformed, unreadable, timeout, and provider failure.
- [ ] Extend `apps/web/__tests__/api/admin-data-routes.test.ts` — capability contract, bounded input, 409/410/413/503, actor binding, and no-write failures.
- [ ] `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` — approved UI state, focus, live-region, duplicate-submission, and responsive-semantic contract.
- [ ] Shared deterministic fixtures for clock, signing key, valid envelope, digest, and throwing/counting store.
- [ ] Repair or explicitly select the pinned Node 20 and pnpm 10.34.5 command path before treating test output as evidence.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout at 320px, 768px, and 1280px with long safe reasons, incident IDs, digests, and maximum accepted operator reasons | OPS-02, DATA-03 | The UI-SPEC intentionally records three visual backstops for reflow and page-overflow behavior | Render the admin surface at each viewport; exercise healthy, unavailable, impact-preview, and confirmation states; confirm no page-level horizontal overflow, collision, or sole-value ellipsis |
| Keyboard focus recovery and live announcements across preview, retry, conflict, failure, and success | OPS-02, DATA-03 | Automated component assertions cover focus targets and ARIA wiring, but production-like assistive behavior needs a final human pass | Navigate with keyboard only; trigger each state; confirm focus moves to the documented heading/alert and status is announced once with operation-specific copy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Focused feedback latency is measured and remains under 120 seconds
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
