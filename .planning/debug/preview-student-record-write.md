---
status: verified
trigger: "Preview-only durable student-record persistence fails during authorized non-production account creation."
created: 2026-08-29
updated: 2026-08-29
---

## Symptoms

- expected: "A generated non-production student and staff identity can register and authenticate on the isolated Preview deployment so the Phase 5 report/moderation and shared-quota UAT checks can run."
- actual: "Each browser registration reaches POST /api/register but the client displays its safe generic creation error. A follow-up credentials exchange returns no account found, confirming no student record was persisted."
- error_messages: "Unable to create account. Please review your details and try again."
- timeline: "Observed during Phase 5 Preview UAT on 2026-08-29; public/source-link checks work, while the authorized account setup does not."
- reproduction: "On the protected Vercel Preview deployment, submit a valid generated non-personal name, email, and password through /auth/sign-up."

## Current Focus

reasoning_checkpoint:
  hypothesis: "The Blob adapter uses a data-plane GET ETag as ifMatch, but Vercel Preview can serve that data-plane ETag stale relative to the Blob control-plane conditional-write version; using head() for the version fixes stable CAS conflicts. Separately, server-authorized staff pages need force-dynamic so their mandatory audit write never executes during a build."
  confirming_evidence:
    - "A Preview audit append exhausted both CAS attempts after more than 70 seconds with no concurrent writes."
    - "The SDK exposes head() metadata ETags for conditional writes, while the adapter currently derives the version only from get()."
    - "The new Blob regression test fails because head() is not called; the rendering-boundary test fails because all three protected pages export no dynamic setting."
  falsification_test: "After the change, focused adapter tests must show head() supplies ifMatch and focused page tests must show force-dynamic; the production build must complete without stored-data access during prerendering."
  fix_rationale: "The adapter will pair ifMatch with the authoritative metadata-plane ETag, and the pages that execute request authorization/audit logic will be request-rendered rather than prerendered."
  blind_spots: "A live Preview retry is still required to prove the provider accepts the head ETag and that no external writer is racing the document."
  candidate_causes:
    - "code: data-store.ts derives conditional-write version from get() rather than head()."
    - "environment: Preview Blob's data-plane/cache path can return an ETag that differs from the control-plane write precondition version."
    - "code: protected server pages lack an explicit Next dynamic-rendering boundary."
  and_gate: "no — the CAS conflict is fully explained by the stale data-plane version; force-dynamic is an independent build-compatibility boundary required to safely deploy the corrective head probe."
next_action: "Use an already Vercel-authorized browser session to register the generated allowlisted staff account on the Ready isolated Preview, sign in, and request /admin/community-moderation; HTTP clients without Vercel protection authorization are stopped before the app."

## Evidence

- timestamp: 2026-08-29
  observation: "Vercel lists BLOB_READ_WRITE_TOKEN, SCHOLARSCOUT_BLOB_DATA_PATH, SCHOLARSCOUT_DATA_ADAPTER, NEXTAUTH values, and Upstash variables for Preview; values were not read."
- timestamp: 2026-08-29
  observation: "Registration did not return the route's 503 unavailable response, so the trusted Vercel IP and Upstash reservation boundary were available before createUser ran."
- timestamp: 2026-08-29
  observation: "createUser delegates to createStudentAccountRecord, which reads and conditionally writes the full Blob-backed document and surfaces its failure only through the route's intentionally generic safe 400."
- timestamp: 2026-08-29
  observation: "@vercel/blob defaults addRandomSuffix to true. The adapter wrote without disabling that default while all reads use the exact configured pathname, so a successful create wrote an unreadable suffixed object."
- timestamp: 2026-08-29
  observation: "The adapter now passes addRandomSuffix: false for canonical CAS document writes. The focused data-store suite passed (30 tests)."
- timestamp: 2026-08-29
  observation: "An isolated Preview deployment is Ready at https://scholar-scout-abnu21uxg-scholar-scout.vercel.app with only a fresh non-production Blob pathname and generated staff-test allowlist supplied as deployment overrides."
- timestamp: 2026-08-29
  observation: "Both generated Preview accounts now persist and the staff allowlist is recognized. A read-only GET /admin/community-moderation instead deterministically reaches requireActiveStaff and exhausts the two permitted CAS attempts while appending its privacy-minimal authorization audit."
- timestamp: 2026-08-29
  observation: "The resulting PersistenceConflictError proves BlobPreconditionFailedError is recognized and mapped correctly; it is not an authentication failure or a provider credential/configuration absence. Vercel logs expose only the GET request, not provider details."
- timestamp: 2026-08-29
  observation: "The installed SDK documents get(..., { useCache: false }) as an origin read, and conditional writes with a get/head ETag as supported. This leaves concurrent whole-document writes immediately after account sign-in as the leading explanation for the bounded audit-append conflict."
- timestamp: 2026-08-29
  observation: "A fresh isolated-browser student sign-in succeeded and rendered the generated student profile, proving the Blob document is readable after session creation. A retry after more than 70 seconds with no Preview writes still exhausted the audit append's two CAS attempts, eliminating post-login contention and missing-record hypotheses."
- timestamp: 2026-08-29
  observation: "A fail-closed probe to cross-check get ETags with Blob head metadata passed local tests but caused Preview build-time stored-data unavailability while prerendering protected admin pages. It was reverted and not deployed; head metadata is therefore not compatible with this current Vercel build environment."
- timestamp: 2026-08-29
  observation: "Local @vercel/blob source confirms get(..., { useCache: false }) reads the private data-plane object with cache=0, while head(pathname, { token }) resolves control-plane metadata including the ETag documented for conditional writes. The three server-authorized pages (/admin/ops, /admin/feed, and /admin/community-moderation) have no explicit dynamic rendering declaration."
- timestamp: 2026-08-29
  observation: "The first focused-test attempt was rejected before Jest started because the active shell provides Node 24.19.0 and pnpm 11.19.0, while the repository pins Node 20.x and pnpm 10.34.5. No application test result was produced."
- timestamp: 2026-08-29
  observation: "Using the compatible Node 20.20.2 runtime directly, the data-store suite ran: 29 tests passed and the new control-plane-version test failed exactly because head() was never called. This confirms the current adapter sends the data-plane GET ETag to ifMatch."
- timestamp: 2026-08-29
  observation: "The staff-page boundary suite failed all three assertions because /admin/community-moderation, /admin/feed, and /admin/ops currently export no dynamic rendering setting."
- timestamp: 2026-08-29
  observation: "After the scoped change, the focused Blob adapter and staff-page boundary suites both pass: 33 tests total. The adapter now passes the control-plane head() ETag to ifMatch, and all three request-authorized staff pages explicitly export force-dynamic."
- timestamp: 2026-08-29
  observation: "Controlled revert of only the added head() and force-dynamic source hunks made the agent-authored focused suites fail four assertions (one Blob ETag assertion and three rendering-boundary assertions), while the other 29 data-store assertions still passed."
- timestamp: 2026-08-29
  observation: "After reapplying the exact hunks, the focused suites pass again (33 tests). Adjacent authorization suites pass (18 tests), TypeScript and ESLint complete without findings, and the local Next production build compiles successfully and completes its lint/type-validation phase without build-time stored-data access."
- timestamp: 2026-08-29
  observation: "Verified repair committed locally as a3785be. Vercel CLI is authenticated, but this checkout has no .vercel project link; an unlinked deployment listing for scholar-scout returned a provider 500. No deployment or environment value was changed or read."
- timestamp: 2026-08-29
  observation: "Vercel team metadata lists two accessible projects, web and scholar-scout-web. The initial scholar-scout project name was not found; no deployment was created."
- timestamp: 2026-08-29
  observation: "The existing isolated Preview URL belongs to scholar-scout-web and is Ready. Its Preview environment has the durable adapter and authentication variable names configured. The former deployment-specific Blob pathname and staff-test allowlist cannot be safely reused because their values are unavailable; the local process contains none of those values."
- timestamp: 2026-08-29
  observation: "The first new Preview deployment request was rejected before a deployment was created because Vercel disallows arbitrary metadata keys. No runtime configuration or provider data changed."
- timestamp: 2026-08-29
  observation: "A new generated-override Preview deployment was created and reached Ready at https://scholar-scout-h8kre7r5c-scholar-scout.vercel.app. Its generated identity was not returned after the remote-build stream, so it cannot be reused safely for authenticated UAT. The available in-app browser has no connection in this session, requiring an HTTP-only UAT fallback."
- timestamp: 2026-08-29
  observation: "Final isolated Preview deployment dpl_BJnTkpxszPn33auTeNRnGxyZRoY4 is Ready at https://scholar-scout-l5qnvw9kd-scholar-scout.vercel.app in iad1, using a fresh Blob pathname and deterministic generated staff allowlist override. The HTTP UAT registration request received 401 before reaching the application, because this Preview is deployment-protected; no account, adapter, or production data was changed."
- timestamp: 2026-08-29
  observation: "In the authorized in-app browser, generated Preview student and allowlisted staff accounts authenticated successfully. A generated student note was reported; the staff moderation queue rendered the pending note and restored it successfully, without PersistenceConflictError. This verifies the repaired Preview persistence/CAS boundary under the intended authenticated write and staff-audit path."

## Resolution

- root_cause: "The Blob adapter derives its CAS ifMatch version from the data-plane get() response rather than Blob's control-plane head() metadata, allowing a stable stale ETag conflict in Preview. The protected server pages also lack an explicit dynamic-rendering boundary, so the necessary head probe can run their authorization audit during prerendering."
- fix: "Use head() for the Blob snapshot version after a successful get(), and force only /admin/community-moderation, /admin/feed, and /admin/ops to render dynamically."
- prevention: |
    why not caught: the Blob adapter test asserted the data-plane get() ETag but did not distinguish it from the documented control-plane conditional-write ETag, and staff pages had no regression contract against prerendering;
    guard: data-store.test.ts asserts head() supplies ifMatch and admin-runtime-boundaries.test.ts asserts force-dynamic for all request-authorized pages.
- verification: |
    target_test: { result: pass, suites_run: ["__tests__/lib/data-store.test.ts", "__tests__/api/admin-runtime-boundaries.test.ts"], assertions: 33 }
    mutation_check: { result: skipped, reason_if_skipped: "No Stryker dependency or configuration exists in the workspace." }
    no_op_deletion: { result: pass, deletion_justified_by_rca: false, evidence: "Diff adds authoritative metadata lookup, dynamic boundaries, and regression assertions; no behavior is removed or short-circuited." }
    adjacent_tests: { result: pass, suites_run: ["__tests__/api/decision-boundary.test.ts", "__tests__/api/active-staff.test.ts", "__tests__/api/community-moderation.test.ts"], assertions: 18, typecheck: pass, lint: pass, production_build: pass }
    revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, evidence: "Reverting only the new source hunks failed the four new assertions; restoring them passed all 33 focused assertions." }
    guardrail_verdict: accepted
