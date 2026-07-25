# Codebase Concerns

**Analysis Date:** 2026-07-25

## Tech Debt

**Whole-document data persistence:**
- Issue: `apps/web/lib/server/data-store.ts` owns credentials, user profiles, shortlists, programme records, social data, audit logs, restore snapshots, three persistence adapters, validation, and password hashing in one 1,420-line module. Most mutations follow a `read()` then in-memory mutation then `write()` pattern against the entire `ScholarScoutData` document.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/lib/server/platform-store.ts`, `services/http-data-service/src/server.mjs`
- Impact: An unrelated edit can change shared persistence behavior; concurrent writes can overwrite each other; tests need extensive process-global adapter and environment setup.
- Fix approach: Split repositories by bounded domain, move identity and transactional records to a database, and make each write operation atomic with a version/ETag or transaction. Keep the adapter interface narrow and test each adapter independently.

**Administrative screen combines separate workflows:**
- Issue: `apps/web/components/admin/ProgrammeAdminManager.tsx` combines programme editing, audit history, data-store health, backup planning, import validation, restoration, conflict recovery, and all presentation primitives in a 1,863-line client component.
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/app/admin/programmes/page.tsx`, `apps/web/app/api/admin/programmes/route.ts`
- Impact: Changes to one admin concern risk breaking another, error/loading behavior differs between flows, and the component is difficult to unit-test or reuse.
- Fix approach: Separate programme CRUD, data operations, import/restore, and presentational fields into focused components/hooks; add route-contract tests for each backend endpoint before reconnecting the UI.

**Duplicate simulation implementations:**
- Issue: Two distinct components named `SimulationPlayer` implement different types, interaction patterns, and persistence behavior.
- Files: `apps/web/components/simulation/SimulationPlayer.tsx`, `apps/web/components/simulations/SimulationPlayer.tsx`, `apps/web/app/simulate/page.tsx`, `apps/web/app/explore/page.tsx`
- Impact: Simulation experiences can silently diverge; one flow persists recommendation signals in local storage while the other only displays a result.
- Fix approach: Select one domain model and player contract, migrate both routes to it, and retain variants only when they are explicitly tested and intentionally different.

## Known Bugs

**Admin data-management UI calls routes that do not exist:**
- Symptoms: The programme manager requests status, backups, exports, import validation/restoration, and backup plan/restoration endpoints that are absent from the route tree. Its corresponding test imports the same nonexistent modules.
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/__tests__/api/admin-data-routes.test.ts`, `apps/web/app/api/admin/programmes/route.ts`
- Trigger: Load the admin programmes screen or resolve `apps/web/__tests__/api/admin-data-routes.test.ts`; requests such as `/api/admin/data/status` cannot be served and test imports cannot resolve.
- Workaround: The programme CRUD endpoint in `apps/web/app/api/admin/programmes/route.ts` remains available; do not use the rendered data-management controls until their route handlers are implemented.

**CI contains an unrelated, nonexistent CrimClock quality gate:**
- Symptoms: The `crimclock-quality-gate` job invokes the missing `@crimclock/web` workspace and nonexistent `services/api` directory after the ScholarScout web gate.
- Files: `.github/workflows/ci.yml`, `package.json`, `services/README.md`
- Trigger: Any push or pull request targeting `main` runs the workflow; the CrimClock job cannot find its declared workspace/service.
- Workaround: None in CI. Remove or repair the job before treating the workflow as a repository-wide quality signal.

**Malformed or unavailable JSON storage is treated as a new empty data set:**
- Symptoms: A JSON parse/read failure returns `INITIAL_DATA` instead of reporting a storage error.
- Files: `apps/web/lib/server/data-store.ts`
- Trigger: Corrupt, unreadable, or temporarily unavailable `SCHOLARSCOUT_DATA_FILE` data causes reads to appear as an empty application state; a subsequent write can replace the original document.
- Workaround: Restore the backing file before issuing a mutation; use the backup data only after verifying it is complete.

## Security Considerations

**Unauthenticated APIs expose and accept user-keyed product data:**
- Risk: `GET /api/analytics/events` returns every analytics event, `GET /api/referrals` returns every referral record, and `/api/memory` plus `/api/simulations/results` accept caller-controlled `userKey` values. Several matching POST routes also persist caller-controlled keys without a session or rate limit.
- Files: `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/referrals/route.ts`, `apps/web/app/api/memory/route.ts`, `apps/web/app/api/simulations/results/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/share/route.ts`
- Current mitigation: Account onboarding and shortlist routes require `getServerSession` in `apps/web/app/api/account/onboarding/route.ts` and `apps/web/app/api/account/shortlist/route.ts`; these public routes do not apply that boundary.
- Recommendations: Derive the subject from the authenticated session, make aggregate analytics staff-only, restrict user-specific reads to the current user, validate request schemas and sizes, and rate-limit public events at the edge.

**OpenAI advisor endpoint is anonymously billable and receives unbounded input:**
- Risk: Any caller can POST arbitrary message and context arrays to `/api/advisor-chat`; when `OPENAI_API_KEY` exists, the route forwards them to the Responses API without authentication, input size limits, rate limits, or abuse controls.
- Files: `apps/web/app/api/advisor-chat/route.ts`, `apps/web/components/advisor/AdvisorChat.tsx`
- Current mitigation: The prompt asks the model to use only supplied context and output is truncated after the provider response.
- Recommendations: Require a session or tightly rate-limited anonymous identity, cap and validate every field before composing the prompt, add usage quotas/moderation and timeout handling, and isolate untrusted text from instructions.

**Webhook runner fails open when the signature secret is absent:**
- Risk: `verifySignature` returns true when `GITHUB_WEBHOOK_SECRET` is unset. A crafted issues payload carrying `codex` or `automation` can then cause a GitHub comment with `GITHUB_TOKEN` and be forwarded to `CODEX_AGENT_ENDPOINT` without an authorization header.
- Files: `services/codex-webhook-runner/src/server.mjs`, `services/codex-webhook-runner/README.md`
- Current mitigation: When configured, the handler checks GitHub's SHA-256 signature and filters events and labels.
- Recommendations: Refuse to start or return 503 without the secret, validate repository/actor/label allowlists after signature verification, authenticate the agent dispatch, set body-size and request-time limits, and handle dispatch failures without unhandled rejections.

**Staff access cannot be revoked only by editing the allowlist:**
- Risk: A role is determined from `SCHOLARSCOUT_STAFF_EMAILS` when an account is created, stored with the user, then copied into a JWT. Removing an email from the environment does not downgrade an existing stored account or issued session.
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/auth.ts`, `apps/web/app/api/admin/programmes/route.ts`
- Current mitigation: The registration route ignores its client-supplied role and calls `getAccountRoleForEmail` in `apps/web/app/api/register/route.ts`.
- Recommendations: Resolve staff authorization server-side on each privileged request (or maintain a revocable role record), rotate/reject old sessions after a role change, and provide an audited staff-revocation operation.

**Local credential login has no throttling and performs synchronous derivation:**
- Risk: Credentials authentication invokes `scryptSync` for each login attempt; registration and credential authorization have no visible per-IP or per-account throttling.
- Files: `apps/web/auth.ts`, `apps/web/lib/server/data-store.ts`, `apps/web/app/api/register/route.ts`
- Current mitigation: Passwords are salted and compared with `timingSafeEqual` in `apps/web/lib/server/data-store.ts`.
- Recommendations: Apply registration/login rate limits and account-level backoff, enforce password policy beyond length, and move expensive derivation off the request event loop or use a managed identity provider.

## Performance Bottlenecks

**Every user event rewrites the complete data snapshot:**
- Problem: Feed interactions, simulations, memory, referrals, shares, analytics, programme edits, and account changes load and serialize the full data document. HTTP and blob adapters transfer the complete document for each write.
- Files: `apps/web/lib/server/platform-store.ts`, `apps/web/lib/server/data-store.ts`, `services/http-data-service/src/server.mjs`
- Cause: The persistence contract provides only document-level `read` and `write`; append operations create new arrays in memory and then write the entire object.
- Improvement path: Persist append-heavy data in appendable/queryable tables, paginate read APIs, aggregate analytics asynchronously, and use optimistic concurrency/versioning for the remaining document operations.

**HTTP data service creates unbounded copies on each write:**
- Problem: Before every PUT, the data service copies the complete previous document into `data/backups` and never prunes or rotates those copies.
- Files: `services/http-data-service/src/server.mjs`, `services/http-data-service/README.md`
- Cause: `backupExistingDocument` is invoked on every mutation with timestamp-only filenames and no retention policy.
- Improvement path: Use transactional storage with managed backups, or add retention, compression, health metrics, atomic writes, and a restore procedure that is separately authenticated.

**Request bodies have no server-enforced size limit:**
- Problem: The HTTP data service and webhook runner concatenate each body in memory; several Next routes parse arbitrary JSON directly.
- Files: `services/http-data-service/src/server.mjs`, `services/codex-webhook-runner/src/server.mjs`, `apps/web/app/api/advisor-chat/route.ts`
- Cause: `readRequestBody` buffers until `end`, and route handlers call `request.json()` without route-level maximums.
- Improvement path: Enforce a small `Content-Length`/streaming limit before buffering, reject oversized payloads with 413, and cap nested arrays/strings in request validation.

## Fragile Areas

**Snapshot import and restore:**
- Files: `apps/web/lib/server/data-store.ts`, `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/__tests__/api/admin-data-routes.test.ts`
- Why fragile: Restore replaces all persisted categories at once, includes in-document backup history, and depends on administration endpoints that are not present. A simultaneous write can be lost because restore has no transaction or version guard.
- Safe modification: Implement and test the missing privileged route layer first; use immutable backup identifiers, explicit schema versioning, atomic backend transactions, and a maintenance lock before changing the restore format.
- Test coverage: `apps/web/__tests__/api/admin-data-routes.test.ts` references missing implementation modules, so this high-impact workflow has no executable route coverage in the current tree.

**Public community content controls:**
- Files: `apps/web/app/api/campus-notes/route.ts`, `apps/web/lib/campus-community.ts`, `apps/web/app/api/peer-connections/route.ts`, `apps/web/lib/peer-connections.ts`
- Why fragile: Contact filtering is a narrow regular expression, while public notes include their `author_id`; there is no visible moderation queue, report flow, rate limit, or identity-specific deletion path.
- Safe modification: Add a schema-based moderation state, author-safe public DTOs, rate limits, reporting/removal flows, and adversarial tests for obfuscated contact details and spam.
- Test coverage: Component tests exist for UI primitives, but no route tests cover `apps/web/app/api/campus-notes/route.ts` or `apps/web/app/api/peer-connections/route.ts`.

## Scaling Limits

**Single shared document is the system of record:**
- Current capacity: No bounded collection sizes, pagination limits, transaction isolation, or adapter-level concurrency control are implemented for users, audit events, social records, analytics events, or backups.
- Limit: As records grow, each interaction incurs full-document read/serialization/write cost; concurrent serverless instances or multiple staff users can cause last-write-wins data loss.
- Scaling path: Migrate transactional entities to a relational store, isolate analytical/event data in a stream or warehouse, paginate all list APIs, and use database constraints plus transactional updates.

**Operational reports grow in the tracked repository:**
- Current capacity: Generated reports are committed under `reports/product-ops/`; the tracked report set contains daily files alongside `dynamic-roadmap.md`, `latest.md`, and `autonomous-issues.json`.
- Limit: Daily automation grows repository history and creates noisy merge conflicts without a retention or archival boundary.
- Scaling path: Publish generated reports as workflow artifacts or external issue/project updates, commit only intentional source templates, and add retention/cleanup for `reports/product-ops/`.
- Files: `scripts/autonomous-product-manager.mjs`, `.github/workflows/autonomous-product-manager.yml`, `reports/product-ops/latest.md`

## Dependencies at Risk

**Package-manager and lockfile ambiguity:**
- Risk: The root project declares `npm@10` and CI uses `npm ci`, while pnpm lockfiles and a local `.pnpm-store` directory are also present. Different installation paths can resolve or cache dependencies differently.
- Impact: Local, Vercel, and CI dependency graphs may drift, making reproduction of a successful build less certain.
- Migration plan: Choose npm or pnpm as the supported package manager, retain one authoritative lockfile, remove generated package-manager artifacts from version control, and make Vercel and CI use the same immutable install command.
- Files: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `apps/web/pnpm-lock.yaml`, `vercel.json`, `.github/workflows/ci.yml`

## Missing Critical Features

**Durable, queryable multi-user persistence:**
- Problem: Production data adapters remain full-document JSON/HTTP/blob implementations instead of an atomic, queryable datastore.
- Blocks: Reliable concurrent account activity, bounded growth, privacy-safe analytics, targeted deletion/export, and dependable restore procedures.
- Files: `apps/web/lib/server/data-store.ts`, `services/http-data-service/src/server.mjs`

**Route implementation for the rendered data-operations controls:**
- Problem: The administrator UI exposes export, status, backup, validation, and restore controls without matching route handlers.
- Blocks: Safe monitoring and recovery operations from `apps/web/app/admin/programmes/page.tsx`.
- Files: `apps/web/components/admin/ProgrammeAdminManager.tsx`, `apps/web/app/api/admin/programmes/route.ts`

## Test Coverage Gaps

**Unauthenticated API authorization and abuse controls:**
- What's not tested: No test files reference the advisor, analytics, referral, memory, feed-event, A/B assignment, or simulation-result route handlers.
- Files: `apps/web/app/api/advisor-chat/route.ts`, `apps/web/app/api/analytics/events/route.ts`, `apps/web/app/api/referrals/route.ts`, `apps/web/app/api/memory/route.ts`, `apps/web/app/api/feed-events/route.ts`, `apps/web/app/api/ab-testing/assign/route.ts`, `apps/web/app/api/simulations/results/route.ts`
- Risk: Privacy regressions, arbitrary-user-key access, unbounded payloads, and spend/availability abuse can reach production without route-level tests.
- Priority: High

**External service safeguards:**
- What's not tested: There are no tests for the GitHub webhook runner's startup, fail-closed signature policy, dispatch authentication, malformed payloads, or body limits; the HTTP data service tests do not exercise concurrent writers, recovery from partial writes, or backup retention.
- Files: `services/codex-webhook-runner/src/server.mjs`, `services/http-data-service/src/server.mjs`, `services/http-data-service/test/server.test.mjs`
- Risk: A security-sensitive automation path and primary remote persistence adapter can fail under adversarial or concurrent production conditions.
- Priority: High

---

*Concerns audit: 2026-07-25*
