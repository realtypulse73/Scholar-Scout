---
status: investigating
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

- hypothesis: "The configured Preview Blob-backed data-store can reserve the registration rate-limit but cannot persist a student record, likely because the Preview data-adapter configuration points to an unavailable or incompatible Blob object/store."
- test: "Confirm the Blob client write options preserve the canonical configured pathname used for reads."
- expecting: "A specific non-production configuration correction or a reproducible code fault with regression coverage."
- next_action: "Retry authorized test-account creation against the isolated Preview deployment."

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

## Resolution

- root_cause: "The Blob adapter omitted addRandomSuffix: false, causing Blob's default random-path suffix to break every subsequent exact-path read."
- fix: "Write the document with addRandomSuffix: false and cover it in the existing Blob adapter regression tests."
- prevention: "why not caught: the mocked Blob tests did not assert canonical path retention; guard: assert addRandomSuffix: false for both create and CAS overwrite writes."
