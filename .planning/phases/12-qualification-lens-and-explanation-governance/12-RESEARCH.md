# Phase 12: Qualification Lens and Explanation Governance - Research

**Researched:** 2026-09-24
**Domain:** Private account qualifications, governed catalogue requirements, and non-predictive explanation/ranking
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Student-controlled qualification record
- **D-01:** Keep structured ordinary qualifications in the student's account and make them editable from both the account area and the programmes page. The structured choices cover diploma/credits, degree, licence, prior work, and voluntary military history. — **Reversibility:** costly — changing the persisted account contract later requires migration, validation, and compatibility handling.
- **D-02:** Include an optional editable free-text qualification note that stays private to the student. It has no staff-sharing, provider-sharing, or administrative-note flow in Phase 12.
- **D-03:** Students may explicitly promote words from their note into visible qualification-keyword choices. The app must not silently interpret free text, infer meaning, or use unconfirmed prose as a ranking signal. — **Reversibility:** costly — the visible keyword-selection boundary protects the account data contract and explanation trust.

### Transparent ordering and explanation
- **D-04:** Offer a student-controlled switch between normal catalogue order and **Qualifications first**. Qualifications-first keeps every opportunity visible and sorts in three transparent levels: (1) most checked published requirements first, descending by the number of checked requirements; (2) student-confirmed keyword connections; then (3) explore-and-verify opportunities with neither kind of connection. Ties remain deterministic.
- **D-05:** A checked item means a student's declared structured qualification corresponds to a published programme requirement; it is never called an official eligibility, admission, enlistment, funding, placement, salary, safety, or outcome decision. Each card must show the specific checked requirements and a direct source-based verification action.
- **D-06:** Keyword connections may use only the student's explicitly confirmed keywords against the reviewed catalogue's attributable requirement or programme-description text. They rank below checked requirements and above options with no connection, and the UI must name them as keyword connections rather than requirements satisfied.
- **D-07:** Missing, stale, unknown, conflicting, or otherwise dated requirements never count as a poor match. Keep them visible with a plain-language **Needs verification** label, source date, and a distinct blue visual treatment that supplements—never replaces—the text state and verification action.

### Plain-language, actionable guidance
- **D-08:** Write the primary lens language at an approximate sixth-grade reading level for every student, without profiling or inferring any student's literacy. Use short statements first and optional expandable detail where it helps without distracting from action.
- **D-09:** When a reviewed source documents an available support, show it beside a not-yet-checked or needs-verification requirement. Otherwise, provide the simple provider-verification action; do not invent availability or turn absent support data into a negative conclusion.

### the agent's Discretion
- Choose the precise account/profile form, note length/bounded keyword vocabulary, exact plain-language labels, card layout, deterministic tie-break, and responsive interaction pattern.
- Reuse the governed reviewed-snapshot, local shortlist, controlled URL, account-validation, source-state, and visible-focus patterns. Add only bounded helpers/components and tests needed for the private qualification lens.

### Deferred Ideas (OUT OF SCOPE)

- A staff-visible or provider-visible note/messaging system is not part of Phase 12; the qualification note remains private to the student.
- Automated interpretation of free text, eligibility decisions, predictive matching, or inference from writing style remains out of scope.
- Sensitive support referral choices remain Phase 14's purpose-specific, non-persistent flow.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| MATCH-01 | Optional student-provided ordinary qualifications highlight published requirements to verify. | Add an account-only, bounded qualification record and source-backed `publishedRequirements` DTO. |
| MATCH-02 | No verdicts and no hidden opportunities. | Make rank a pure three-bucket reordering of the already-filtered snapshot, with a stable ID tie-break. |
| MATCH-03 | Ranked results expose decomposable reasons, verification, support statement, and choice-preserving action. | Reuse fact evidence, direct official links, shortlist, comparison, and a shared explanation DTO on cards/detail/comparison. |
| MATCH-04 | GPA, tests, prestige, ZIP, click/passive behaviour, and proxies cannot rank or hide. | Use a narrow input type and allowlisted route validator; make the sorter accept only qualification record plus snapshot explanation fields; add rejection and invariance tests. |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation; avoid platform churn.
- Extend the whole-document store incrementally with tested compatibility boundaries; do not risk production data.
- Preserve existing in-progress work and validate it rather than overwriting it.
- Keep web code strict TypeScript, server data access under `lib/server`, App Router handlers thin, named exports for domain helpers, and client state in explicit client components.
- Use `@/*` imports, two-space/single-quote source style, labelled native controls, visible focus, and source-backed `NextResponse` route errors.
- For web changes, run `corepack pnpm --filter @scholar-scout/web run lint`, `typecheck`, and Jest with `--runInBand`. [VERIFIED: AGENTS.md]

## Summary

Phase 12 should be a bounded extension of the reviewed-snapshot discovery model, not a new recommendation engine. The current public model deterministically filters a stored reviewed snapshot and then sorts records by public ID; it already preserves evidence, source dates, official verification actions, shortlist, detail, and comparison. [VERIFIED: codebase grep] The phase should first add editorially reviewed requirement/description/support evidence to that snapshot, then derive a serializable explanation DTO from only that evidence and an account-only qualification record. [VERIFIED: codebase grep]

The account record must be separate from onboarding because onboarding deliberately accepts GPA and ordinary preference fields, permits guests, and is mirrored in browser local storage. [VERIFIED: codebase grep] A separate account-only route and `qualificationProfiles` collection avoid importing any prohibited signal into the lens, prevent note persistence in browser storage/URLs, and make the privacy boundary testable. [VERIFIED: codebase grep] The existing conditional whole-document write path already reports `PersistenceConflictError`; reuse that optimistic-conflict behavior rather than silently overwriting a qualification edit. [VERIFIED: codebase grep]

**Primary recommendation:** Implement a pure `qualification-lens` domain module, fed only by a private `QualificationRecord` and reviewed requirement/description evidence, and have it produce the single DTO rendered by overview cards, detail, and comparison. [VERIFIED: codebase grep]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Account qualification record | API / Backend | Database / Storage | Authentication, allowlisting, bounds, and storage-key selection must be server-owned. [CITED: https://nextjs.org/docs/app/guides/authentication] |
| Private form interaction | Browser / Client | API / Backend | Client owns form drafts, live status, focus return, and native controls; it sends only an approved record to the route. [VERIFIED: 12-UI-SPEC.md] |
| Published requirements and support evidence | Database / Storage | API / Backend | Evidence belongs in the reviewed catalogue snapshot and must retain its own source/date/state/action. [VERIFIED: codebase grep] |
| Qualification explanation and three-bucket order | API / Backend | Browser / Client | A pure shared domain mapper makes the data path inspectable; the browser chooses only the transient order control. [VERIFIED: 12-UI-SPEC.md] |
| Cards, detail, and comparison presentation | Browser / Client | Frontend Server (SSR) | Existing components render serializable snapshot models and choice-preserving actions. [VERIFIED: codebase grep] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---:|---|---|
| Next.js App Router | 15.5.15 | Pages, authenticated route handler, dynamic snapshot reads | The repository already uses App Router pages and `route.ts`; Route Handlers use standard Web Request/Response APIs. [VERIFIED: apps/web/package.json] [CITED: https://nextjs.org/docs/app/getting-started/route-handlers] |
| React | 18 | Account form, programme order control, accessible explanation details | The existing catalogue and profile surfaces are React client components. [VERIFIED: apps/web/package.json] |
| TypeScript | 5.x | Finite qualification/evidence unions and pure lens DTO | The web workspace is strict and currently expresses fact states as unions. [VERIFIED: apps/web/tsconfig.json] [VERIFIED: codebase grep] |
| Jest + Testing Library | 30.3.0 / 16.3.2 | Domain, API, and component regression contracts | Existing suites use this configuration for the exact adjacent seams. [VERIFIED: apps/web/package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---:|---|---|
| Existing local `Button`, `Card`, `Badge`, native form controls | repository-local | Form and factual-card presentation | Reuse only existing primitives; the approved UI contract prohibits shadcn and third-party registry blocks. [VERIFIED: 12-UI-SPEC.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Pure finite-string matching | NLP/free-text extraction | Rejected: it would silently interpret the private note and violates D-03. [VERIFIED: 12-CONTEXT.md] |
| Separate account-only qualification profile | Reuse onboarding profile/local storage | Rejected: onboarding accepts GPA, allows guests, and has a browser-storage path that the private note must not enter. [VERIFIED: codebase grep] |
| Snapshot requirement evidence | Learner-time provider fetch/scrape | Rejected: learner discovery is explicitly snapshot-only and must not depend on a live provider. [VERIFIED: 10-CONTEXT.md] |

**Installation:** None. This phase uses the committed workspace dependencies and must not add a package. [VERIFIED: apps/web/package.json]

## Architecture Patterns

### System Architecture Diagram

```text
Account / Programmes form
  -> account-only /api/account/qualifications
  -> exact-key + bounded-value validation
  -> conditional student-record replacement
  -> ScholarScoutData.qualificationProfiles[account:<id>]

Reviewed staff snapshot
  -> publishedRequirements + reviewedDescription + documentedSupport evidence
  -> buildCatalogueDiscoveryModel (filters first, stable public ID normal order)
  -> buildQualificationLensModel(record, reviewed items)
       -> checked current requirements
       -> explicit keyword connections
       -> needs-verification rows
  -> Qualifications-first client order (all filtered records retained)
  -> overview card / detail / comparison render the same explanation DTO
  -> source-specific Verify action and existing save/compare/alternate actions
```

### Recommended Project Structure

```text
apps/web/
├── lib/qualification-record.ts             # finite record types, bounds, parser/normalizer
├── lib/qualification-lens.ts               # pure explanation and stable three-bucket order
├── lib/catalogue-contract.ts                # reviewed requirement/description/support evidence contract
├── lib/server/student-records.ts            # account-qualified get/replace helpers
├── app/api/account/qualifications/route.ts # account-only GET/POST/clear boundary
├── components/qualifications/               # reusable private editor and explanation renderer
└── __tests__/                               # unit, API, storage, and component safety contracts
```

### Pattern 1: Source-first requirements are a separate reviewed collection

**What:** Add `publishedRequirements` to a reviewed record as an ordered collection of text, explicit structured-qualification keys, `FactEvidence`, and optional documented-support text/evidence. Add an attributable `reviewedDescription` field only if it has the same evidence contract. [VERIFIED: codebase grep]

**When to use:** Use it for checked-requirement and keyword explanations; do not attempt to derive requirements from unrelated `skillTaught`, cost, or title fields. The current seven-field `CatalogueOpportunityCardFacts` schema has no requirements, programme description, or support field. [VERIFIED: codebase grep]

**Implementation rule:** A structured qualification can check a requirement only where the reviewed requirement explicitly contains the matching controlled key and its evidence state is `current`. All non-current, missing, or conflicting requirement evidence becomes a `Needs verification` row and never increments the checked count. [VERIFIED: 12-CONTEXT.md]

### Pattern 2: Pure, decomposable lens DTO before rendering

**What:** Keep matching, rank bucket, source/date/state/action, support statement, and copy tokens in a pure module. `CatalogueDiscoveryItem` remains the snapshot model; a `QualificationExplanation` wraps it without exposing the note. [VERIFIED: codebase grep]

**When to use:** Call it after existing filters have already selected `model.items`, then use it unchanged in cards, details, and comparison. [VERIFIED: codebase grep]

**Example:**

```typescript
// Source: repository pattern from apps/web/lib/catalogue-discovery.ts
export function explainQualificationConnection(
  item: CatalogueDiscoveryItem,
  record: QualificationRecord,
): QualificationExplanation {
  // The note is intentionally absent from both parameters used for ranking.
  const checked = item.publishedRequirements.filter((requirement) =>
    requirement.state === 'current' &&
    requirement.qualificationKeys.some((key) => record.structured.includes(key)),
  );
  const keywords = findExplicitKeywordConnections(item, record.keywords);
  return { checked, keywords, verificationRows: getNeedsVerificationRows(item) };
}
```

### Pattern 3: Stable all-visible ordering

**What:** The normal order stays the existing stable public catalogue-ID order. Qualifications-first reorders only the already-filtered list: current checked-requirement count descending, then any explicit keyword connection, then original position/ID ascending. [VERIFIED: 12-UI-SPEC.md] [VERIFIED: codebase grep]

**Example:**

```typescript
// Source: repository stable-order pattern from apps/web/lib/catalogue-discovery.ts
export function orderQualificationsFirst(items: QualificationLensItem[]) {
  return [...items].sort((left, right) =>
    right.explanation.checkedRequirements.length - left.explanation.checkedRequirements.length ||
    Number(right.explanation.keywordConnections.length > 0) -
      Number(left.explanation.keywordConnections.length > 0) ||
    left.item.id.localeCompare(right.item.id),
  );
}
```

### Anti-Patterns to Avoid

- **Using `preference-matching.ts`:** It scores GPA, affordability, support, access, and onboarding preferences, and it serializes onboarding data to browser storage. It is not a legal dependency for this lens. [VERIFIED: codebase grep]
- **Passing the note into a mapper, card prop, analytics event, URL, or local storage:** Its privacy rule is easier to prove when the explanation type has no note property. [VERIFIED: 12-UI-SPEC.md]
- **Treating non-current requirements as unmatched:** The only valid presentation is text/icon/date/action `Needs verification`, not a negative count, lower bucket, warning colour, or inferred absence. [VERIFIED: 12-CONTEXT.md] [VERIFIED: 12-UI-SPEC.md]
- **Adding an unconstrained text-search match:** Keyword connections require student-selected terms and attributable reviewed text; literal case-folded whole-token matching is the recommended bounded implementation. [ASSUMED]

## Data Model and Migration Strategy

The current persisted document stores `onboardingProfiles`, shortlists, programme records, audit events, and catalogue publication state. [VERIFIED: codebase grep] It normalizes old documents by applying defaults, so an omitted new collection can be added as `{}` without rewriting existing accounts. [VERIFIED: codebase grep] Current snapshot validation only checks that `onboardingProfiles` is an object, so Phase 12 must add a dedicated `qualificationProfiles` normalizer and validation path rather than casting untrusted persisted values. [VERIFIED: codebase grep]

| Need | Current limitation | Prescriptive change |
|---|---|---|
| Private qualifications | Onboarding profile contains GPA and browser-local serialization; it is guest-capable. [VERIFIED: codebase grep] | Add `qualificationProfiles: Record<string, QualificationRecord>` beside onboarding profiles, keyed only by `account:<session user id>`. |
| Published requirements | `CatalogueOpportunityCardFacts` has location, pathway, skill, payer, cost, duration, delivery only. [VERIFIED: codebase grep] | Extend governed candidate/published snapshot contracts with requirement evidence and optional reviewed description/support evidence. |
| Source-derived explanations | Current `reasonsToConsider` only derives skill, delivery, payer. [VERIFIED: codebase grep] | Add a separate `qualificationExplanation` DTO; do not overload general factual reasons. |
| Stale/missing state | Fact statuses already support current, needs-confirmation, unknown, conflicting. [VERIFIED: codebase grep] | Map every non-current or unavailable requirement state to the UI's blue textual `Needs verification` row with evidence/action. |
| Conflict-safe edits | Student writes use a versioned whole-document conditional write and surface `PersistenceConflictError`. [VERIFIED: codebase grep] | Reuse the same get/replace route/service pattern; return the documented 409 reload response and preserve client draft. |

**Recommended record contract:** `structured: QualificationKind[]`, `note: string`, and `keywords: string[]`. `QualificationKind` is a finite union for the five approved groups; use no GPA, score, test, prestige, ZIP, residence, sensitive/referral, behavioural, or provider fields. [VERIFIED: 12-CONTEXT.md] Apply the UI-approved limits: note at most 500 characters, at most 12 keywords, each at most 40 characters; trim/collapse whitespace and deduplicate keywords deterministically. [VERIFIED: 12-UI-SPEC.md]

**Migration:** Do not run a data rewrite. Make the field absent-compatible (`{}` after normalization), preserve it in import/backup/restore cloning, and add tests reading a legacy document with no qualification collection. [VERIFIED: codebase grep] Because the record is account-only, do not add it to `migrateGuestOwnedRecords`; that existing allowlist transfers onboarding, shortlist, and other prior guest collections. [VERIFIED: codebase grep]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Qualification interpretation | NLP, embeddings, note parser, autocomplete, inferred synonyms | Explicit structured keys and student-added literal keyword connections | D-03 prohibits silent interpretation and preserves an auditable explanation boundary. [VERIFIED: 12-CONTEXT.md] |
| Eligibility logic | Admissions/eligibility classifier or a score | Checked requirement plus `Verify` action | A checked item is expressly not an official decision or outcome claim. [VERIFIED: 12-CONTEXT.md] |
| Catalogue data source | Live provider call or scrape | Existing published reviewed snapshot | Learner reads must not depend on a live provider. [VERIFIED: 10-CONTEXT.md] |
| Private storage | Browser local storage, URL state, staff/provider note channel | Account-only server record, owner-scoped route | UI contract forbids note/keyword exposure in those surfaces. [VERIFIED: 12-UI-SPEC.md] |
| Concurrent writes | Last-write-wins retry | Existing conditional-write + reload conflict | Existing store adapters map version races to `PersistenceConflictError`. [VERIFIED: codebase grep] |

**Key insight:** The feature is a transparent lookup over reviewed evidence, not a model of the student. That means its only personal inputs must be explicitly selected finite values, and its only output must preserve source-backed facts plus a next action. [VERIFIED: 12-CONTEXT.md] [VERIFIED: docs/product-recommendation-governance.md]

## Common Pitfalls

### Pitfall 1: Extending onboarding instead of creating a purpose-separated record

**What goes wrong:** GPA/support/preference values or guest/local-storage behavior leak into the new sort. [VERIFIED: codebase grep]

**How to avoid:** Create an independent `QualificationRecord`, a distinct account-only route, and an explanation function whose TypeScript inputs cannot accept `OnboardingData`. [VERIFIED: codebase grep]

### Pitfall 2: Missing requirement evidence masquerades as an unchecked qualification

**What goes wrong:** A stale, unknown, conflicting, or absent published fact pushes an option down or implies a student lacks something. [VERIFIED: 12-CONTEXT.md]

**How to avoid:** Classify those rows before counting; display the approved text/icon/date/action `Needs verification` treatment and retain the record in the all-visible list. [VERIFIED: 12-UI-SPEC.md]

### Pitfall 3: Reordering becomes filtering

**What goes wrong:** Mapping only connected items or returning `checked.concat(keyword)` silently removes exploratory records. [VERIFIED: 12-CONTEXT.md]

**How to avoid:** Sort a copy of every already-filtered `model.items` and regression-test the same ID set/count before and after lens order. [VERIFIED: codebase grep]

### Pitfall 4: A note reaches an observable surface

**What goes wrong:** A convenience prop, an error/audit payload, local draft, route query, or source match exposes private prose. [VERIFIED: 12-UI-SPEC.md]

**How to avoid:** Exclude `note` from lens DTOs and form-to-card props; use generic audit actions only; reject extra route keys; assert serialized responses/cards/URLs/analytics fixtures contain no note. [VERIFIED: codebase grep]

### Pitfall 5: The snapshot cannot actually support the promised explanation

**What goes wrong:** Planner implements UI copy against `skillTaught` or title because no explicit requirements/description/support record exists. [VERIFIED: codebase grep]

**How to avoid:** Establish and test the new reviewed requirement evidence contract before building the account UI or ordering layer. [VERIFIED: codebase grep]

## Runtime State Inventory

Not included: this is an additive, backward-compatible feature rather than a rename, refactor, or migration phase.

## Code Examples

### Owner-scoped route boundary

```typescript
// Source: apps/web/app/api/account/onboarding/route.ts and Next.js authentication guide
export async function POST(request: Request) {
  const actor = await resolveStudentActor({ allowGuest: false });
  if (!actor || actor.kind !== 'account') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await parseJsonRequest(request, {
    maxBytes: MAX_QUALIFICATION_REQUEST_BYTES,
    validate: validateQualificationRecord,
  });
  if (!body.ok) return NextResponse.json({ error: 'Invalid qualifications.' }, { status: 400 });
  await replaceStudentQualificationRecord(actor.storageKey, body.value);
  return NextResponse.json({ ok: true });
}
```

Route Handlers must validate untrusted request data and verify authorization for protected resources. [CITED: https://nextjs.org/docs/app/guides/backend-for-frontend] [CITED: https://nextjs.org/docs/app/guides/authentication]

### Evidence-preserving needs-verification row

```typescript
// Source: FactEvidence pattern in apps/web/lib/catalogue-contract.ts
const needsVerification = requirement.state !== 'current' || !requirement.text;
return {
  kind: needsVerification ? 'needs-verification' : 'unchecked',
  label: needsVerification ? 'Needs verification' : requirement.text,
  sourceLabel: requirement.evidence.sourceLabel,
  sourceDate: requirement.evidence.sourceDate,
  verificationUrl: requirement.evidence.sourceUrl,
  verificationAction: requirement.evidence.verificationAction,
};
```

The catalogue's existing `FactEvidence` already preserves a fact's source label, URL, source date, review date, status, and verification action. [VERIFIED: codebase grep]

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Legacy programme matching scored onboarding GPA/access, preferences, and support, and stored the onboarding profile locally. [VERIFIED: codebase grep] | Phase 11 discovery uses a stored reviewed snapshot, controlled filters, evidence-preserving reasons, and stable public-ID order. [VERIFIED: codebase grep] | Phase 12 must extend the Phase 11 governed path rather than reconnecting the legacy matching pipeline. |
| Generic factual-card verification statuses. [VERIFIED: codebase grep] | Dedicated blue, textual `Needs verification` state for requirement evidence. [VERIFIED: 12-UI-SPEC.md] | Requirement uncertainty remains actionable without becoming a negative student judgement. |

**Deprecated/outdated for this phase:** `preference-matching.ts` and `ProgrammeResults.tsx` are legacy profile-ranking surfaces, not a safe source for qualification ordering because their input/score includes prohibited signals. [VERIFIED: codebase grep]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Literal case-folded whole-token matching is the preferred keyword algorithm. | Architecture Patterns | Different language/tokenization needs may require a reviewed locale rule; no NLP should be substituted. |
| A2 | The finite values inside each of the five qualification groups can be finalized during planning without a product decision beyond the locked group names. | Data Model | Values that are too broad could overstate a checked requirement; values that are too narrow could reduce useful highlighting. |

## Open Questions

1. **RESOLVED — Exact controlled qualification vocabulary.**
   - Use these eight stable keys: high-school-diploma, postsecondary-credits, associate-degree, bachelor-degree, graduate-degree, professional-licence, prior-relevant-work, and voluntary-military-service.
   - The first five terms implement D-01's diploma/credits and degree groups; the final three implement licence, prior work, and voluntary military history. A student selects only these literals and a published requirement may claim a checked connection only through the same literal. No grade, school, employer, duration, score, location, sensitive circumstance, synonym, or free-text structured value is accepted.
   - This is the deliberately bounded vocabulary selected under the user's granted engineering discretion. It keeps D-03 literal and auditable and prevents a broad declaration from implying an unstated requirement.

2. **RESOLVED — Existing governed candidate/import authoring path.**
   - Extend CatalogueCandidateInput and the existing schema-versioned private JSON import consumed by importCatalogueCandidates with ordered publishedRequirements, optional reviewedDescription, and optional documentedSupport evidence.
   - Staff continue to use the current CataloguePublicationManager Stage private import, submit, independent review, and release workflow. The implementation updates its existing JSON guidance and the curated publication runbook; it adds no staff page, role, route, or learner-time provider request.
   - Every new authored fact carries the existing FactEvidence contract and passes current candidate validation, review, and published-snapshot guards. Reviewed fixtures stage, approve, and publish the fields before the learner lens reads them.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Next.js build/test runtime | ✓ | v24.19.0 | — |
| npm | workspace metadata/registry inspection | ✓ | 11.17.0 | — |
| Corepack | project package-manager selection | ✓ | 0.35.0 | — |
| pnpm | web test/lint/typecheck commands | ✗ in this sandbox | Corepack invocation failed with a sandbox filesystem permission error | Run the committed Corepack command in the normal project execution host. |

**Missing dependencies with no fallback:** None for implementation; all required runtime libraries are committed. [VERIFIED: apps/web/package.json]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 30.3.0 with Testing Library and `next/jest` [VERIFIED: apps/web/package.json] |
| Config file | `apps/web/jest.config.ts` [VERIFIED: apps/web/jest.config.ts] |
| Quick run command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand qualification` |
| Full suite command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| MATCH-01 | Account-only bounded record, reviewed requirement mapping, editable from account/programmes | unit + API + component | focused Jest qualification suites | ❌ Wave 0 |
| MATCH-02 | No verdict vocabulary; all filtered IDs retained across both orders | unit + component | focused Jest lens/discovery suites | ❌ Wave 0 |
| MATCH-03 | Shared explanation carries checked names, evidence/date/action, support statement, and choice actions on all three surfaces | unit + component | focused Jest lens/card/detail/comparison suites | ❌ Wave 0 |
| MATCH-04 | Route rejects prohibited/extra inputs; forbidden inputs cannot affect order/visibility | unit + API regression | focused Jest record/lens/route suites | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `corepack pnpm --filter @scholar-scout/web test -- --runInBand` for changed named suites, plus typecheck where domain types move. [VERIFIED: AGENTS.md]
- **Per wave merge:** `corepack pnpm --filter @scholar-scout/web run lint`, `typecheck`, and full Jest. [VERIFIED: AGENTS.md]
- **Phase gate:** Full suite green plus the Phase 11 responsive keyboard/screen-reader/narrow-width browser acceptance extended with the qualification form and blue verification rows. [VERIFIED: 11-VERIFICATION.md]

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/qualification-record.test.ts` — exact-key parsing, bounds, note privacy, prohibited-key rejection, legacy normalization.
- [ ] `apps/web/__tests__/lib/qualification-lens.test.ts` — source mapping, deterministic buckets, tie stability, all-ID preservation, stale/unknown/conflicting handling, keyword-only boundary.
- [ ] `apps/web/__tests__/api/account-qualification-routes.test.ts` — account-only ownership, unauthorized/guest denial, payload limits, 400/409 behavior, no owner override.
- [ ] `apps/web/__tests__/components/QualificationRecordForm.test.tsx` — native labels, save/clear confirmation, focus return, live status, note/key limits, no automatic keyword extraction.
- [ ] Extend catalogue discovery/card/focus/comparison tests — same explanation DTO, source/date/action, documented-support-only copy, choice actions, responsive long-text contracts.
- [ ] Extend data-store/student-records tests — absent legacy collection, conditional conflict, account isolation, no guest migration, audit records contain no note/keyword value.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | Yes | Resolve the trusted server session before reading/writing a qualification record. [CITED: https://nextjs.org/docs/app/guides/authentication] |
| V3 Session Management | Yes | Use the existing HttpOnly server-resolved account actor; never accept a client-selected storage key. [VERIFIED: codebase grep] |
| V4 Access Control | Yes | Account-only route reads/writes only `account:<session id>` and denies guest/cross-account object access. OWASP requires trusted-service access control and protection from create/read/update/delete object attacks. [CITED: https://wiki.owasp.org/images/d/d4/OWASP_Application_Security_Verification_Standard_4.0-en.pdf] |
| V5 Input Validation | Yes | Bounded body reader, exact-key object validator, finite unions, note/keyword limits, and explicit rejection of prohibited keys. [VERIFIED: codebase grep] |
| V6 Cryptography | No new control | Reuse existing authenticated transport/session/storage controls; do not hand-roll encryption in this phase. [ASSUMED] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Cross-account qualification read/write | Information disclosure / Tampering | Resolve identity server-side and never accept account/storage identifiers in JSON. [VERIFIED: codebase grep] |
| Note leaking to client-visible unrelated surfaces | Information disclosure | Note-free lens DTO, no URL/local storage/analytics/staff/provider prop, and serialization tests. [VERIFIED: 12-UI-SPEC.md] |
| Mass assignment of GPA, tests, ZIP, sensitive/referral, or ranking score | Tampering | Exact-key validator and a domain type that contains only five qualification groups, note, and keywords. [VERIFIED: codebase grep] |
| Stale fact treated as a negative | Tampering / Integrity | Preserve `FactEvidence` and force blue textual `Needs verification` with a direct action. [VERIFIED: 12-UI-SPEC.md] |
| Hidden-option bug in sorting | Integrity | Unit-test result ID-set equality and stable fallback ordering for every qualification state. [VERIFIED: 12-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `12-CONTEXT.md` — locked privacy, ordering, claim, and uncertainty decisions. [VERIFIED: 12-CONTEXT.md]
- `12-UI-SPEC.md` — approved controls, copy, limits, responsive/accessibility contract, and prohibited UI leakage. [VERIFIED: 12-UI-SPEC.md]
- `apps/web/lib/catalogue-contract.ts`, `catalogue-discovery.ts`, `catalogue-publication.ts` — actual snapshot/evidence schema and discovery model. [VERIFIED: codebase grep]
- `apps/web/lib/server/data-store.ts`, `student-records.ts`, `student-actor.ts` — persistence, conflict, owner-key, and legacy-normalization boundaries. [VERIFIED: codebase grep]
- `docs/product-recommendation-governance.md` — non-predictive explanation and prohibited-signal policy. [VERIFIED: docs/product-recommendation-governance.md]

### Secondary (MEDIUM confidence)

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — App Router route-handler contract. [CITED: https://nextjs.org/docs/app/getting-started/route-handlers]
- [Next.js Backend for Frontend guide](https://nextjs.org/docs/app/guides/backend-for-frontend) — request validation, protected-resource handling, and response/log minimization. [CITED: https://nextjs.org/docs/app/guides/backend-for-frontend]
- [OWASP ASVS](https://owasp.org/projects/asvs) and [ASVS access-control requirements](https://wiki.owasp.org/images/d/d4/OWASP_Application_Security_Verification_Standard_4.0-en.pdf) — Level 1 security verification framing. [CITED: https://owasp.org/projects/asvs]

### Tertiary (LOW confidence)

- Literal whole-token keyword matching recommendation; validate with product before locking locale behavior. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies and versions are committed in the workspace. [VERIFIED: apps/web/package.json]
- Architecture: HIGH — snapshot, persistence, actor, and presentation seams were inspected directly. [VERIFIED: codebase grep]
- Pitfalls: HIGH — derived from locked phase/UI governance and the inspected legacy matching path. [VERIFIED: 12-CONTEXT.md] [VERIFIED: codebase grep]

**Research date:** 2026-09-24
**Valid until:** 2026-10-24
