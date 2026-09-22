---
phase: 02
slug: authentication-api-ai-and-webhook-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-26
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 (`next/jest`) for web routes/components and Node's built-in test runner for the webhook runner |
| **Config file** | `apps/web/jest.config.ts`; standalone service uses Node's native runner |
| **Quick run command** | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/auth-controls.test.ts __tests__/api/advisor-chat.test.ts` |
| **Full suite command** | `corepack pnpm --filter @scholar-scout/web test --runInBand` plus `corepack pnpm --filter @scholar-scout/codex-webhook-runner exec node --test test/server.test.mjs` |
| **Estimated runtime** | ~60 seconds under Node 20 / Corepack pnpm 10.34.5 |

---

## Sampling Rate

- **After every task commit:** Run that task's mapped automated command below.
- **After every plan wave:** Run the full suite command above plus web lint and typecheck.
- **Before `$gsd-verify-work`:** Full suite must be green under Node 20 / Corepack pnpm 10.34.5.
- **Max feedback latency:** 60 seconds for a focused test command.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SEC-03, SEC-05 | T-02-01 | Fixed package releases have recorded registry integrity before installation | registry provenance | `corepack pnpm view @upstash/redis@1.38.0 dist.integrity && corepack pnpm view @upstash/ratelimit@2.0.8 dist.integrity` | n/a checkpoint | pending |
| 02-02-01 | 02 | 2 | SEC-03, SEC-05 | T-02-SC | Exact approved packages and server-only configuration compile | install/typecheck | `corepack pnpm --filter @scholar-scout/web run typecheck` | existing config | pending |
| 02-02-02 | 02 | 2 | SEC-03, SEC-05 | T-02-02 | Atomic quota and trusted Vercel IP policy deny safely | unit | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/rate-limit.test.ts __tests__/lib/request-ip.test.ts` | W0 | pending |
| 02-02-03 | 02 | 2 | SEC-03 | T-02-03 | Oversize/malformed/extra-field JSON is rejected before downstream work | unit | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/api-request.test.ts` | W0 | pending |
| 02-03-01 | 03 | 3 | SEC-01, SEC-03 | T-02-05 | Only allowlisted guest records migrate once; community collections do not transfer | store integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/data-store.test.ts` | existing extended | pending |
| 02-03-02 | 03 | 3 | SEC-01 | T-02-04, T-02-06 | Server resolves opaque account/guest actor without caller-selected identity | route contract | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/auth-controls.test.ts` | W0 | pending |
| 02-03-03 | 03 | 3 | SEC-01, SEC-03 | T-02-05 | Session-bound guest migration is idempotent and invalidates its credential | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/auth-controls.test.ts` | W0 | pending |
| 02-04-01 | 04 | 4 | SEC-01 | T-02-07 | Memory and simulations use only the resolved actor | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/user-data-routes.test.ts` | W0 | pending |
| 02-04-02 | 04 | 4 | SEC-01 | T-02-08 | Actor-owned analytics writes cannot disclose global events | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/user-data-routes.test.ts` | W0 | pending |
| 02-05-01 | 05 | 4 | SEC-01 | T-02-09, T-02-10 | Referrals/feed events are owned by the resolved actor | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/engagement-routes.test.ts` | W0 | pending |
| 02-05-02 | 05 | 4 | SEC-01 | T-02-09 | Shares and experiments reject cross-actor ownership | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/engagement-routes.test.ts` | W0 | pending |
| 02-06-01 | 06 | 4 | SEC-02 | T-02-11, T-02-12 | Revoked/malformed staff configuration denies and audits minimally | unit/route | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/active-staff.test.ts` | W0 | pending |
| 02-06-02 | 06 | 4 | SEC-02 | T-02-11, T-02-12 | Programme administration rechecks active staff before work | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/active-staff.test.ts` | W0 | pending |
| 02-07-01 | 07 | 5 | SEC-02 | T-02-13, T-02-14 | Backup/import actions require active staff and audit outcomes | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/admin-data-routes.test.ts` | existing extended | pending |
| 02-07-02 | 07 | 5 | SEC-02 | T-02-13, T-02-14 | Backup plan/restore/status use the same active-staff boundary | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/admin-data-routes.test.ts` | existing extended | pending |
| 02-08-01 | 08 | 4 | SEC-03 | T-02-15, T-02-17 | Exact advisor validation, bounded context, crisis handoff, and fixture cases are deterministic | unit/eval fixture | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/lib/advisor-guardrails.test.ts` | W0 | pending |
| 02-08-02 | 08 | 4 | SEC-03 | T-02-15, T-02-16, T-02-17 | Advisor route preempts acute crisis, validates exact input, reserves quota, and protects provider calls | route/component | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/advisor-chat.test.ts __tests__/lib/advisor-guardrails.test.ts __tests__/components/advisor/AdvisorChat.test.tsx` | W0 | pending |
| 02-09-01 | 09 | 1 | SEC-04 | T-02-18, T-02-19 | Missing or invalid HMAC returns 503 without parse/GitHub/agent side effects | real HTTP service | `corepack pnpm --filter @scholar-scout/codex-webhook-runner exec node --test test/server.test.mjs` | W0 | pending |
| 02-09-02 | 09 | 1 | SEC-04 | T-02-19, T-02-20 | Qualifying webhook packet is bounded and bearer-authenticated | real HTTP service | `corepack pnpm --filter @scholar-scout/codex-webhook-runner exec node --test test/server.test.mjs` | W0 | pending |
| 02-09-03 | 09 | 1 | SEC-04 | T-02-18, T-02-20 | Documented service command exercises the hardened contract | service integration | `corepack pnpm --filter @scholar-scout/codex-webhook-runner exec node --test test/server.test.mjs` | W0 | pending |
| 02-10-01 | 10 | 5 | SEC-05 | T-02-21, T-02-22 | Credentials boundary returns 429/reset before lookup/KDF and NextAuth consumes one-use grants | route/store integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/auth-controls.test.ts __tests__/lib/data-store.test.ts` | W0 | pending |
| 02-10-02 | 10 | 5 | SEC-01 | T-02-23 | OAuth sessions trigger exactly one safe guest migration request | component interaction | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/components/auth/AuthSessionProvider.test.tsx` | W0 | pending |
| 02-11-01 | 11 | 6 | SEC-05 | T-02-24 | Registration uses trusted Vercel IP and returns 429/reset before writes | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/register.test.ts` | W0 | pending |
| 02-11-02 | 11 | 6 | SEC-05, SEC-01 | T-02-25, T-02-26 | AuthForm maps only fixed outcomes, uses opaque grant, and orders migration before navigation | component interaction | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/components/auth/AuthForm.test.tsx` | W0 | pending |
| 02-12-01 | 12 | 4 | SEC-01 | T-02-27 | Onboarding profile reads/writes use only the resolved account or opaque guest actor and reject unbounded/foreign input | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/account-guest-routes.test.ts` | W0 | pending |
| 02-12-02 | 12 | 4 | SEC-01 | T-02-28 | Shortlist reads/writes use only the resolved account or opaque guest actor; same-device migration carries both shortlisted IDs and plans | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/account-guest-routes.test.ts` | W0 | pending |
| 02-13-01 | 13 | 5 | SEC-01 | T-02-29 | Caller audit is recorded and the disabled public decision route cannot read global engagement, return decision data, or write decision logs | route integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/decision-boundary.test.ts` | W0 | pending |
| 02-13-02 | 13 | 5 | SEC-01, SEC-02 | T-02-30 | Active staff authorization precedes every server-rendered global-metrics read/write; denied dashboard access reveals no totals or decisions | route/server-page integration | `corepack pnpm --filter @scholar-scout/web test --runInBand --runTestsByPath __tests__/api/decision-boundary.test.ts` | W0 | pending |

*Status: pending -> green -> red -> flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/__tests__/api/auth-controls.test.ts` and `apps/web/__tests__/lib/rate-limit.test.ts` - actor, credential grant, and atomic-limit seams.
- [ ] `apps/web/__tests__/api/account-guest-routes.test.ts` - guest/account onboarding and shortlist isolation, bounded route input, and post-migration visibility.
- [ ] `apps/web/__tests__/api/advisor-chat.test.ts`, `apps/web/__tests__/lib/advisor-guardrails.test.ts`, and `apps/web/__tests__/fixtures/advisor-eval-cases.ts` - advisor guardrails and synthetic evaluation cases.
- [ ] `services/codex-webhook-runner/test/server.test.mjs` - real HTTP webhook boundary tests.
- [ ] `apps/web/__tests__/components/advisor/AdvisorChat.test.tsx`, `apps/web/__tests__/components/auth/AuthSessionProvider.test.tsx`, `apps/web/__tests__/components/auth/AuthForm.test.tsx`, and `apps/web/__tests__/api/register.test.ts` - browser and registration boundary tests.
- [ ] `apps/web/__tests__/api/decision-boundary.test.ts` - disabled public decision route, source/caller audit evidence, and active-staff-before-metrics dashboard coverage.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fixed Upstash package provenance and production provisioning | SEC-03, SEC-05 | Registry/source review and Vercel secret placement require maintainer authority | Complete Plan 01's blocking checklist and retain the provenance/provisioning record in its summary; the registry-integrity command remains the automated corroboration. |

---

## Validation Sign-Off

- [x] All planned tasks map to an automated command or explicit registry corroboration.
- [x] Sampling continuity: no 3 consecutive implementation tasks lack automated verification.
- [x] Wave 0 names every planned missing test artifact.
- [x] No watch-mode flags appear in mapped commands.
- [x] Focused feedback target is 60 seconds or less.
- [ ] `nyquist_compliant: true` set after the first execution wave confirms every mapped command.

**Approval:** pending
