---
phase: 05
slug: school-community-and-wny-release-slice
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with Next Jest and Testing Library |
| **Config file** | `apps/web/jest.config.ts` |
| **Quick run command** | `pnpm --filter @scholar-scout/web test --runInBand` |
| **Full suite command** | `pnpm --filter @scholar-scout/web run lint && pnpm --filter @scholar-scout/web run typecheck && pnpm --filter @scholar-scout/web test --runInBand` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the focused Jest file(s) named by that task, with `--runInBand`.
- **After every plan wave:** Run `pnpm --filter @scholar-scout/web test --runInBand`.
- **Before `$gsd-verify-work`:** Run the full suite command.
- **Max feedback latency:** 120 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-* | 01 | 1 | PROD-03 | T-05-01 | A signed-in student’s note is server-validated, quota-reserved, DTO-mapped, immediately hidden on an idempotent report, and restored only by fresh staff authority. | route + store integration | `pnpm --filter @scholar-scout/web test --runInBand -- campus-notes` | ❌ planned | ⬜ pending |
| 05-02-* | 02 | 2 | PROD-03 | T-05-02 | A staff moderation queue denies non-staff reads/actions and supports only pending-review restore/remove transitions. | route + component | `pnpm --filter @scholar-scout/web test --runInBand -- community-moderation` | ❌ planned | ⬜ pending |
| 05-03-* | 03 | 3 | PROD-01 | T-05-03 | WNY and school surfaces show source-linked verification wording, accessible empty states, and equal-score alphabetical ordering. | unit + component/page | `pnpm --filter @scholar-scout/web test --runInBand -- western-new-york` | ✅ partial | ⬜ pending |
| 05-04-* | 04 | 4 | PROD-02, PROD-03 | T-05-04 | Peer matches use declared preferences only and stable public-name order; both forms explain the shared limit and never expose sender identity. | unit + component + route | `pnpm --filter @scholar-scout/web test --runInBand -- peer-guides` | ✅ partial | ⬜ pending |
| 05-05-* | 05 | 2 | PROD-02, PROD-03 | T-05-13 | The authenticated inbox path joins the note path's server-authoritative five-per-hour sliding reservation, validates before persistence, and returns only its explicit public DTO. | route + limiter integration | `pnpm --filter @scholar-scout/web test --runInBand -- rate-limit campus-community` | ❌ planned | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers framework needs; no package or test-harness installation is required.
- [ ] Add focused route/store fixtures for the shared reservation limiter, DTO shapes, staff authorization, and CAS conflict interleavings before relying on broad suite results.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Source links open the intended official resource and verification guidance remains understandable in a rendered browser. | PROD-01 | External source availability and final screen-reader reading order are environment-dependent. | Open WNY and a populated/empty school locker; use keyboard navigation and confirm each visible source link and notice. |
| A reporter receives private confirmation without a public moderation-status leak. | PROD-03 | Requires the completed report interaction in a browser session. | Post a safe note, report it while signed in, confirm it disappears from public read and only the reporter sees confirmation. |

---

## Validation Sign-Off

- [ ] All plan tasks have `<automated>` verification or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verification.
- [ ] Wave 0 covers all missing route/store fixtures.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 120 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter after execution evidence is complete.

**Approval:** pending
