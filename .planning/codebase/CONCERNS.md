# Codebase Concerns

**Analysis Date:** 2026-07-21

## Tech Debt

**Monolithic admin and persistence modules:**
- Issue: UI state, API orchestration, conflict resolution, import/export, backup operations, and rendering are concentrated in `apps/web/components/admin/ProgrammeAdminManager.tsx` (1,863 lines); adapter implementations, schemas, validation, auth persistence, backup/restore, and repository operations are concentrated in `apps/web/lib/server/data-store.ts` (1,183 lines).
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/lib/server/data-store.ts`, `apps/web/lib/admin-programmes.ts`
- Impact: Small changes have a large regression surface, review is difficult, and feature ownership is unclear.
- Fix approach: Split the admin component into data-governance, editor, conflict-resolution, and restore modules; split storage adapters, domain repositories, validation, and backup services behind narrow typed interfaces.

**Two persistence identities:**
- Issue: Authenticated onboarding and shortlist state use account APIs, while recommendations, simulations, feed interactions, memory, analytics, shares, and referrals accept arbitrary client-provided `userKey` values; many components also retain independent `localStorage` copies.
- Files: `apps/web/app/api/account/onboarding/route.ts`, `apps/web/app/api/account/shortlist/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/lib/server/platform-store.ts`, `apps/web/components/recommendations/RecommendationDashboard.tsx`
- Impact: A student's state can diverge across browser fallback, authenticated records, and platform records; sign-in does not establish one authoritative identity for the full experience.
- Fix approach: Derive user identity from the NextAuth session for authenticated APIs, define an explicit anonymous-session migration key, and centralize local-to-account reconciliation.

**Hard-coded product catalog and algorithm inputs:**
- Issue: Programme, feed, creator, and simulation catalogs are committed TypeScript arrays, while scoring thresholds and weights are embedded in functions.
- Files: `apps/web/lib/programmes.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/career-simulations.ts`, `apps/web/lib/preference-matching.ts`
- Impact: Content and scoring updates require code deployment, cannot be versioned independently, and are difficult for non-engineering reviewers to govern.
- Fix approach: Move governed records and algorithm configurations to a versioned data model with publication state, provenance, effective dates, and audit history; keep pure scoring functions consuming the configuration.

**Documentation and runtime version mismatch:**
- Issue: Root runtime metadata requires Node 20, while the README says Node 18+.
- Files: `package.json`, `README.md`
- Impact: Developers can install an unsupported runtime and encounter inconsistent build/test behavior.
- Fix approach: Make `README.md` match `package.json` and enforce the runtime in CI.

## Known Bugs

**Lost updates during concurrent writes:**
- Symptoms: Two simultaneous mutations can each read the same full document and the later full-document write overwrites the earlier mutation.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `services/http-data-service/src/server.mjs`
- Trigger: Submit feed, analytics, shortlist, programme, or simulation mutations concurrently against JSON, HTTP, or Blob storage.
- Workaround: Serialize user actions operationally; no application-level lock, ETag, transaction, or compare-and-swap protects general writes.

**Multi-write operations are non-atomic:**
- Symptoms: A primary record may save while its analytics event or derived memory update fails, or shortlist IDs may save while shortlist plans fail.
- Files: `apps/web/lib/server/platform-store.ts`, `apps/web/app/api/account/shortlist/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/app/api/share/route.ts`
- Trigger: Adapter/network failure between sequential `writeScholarScoutData` calls.
- Workaround: Retry can duplicate events; there is no transaction or idempotency key.

**OAuth session user id can be incorrect:**
- Symptoms: The JWT callback stores `token.role` but does not explicitly replace `token.sub` with the durable `storedUser.id` after `signIn` mutates `user.id`; the session callback uses `token.sub` as the account key.
- Files: `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`
- Trigger: First OAuth sign-in where the provider subject differs from the locally generated user UUID.
- Workaround: Credentials sessions use the stored ID directly; OAuth requires live validation.

**Unvalidated onboarding payloads:**
- Symptoms: Authenticated callers can persist malformed onboarding objects through direct HTTP requests, causing matching and UI code to receive invalid enum values or missing fields.
- Files: `apps/web/app/api/account/onboarding/route.ts`, `apps/web/lib/onboarding-validation.ts`, `apps/web/lib/preference-matching.ts`
- Trigger: POST arbitrary JSON to `/api/account/onboarding` with a valid session.
- Workaround: The browser wizard validates normal UI submissions, but the API trusts its TypeScript cast.

**Generated share links do not correspond to an app route:**
- Symptoms: The server returns `https://scholarscout.app/share/<type>/<id>`, but no `apps/web/app/share/[type]/[id]/page.tsx` route exists.
- Files: `apps/web/lib/server/platform-store.ts`, `apps/web/app/api/share/route.ts`, `apps/web/app/`
- Trigger: Create and open a tracked share URL.
- Workaround: The API also records the target, but callers must construct a different existing route themselves.

## Security Considerations

**Unauthenticated personal-data and operations APIs:**
- Risk: Any caller can read all analytics/referral records, read another user's simulation results or memory by choosing `userKey`, write activity as another user, run global decisions, and spend configured OpenAI quota.
- Files: `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/referrals/route.ts`, `apps/web/app/api/memory/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/decisions/route.ts`, `apps/web/app/api/advisor-chat/route.ts`
- Current mitigation: Account onboarding, shortlist, and admin routes use NextAuth; the listed platform routes do not.
- Recommendations: Require sessions for personal and administrative data, derive identity server-side, restrict aggregate endpoints to staff, add anonymous signed session IDs where needed, and rate-limit mutation/AI routes.

**Weak password policy and no abuse controls:**
- Risk: Registration accepts any password of eight characters and exposes an unrestricted public account-creation endpoint; sign-in and registration have no visible rate limiting, lockout, email verification, or bot defense.
- Files: `apps/web/app/api/register/route.ts`, `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`
- Current mitigation: Passwords use per-password UUID salts with `scryptSync`; staff role is derived from a server-side email allowlist.
- Recommendations: Add request throttling, breached-password/strength checks, email verification, secure recovery, and login monitoring. Prefer an established identity provider for production credentials.

**Error detail disclosure:**
- Risk: Advisor errors return raw `Error.message` to unauthenticated clients, potentially exposing provider or implementation details.
- Files: `apps/web/app/api/advisor-chat/route.ts`
- Current mitigation: Unknown non-Error values receive a generic message.
- Recommendations: Log a correlation ID server-side and return a stable generic error response; never expose upstream provider response content.

**Unbounded request bodies and metadata:**
- Risk: Attackers can send very large advisor context arrays, analytics metadata, feed values, or import bodies, driving memory, storage, and AI-token use.
- Files: `apps/web/app/api/advisor-chat/route.ts`, `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/admin/data/import/validate/route.ts`
- Current mitigation: Some required-field checks and shortlist note truncation exist in `apps/web/lib/server/data-store.ts`.
- Recommendations: Add schema validation with explicit string/array/body limits, reject non-finite numbers, cap event metadata, and enforce platform request-size/rate limits.

## Performance Bottlenecks

**Full-document reads and writes:**
- Problem: Every mutation loads and rewrites the complete ScholarScout data document; Blob and HTTP adapters transfer the full dataset.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `services/http-data-service/src/server.mjs`
- Cause: The `ScholarScoutDataStore` boundary exposes only `read()` and `write(data)`.
- Improvement path: Adopt record-level database operations and indexed repositories; retain snapshot export/restore as a separate operational feature.

**Unbounded event arrays and repeated linear scans:**
- Problem: Feed interactions, simulation results, analytics events, shares, and referrals grow without retention or pagination; recommendation and metrics requests repeatedly scan arrays.
- Files: `apps/web/lib/server/platform-store.ts`, `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/referrals/route.ts`
- Cause: Append-only arrays live inside one JSON document and GET routes return complete collections.
- Improvement path: Add retention policies, pagination, per-user/date indexes, aggregate tables, and asynchronous analytics processing.

**Synchronous password hashing in the request process:**
- Problem: `scryptSync` blocks the Node event loop during registration and credential verification.
- Files: `apps/web/lib/server/data-store.ts`
- Cause: Password hashing uses the synchronous crypto API.
- Improvement path: Use async `crypto.scrypt`, a bounded worker, or the identity provider's credential system; add load tests before enabling public credentials.

## Fragile Areas

**Recommendation algorithm consistency:**
- Files: `apps/web/lib/preference-matching.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/adaptive-recommendations.ts`, `apps/web/lib/simulation-recommendation-signals.ts`, `apps/web/lib/predictive-decisions.ts`
- Why fragile: Multiple ranking/scoring layers use separate hard-coded weights, thresholds, and tie-breakers without a single algorithm version or canonical orchestration path.
- Safe modification: Establish one versioned match contract, document features and weights, preserve deterministic fixtures, and compare candidate versions against a golden dataset before rollout.
- Test coverage: Unit tests cover selected examples in `apps/web/__tests__/lib/preference-matching.test.ts` and `apps/web/__tests__/lib/adaptive-recommendations.test.ts`, but no cross-model calibration, fairness, sensitivity, drift, or backtesting suite exists.

**Admin programme workflow:**
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/lib/admin-programmes.ts`, `apps/web/app/api/admin/programmes/route.ts`
- Why fragile: Large coupled UI and domain modules encode publication, validation, conflict merge, restore, and reviewer workflows.
- Safe modification: Extract one workflow at a time behind tests, preserve revision/conflict behavior, and exercise it through route-level integration tests.
- Test coverage: Domain tests are extensive in `apps/web/__tests__/lib/admin-programmes.test.ts`, but UI behavior and most programme API routes lack dedicated integration coverage.

**Browser/server reconciliation:**
- Files: `apps/web/components/onboarding/OnboardingWizard.tsx`, `apps/web/components/shortlist/ShortlistComparison.tsx`, `apps/web/components/recommendations/RecommendationDashboard.tsx`, `apps/web/components/admin/ProgrammeAdminManager.tsx`
- Why fragile: Each component implements its own local hydration, fallback, and API synchronization sequencing.
- Safe modification: Introduce shared account-state hooks with explicit source precedence and migration semantics.
- Test coverage: `apps/web/__tests__/components/OnboardingWizard.test.tsx` covers local persistence, but signed-in reconciliation and multi-tab conflict behavior are not tested.

## Scaling Limits

**Single JSON/Blob aggregate:**
- Current capacity: No measured or enforced capacity is documented; the system is suitable only for a small prelaunch dataset.
- Limit: Blob/object replacement latency, payload size, contention, and lost-update probability increase with every user and event.
- Scaling path: Move users, profiles, programme records, events, and simulations into a transactional database with row-level writes and indexes; keep adapters behind repository interfaces.
- Files: `apps/web/lib/server/data-store.ts`, `services/http-data-service/src/server.mjs`, `docs/scholarscout-rubric.md`

**In-request analytics and recommendation updates:**
- Current capacity: Every event can trigger multiple full data operations synchronously.
- Limit: Traffic spikes increase user-facing latency and contention; there is no queue or retry ledger.
- Scaling path: Record idempotent events quickly, process memory/decision aggregates asynchronously, and cache published recommendation inputs.
- Files: `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/lib/server/platform-store.ts`

## Dependencies at Risk

**NextAuth v4 / Auth.js migration:**
- Risk: `next-auth` 4.24.14 is the older major line while the app is on Next.js 15; future framework/runtime changes may require an Auth.js v5 migration.
- Impact: Authentication callbacks, route wiring, and session typing in `apps/web/auth.ts` may need coordinated changes.
- Migration plan: Pin and monitor the supported matrix, add live OAuth integration tests, then migrate behind the existing account API boundary.
- Files: `apps/web/package.json`, `apps/web/auth.ts`, `apps/web/app/api/auth/[...nextauth]/route.ts`

**Jest/ts-jest major mismatch:**
- Risk: Jest 30.3.0 is paired with `ts-jest` 29.4.9.
- Impact: Transform compatibility can break on clean installs or future test configuration changes.
- Migration plan: Align supported major versions or remove unused `ts-jest` if `next/jest` supplies all transformation needs.
- Files: `apps/web/package.json`, `apps/web/jest.config.ts`

**Duplicate package-manager state:**
- Risk: The repository has a root npm lockfile and an additional pnpm lock/workspace file inside the web app.
- Impact: Developers can resolve different dependency graphs depending on working directory and package manager.
- Migration plan: Declare npm as authoritative and remove or explicitly govern the nested pnpm files.
- Files: `package-lock.json`, `apps/web/pnpm-lock.yaml`, `apps/web/pnpm-workspace.yaml`, `package.json`

## Missing Critical Features

**PRD match-intelligence contract:**
- Problem: There is no central `match-intelligence` module that names the current model version, inputs, weights, confidence, explanations, and audit metadata; logic is distributed across several modules.
- Blocks: Reproducing, explaining, approving, and safely evolving the uploaded PRD's algorithm requirements.
- Files: `apps/web/lib/preference-matching.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/adaptive-recommendations.ts`, `apps/web/lib/predictive-decisions.ts`

**Algorithm backtesting and Accuracy Lab:**
- Problem: No backtesting engine, labeled evaluation dataset, accuracy dashboard, bias/fairness slices, drift monitoring, or promotion gate is present.
- Blocks: Evidence-based claims about match quality and safe launch of algorithm changes required by the uploaded PRD.
- Files: `apps/web/lib/`, `apps/web/app/admin/`, `apps/web/__tests__/lib/`

**Game of Five experience:**
- Problem: No Game of Five route, component, state model, or tests exist; current discovery surfaces are onboarding, feed, programmes, and simulations.
- Blocks: The rapid preference-elicitation and engagement flow specified in the uploaded PRD.
- Files: `apps/web/app/`, `apps/web/components/`, `apps/web/lib/career-simulations.ts`

**Student messaging:**
- Problem: No student/advisor conversation store, inbox, delivery state, notification model, moderation, or messaging UI exists; `AdvisorChat` is a stateless AI request surface.
- Blocks: The Messages requirement and durable human support workflows in the uploaded PRD.
- Files: `apps/web/components/advisor/AdvisorChat.tsx`, `apps/web/app/api/advisor-chat/route.ts`, `apps/web/lib/server/platform-store.ts`

**Launch-grade data and provider provisioning:**
- Problem: Production OAuth, durable storage, monitoring, and real programme-source verification remain operator provisioning steps rather than verified deployed capabilities.
- Blocks: Public launch readiness despite strong rehearsal/checklist tooling.
- Files: `docs/production-readiness-checklist.md`, `docs/production-release-runbook.md`, `docs/scholarscout-rubric.md`, `scripts/prelaunch-rehearsal.mjs`

## Test Coverage Gaps

**Platform API authorization and validation:**
- What's not tested: Feed, memory, simulation, analytics, referrals, shares, decisions, and advisor route authorization, spoofing resistance, schema limits, and failure behavior.
- Files: `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/memory/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/referrals/route.ts`, `apps/web/app/api/share/route.ts`, `apps/web/app/api/decisions/route.ts`, `apps/web/app/api/advisor-chat/route.ts`
- Risk: Privacy, quota, and data-integrity regressions can ship unnoticed.
- Priority: High

**Authentication lifecycle:**
- What's not tested: Registration abuse controls, password verification timing/load, OAuth first sign-in, durable ID propagation, role changes, session expiry, and account migration from anonymous local state.
- Files: `apps/web/auth.ts`, `apps/web/app/api/register/route.ts`, `apps/web/lib/server/data-store.ts`
- Risk: Users can receive the wrong account identity or role, or lose pre-sign-in state.
- Priority: High

**Concurrent persistence:**
- What's not tested: Simultaneous read-modify-write operations, adapter compare-and-swap behavior, partial multi-write failures, retries, and idempotency.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `services/http-data-service/src/server.mjs`
- Risk: Silent data loss and duplicate analytics under normal multi-user traffic.
- Priority: High

**Algorithm evaluation:**
- What's not tested: Model-version reproducibility, calibration, ranking metrics, fairness slices, threshold sensitivity, sparse/malformed profiles, and drift against a labeled dataset.
- Files: `apps/web/lib/preference-matching.ts`, `apps/web/lib/platform.ts`, `apps/web/lib/adaptive-recommendations.ts`, `apps/web/lib/predictive-decisions.ts`
- Risk: Recommendation changes can reduce quality or systematically disadvantage student groups without detection.
- Priority: High

**Browser-level critical journeys:**
- What's not tested: No Playwright/Cypress suite covers sign-up/sign-in, onboarding persistence, programme ranking, shortlist reconciliation, simulation, admin publishing, backup restore, or mobile navigation against a running app.
- Files: `apps/web/app/`, `apps/web/components/`, `apps/web/__tests__/`
- Risk: Routing, hydration, provider configuration, and cross-page integration regressions escape unit tests.
- Priority: High

**Accessibility and responsive behavior:**
- What's not tested: Keyboard-only flows, focus order/restoration, screen-reader announcements across complex pages, color contrast, zoom, and target mobile viewports.
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/components/recommendations/RecommendationDashboard.tsx`, `apps/web/components/shortlist/ShortlistComparison.tsx`, `apps/web/app/globals.css`
- Risk: The mobile-first and inclusive product requirements can regress without failing tests.
- Priority: Medium

**Performance and load:**
- What's not tested: Full-document adapter latency by dataset size, concurrent user throughput, AI endpoint rate/latency, and synchronous password hashing under load.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `apps/web/app/api/advisor-chat/route.ts`
- Risk: The app can pass functional tests but fail under launch traffic.
- Priority: Medium

---

*Concerns audit: 2026-07-21*
