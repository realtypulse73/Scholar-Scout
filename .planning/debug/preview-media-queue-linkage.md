---
status: resolved
trigger: "A Preview-only private contributor-media package reached Ready for review but is absent from the authorized review queue."
created: "2026-10-19T18:29:15-04:00"
updated: "2026-10-19T19:10:00-04:00"
---

# Preview Media Queue Linkage

## Symptoms

- **Expected behavior:** A Ready-for-review private package linked to an approved, current governed candidate appears in Private contributor media review for an authorized reviewer.
- **Actual behavior:** The Preview package remains private and Ready for review but the review queue reports that no packages are ready.
- **Reproduction:** Create a Preview-owner package for the Houston Tillotson pilot, complete upload inspection, approve the matching catalogue candidate, and open the staff review queue.

## Scope and safety constraints

- Repair only Preview-owner linkage for the existing private package and prevent new Ready-for-review packages without a current approved candidate link.
- Do not alter Production behavior, candidate facts, media bytes, credentials, roles, or existing audit history.
- Require the existing exact Preview-owner server policy and revalidate the selected approved candidate in the conditional write.

## Investigation

- `getContributorMediaReviewQueue` currently requires `mediaPackage.programmeId` to equal an approved current candidate ID.
- Upload issuance currently validates only against governed programmes, allowing a Ready-for-review package whose programme ID cannot satisfy the later candidate queue boundary.
- The existing package therefore needs a separately validated candidate link; title matching is not used.

## Resolution

- Added an optional server-owned `candidateId` link to the private package. Existing records remain readable; new packages receive the link only after the exact candidate is current, approved, and governed.
- Added a Preview-only exact-owner reconciliation control. It lists only current approved governed candidates and requires the owner to select the matching record; it cannot use title matching or browser-supplied identity.
- The conditional reconciliation increments the private submission revision and updates its private link only. It does not alter media object keys/bytes, candidate facts, credentials, roles, or audit history.
- Queue, review, and governed-release eligibility now consistently use the validated candidate link while retaining the legacy exact-programme fallback for existing ordinary records.

## Verification

- `pnpm --filter @scholar-scout/web run test -- --runInBand __tests__/lib/server/preview-media-reconciliation.test.ts __tests__/api/preview-owner-media-demo.test.ts __tests__/components/PreviewOwnerMediaDemo.test.tsx __tests__/api/contributor-media.test.ts __tests__/lib/contributor-media.test.ts __tests__/lib/server/catalogue-publications.test.ts` — 73 passing tests.
- `pnpm --filter @scholar-scout/web run typecheck` — passed.
- `pnpm --filter @scholar-scout/web run lint` — passed.

## Follow-up: approved candidate authority

- The live Preview package was intentionally unlinked and the current Huston-Tillotson catalogue candidate had no duplicate `programmeRecords` entry.
- The reconciliation, queue, review, upload-issuance, and learner-safe media retrieval paths had retained a second `getGovernedProgrammes()` gate. That gate hid the valid package despite the candidate's current approval.
- The approved catalogue candidate is now the sole media authority. Its lifecycle, retirement state, and approval revision are rechecked on every relevant path; no package, candidate fact, media object, credential, role, or audit event is migrated or rewritten by this repair.

## Follow-up verification

- `preview-media-reconciliation.test.ts` — 2 passing tests, including a current approved candidate with no duplicate programme record.
- Remaining Preview media, API, component, and catalogue-publication suites — 71 passing tests.
- Typecheck and lint passed. The Vercel-equivalent build compiled successfully before static page generation.
