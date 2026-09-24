# Phase 12: Qualification Lens and Explanation Governance - Pattern Map

**Mapped:** 2026-09-24  
**Files analysed:** 23 planned new/modified files  
**Analogs found:** 23 / 23

## File Classification

| New/Modified File | Role | Data flow | Closest analog | Match quality |
|---|---|---|---|---|
| `apps/web/lib/qualification-record.ts` | model/utility | transform | `lib/onboarding-types.ts`, `lib/onboarding-validation.ts` | role-match (must exclude onboarding fields) |
| `apps/web/lib/qualification-lens.ts` | utility | transform | `lib/catalogue-discovery.ts` | exact |
| `apps/web/lib/catalogue-contract.ts` | model/validation | transform | same file's `FactEvidence`/card-facts contract | exact extension |
| `apps/web/lib/catalogue-publication.ts` | model/validation | CRUD | same file's candidate/published contract | exact extension |
| `apps/web/lib/catalogue-discovery.ts` | service/mapper | transform | same file's snapshot mapper | exact extension |
| `apps/web/lib/server/data-store.ts` | persistence model/config | CRUD | same file's optional collections and normalizers | exact extension |
| `apps/web/lib/server/student-records.ts` | service | CRUD | `replaceStudentOnboardingProfile` | exact mechanics; distinct collection |
| `apps/web/app/api/account/qualifications/route.ts` | route | request-response | `api/account/onboarding/route.ts` | exact mechanics; account-only guard |
| `apps/web/components/qualifications/QualificationRecordForm.tsx` | client component | request-response | `components/profile/ProfileDashboard.tsx` + `OnboardingWizard.tsx` | role-match; do **not** copy local storage |
| `apps/web/components/qualifications/QualificationExplanation.tsx` | component | transform/render | `CatalogueOpportunityCard.tsx` `Fact`/reason regions | exact evidence-rendering seam |
| `apps/web/components/profile/ProfileDashboard.tsx` | component | request-response | same file | exact extension |
| `apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx` | component/controller | event-driven | same overview and `CatalogueComparison.tsx` | exact extension |
| `apps/web/components/catalogue/CatalogueOpportunityCard.tsx` | component | transform/render | same card | exact extension |
| `apps/web/components/catalogue/CatalogueFocusView.tsx` | component | transform/render | same detail view | exact extension |
| `apps/web/components/catalogue/CatalogueComparison.tsx` | component | transform/render | same comparison card | exact extension |
| `apps/web/app/programmes/page.tsx` | server page | request-response | same page | exact |
| `apps/web/app/programmes/[id]/page.tsx` | server page | request-response | same page | exact |
| `apps/web/app/shortlist/page.tsx` | server page | request-response | same page | exact |
| `apps/web/__tests__/lib/qualification-record.test.ts` | test | transform | `__tests__/lib/student-records.test.ts` | role-match |
| `apps/web/__tests__/lib/qualification-lens.test.ts` | test | transform | `__tests__/lib/catalogue-discovery.test.ts` | exact pure-mapper convention |
| `apps/web/__tests__/api/account-qualification-routes.test.ts` | test | request-response | `__tests__/api/account-guest-routes.test.ts` | role-match; reverse guest expectation |
| `apps/web/__tests__/components/QualificationRecordForm.test.tsx` | test | event-driven | `__tests__/components/OnboardingWizard.test.tsx` | role-match |
| existing catalogue/store tests | test | transform/request-response | discovery, card, focus, comparison, student-records tests | exact extensions |

## Pattern Assignments

### `apps/web/lib/qualification-record.ts` (model/utility, transform)

**Analogs:** `apps/web/lib/onboarding-types.ts`, `apps/web/lib/onboarding-validation.ts`.

Copy the finite-union and allowlist arrangement, but make a new independent type. `OnboardingData` contains GPA and is therefore prohibited from this module's input or exports.

**Finite values and type derivation** — `onboarding-types.ts` lines 58-66:

```ts
export const ORDINARY_SUPPORT_CATEGORIES = [
  'financial-aid',
  'first-gen',
  'tutoring',
  'career-counseling',
] as const;

export type OrdinarySupportCategory =
  (typeof ORDINARY_SUPPORT_CATEGORIES)[number];
```

**Allowlist normalization** — `onboarding-types.ts` lines 107-117:

```ts
export function normalizeOrdinarySupportPreferences(
  values: readonly unknown[],
): OrdinarySupportCategory[] {
  return Array.from(
    new Set(values.filter(isOrdinarySupportCategory)),
  );
}
```

Apply the same deterministic normalizer to the five controlled qualification keys and keywords (trim/collapse whitespace, deduplicate); bound `note` to 500, keyword count to 12, and keyword length to 40. Keep `note` only in `QualificationRecord`; the lens input/DTO must not expose it.

### `apps/web/lib/qualification-lens.ts` (utility, transform)

**Analog:** `apps/web/lib/catalogue-discovery.ts`.

Build a pure named-export mapper after discovery filtering. Follow the stable-copy sort and source-preserving shape; do not mutate `model.items` or use query parameters, local storage, `OnboardingData`, score, or behavioural inputs.

**Stable normal order before filtering** — `catalogue-discovery.ts` lines 129-153:

```ts
const selectedMetro = records.filter((record) => record.regionId === filters.metro)
  .map((record) => mapPublishedRecord(record, now))
  .sort((left, right) => left.id.localeCompare(right.id));
const items = selectedMetro.filter((item) => matchesFilters(item, filters));
// ... canonicalHref contains only controlled public filters
```

**Evidence-preserving fact mapping** — `catalogue-discovery.ts` lines 216-225:

```ts
function mapFact<Value>(fact: CatalogueCardFact<Value>): CatalogueDiscoveryFact<Value> {
  return { value: fact.value ?? null, state: 'state' in fact ? fact.state : fact.evidence.status, evidence: fact.evidence };
}
```

The lens should produce a serializable `QualificationExplanation` with `checkedRequirements`, `keywordConnections`, and `needsVerificationRows`; no `note` field. Sort a copy of every already-filtered item by checked-current count descending, explicit-keyword presence, then `item.id.localeCompare`. Test ID-set equality in both orders.

### `apps/web/lib/catalogue-contract.ts` and `apps/web/lib/catalogue-publication.ts` (model/validation, transform/CRUD)

**Analogs:** their existing `FactEvidence`, `CatalogueOpportunityCardFacts`, and candidate/published-record contract.

Add source-reviewed requirement evidence as a separate contract (ordered requirement text, controlled qualification keys, `FactEvidence`, optional reviewed description/support evidence). Do not derive a requirement from `skillTaught`, title, or unreviewed prose.

**Reusable evidence contract** — `catalogue-contract.ts` lines 56-71:

```ts
export interface FactEvidence {
  status: FactStatus;
  authority: FactAuthority;
  sourceLabel: string;
  sourceUrl: string;
  sourceDate: SourceDate;
  reviewedAt: string;
  verificationAction: string;
}

export interface SourcedFact<Value> {
  value?: Value;
  evidence: FactEvidence;
}
```

**Current-state validation** — `catalogue-contract.ts` lines 257-316:

```ts
export function validateFactEvidence(evidence: FactEvidence, now: Date): string[] {
  // validates authority, URL, dates, verification action
  if (evidence?.status === 'current') {
    // documented and within operational freshness are required
  }
  return errors;
}
```

**Candidate-to-snapshot propagation seam** — `catalogue-publication.ts` lines 52-62 and 131-142:

```ts
export interface CatalogueCandidateInput {
  id?: string;
  title?: string;
  regionId?: CatalogueRegionId;
  region?: CatalogueRegion;
  source?: SourceMetadata;
  facts?: Partial<CatalogueOpportunityCardFacts>;
  claimBoundary?: string;
}

export interface CataloguePublishedRecord {
  id: string;
  revision: number;
  title: string;
  regionId: CatalogueRegionId;
  region: CatalogueRegion;
  source: SourceMetadata;
  facts: CatalogueOpportunityCardFacts;
  claimBoundary: string;
}
```

Extend both input and published records together, then update `evaluateCatalogueChecklist` (lines 256-300), `isCataloguePublishedRecord` (lines 419-433), imports, fixtures, and snapshot digest paths. Non-current/missing/conflicting requirement evidence must become a `Needs verification` DTO row, never an unchecked requirement or a rank penalty.

### `apps/web/lib/server/data-store.ts` and `apps/web/lib/server/student-records.ts` (persistence/service, CRUD)

**Analogs:** the onboarding collection and versioned replacement helper. Copy the conditional-write sequence, but create `qualificationProfiles` and do not add it to guest migration.

**Document collection/default convention** — `data-store.ts` lines 122-142 and 268-288:

```ts
export interface ScholarScoutData {
  users: StoredUser[];
  onboardingProfiles: Record<string, OrdinaryOnboardingProfile>;
  shortlists: Record<string, string[]>;
  // optional feature collections follow
}

const INITIAL_DATA: ScholarScoutData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  // ...
};
```

**Backward-compatible normalizer** — `data-store.ts` lines 1725-1773:

```ts
function normalizeScholarScoutData(data: ScholarScoutData): ScholarScoutData {
  return {
    ...INITIAL_DATA,
    ...data,
    onboardingProfiles: normalizeOnboardingProfiles(data.onboardingProfiles),
  };
}
```

Add `qualificationProfiles: normalizeQualificationProfiles(...)`, update import/export validation and data counts/backups. An absent legacy collection must normalize to `{}`. Require account storage keys at the route boundary and ensure `migrateGuestOwnedRecords` remains unchanged.

**Conflict-safe slice replacement** — `student-records.ts` lines 71-90:

```ts
const snapshot = await readVersionedScholarScoutData();
snapshot.data.onboardingProfiles[studentKey] = { ...profile };
snapshot.data.auditEvents.push(
  createAuditEvent(studentKey, 'save', 'onboarding', studentKey),
);
const result = await writeVersionedScholarScoutData(snapshot.data, snapshot.version);
if (result.status === 'conflict') throw new PersistenceConflictError();
```

Mirror this as `replaceStudentQualificationRecord`, using a generic audit action that never includes note or keyword content. Expose thin `get/save` functions in `data-store.ts` as at lines 1288-1301.

### `apps/web/app/api/account/qualifications/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/account/onboarding/route.ts`.

Copy imports, bounded JSON parsing, exact-key validation, expected 413/400/409 response shape, and trusted actor lookup. Critical adaptation: use `resolveStudentActor({ allowGuest: false })` and explicitly reject `actor.kind !== 'account'`; no client-supplied owner/key can be accepted.

**Route structure and conflict response** — `onboarding/route.ts` lines 67-118:

```ts
export async function GET() {
  const actor = await resolveActor();
  if (actor instanceof NextResponse) return actor;
  return NextResponse.json({ profile: await getOnboardingProfile(actor.storageKey) });
}

const body = await parseJsonRequest(request, {
  maxBytes: MAX_ONBOARDING_REQUEST_BYTES,
  validate: validateOnboardingProfile,
});
if (!body.ok) {
  return NextResponse.json({ error: 'Invalid onboarding profile.' }, {
    status: body.error === 'body-too-large' ? 413 : 400,
  });
}
```

**Exact key and finite-list guard** — `onboarding/route.ts` lines 134-215:

```ts
if (!isExactObject(value, [/* exact approved field names */])) return null;
// parse each enum/list, reject duplicates and invalid values
return items.some((item) => item === null) || new Set(items).size !== items.length
  ? []
  : (items as T[]);
```

The qualification route must accept only `structured`, `note`, and `keywords`; reject GPA, tests, prestige, ZIP/residence, referral/sensitive, score, account ID, and every extra key. Return `profile` or `record`, never an audit event and never other students' data.

### `apps/web/components/qualifications/QualificationRecordForm.tsx` and `components/profile/ProfileDashboard.tsx` (client components, request-response)

**Analogs:** `ProfileDashboard.tsx` for account-session loading; `OnboardingWizard.tsx` for controlled draft/error state and labelled actions.

**Session-gated account fetch** — `ProfileDashboard.tsx` lines 14-41:

```tsx
const { data: session } = useSession();
useEffect(() => {
  async function loadProfile() {
    if (session) {
      const response = await fetch('/api/account/onboarding');
      if (response.ok) { /* set fetched account data */ }
    }
  }
  void loadProfile();
}, [session]);
```

**Draft/error update convention** — `OnboardingWizard.tsx` lines 105-110 and 137-165:

```tsx
const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
  setData((current) => ({ ...current, [key]: value }));
  setError(null);
};
```

Use local React state for the private form draft only; do **not** copy `OnboardingWizard` lines 69-103 or 168-183, which write data to browser local storage. Add an `aria-live="polite"` save status, retain draft on conflict, inline exact-field errors, native fieldset/legend/checkbox/textarea controls, and an in-context clear confirmation.

Extend the signed-in profile dashboard with the `Your qualifications` card; retain its existing anonymous sign-in branch (lines 43-63). The programme entry should open/focus this reusable form without putting the record, keywords, or order in the URL.

### Catalogue cards, detail, comparison, and pages (components/pages, render/request-response)

**Analogs:** `CatalogueDiscoveryOverview.tsx`, `CatalogueOpportunityCard.tsx`, `CatalogueFocusView.tsx`, `CatalogueComparison.tsx`, and the programmes/detail/shortlist pages.

**Client-control placement and live result summary** — `CatalogueDiscoveryOverview.tsx` lines 28-52:

```tsx
<section aria-labelledby="catalogue-results-heading" className="min-w-0 space-y-5">
  <div className="rounded-card border border-ink-200 bg-white p-5">
    <p role="status" aria-live="polite">{model.items.length} results…</p>
  </div>
  {model.items.map((item) => <CatalogueOpportunityCard key={item.id} item={item} filters={filters} />)}
</section>
```

Make qualifications-first transient component state (native radio group) after the filter summary. Do not modify `buildCatalogueDiscoveryHref` (lines 99-107) to serialize order or personal data. Preserve the server page's reviewed-snapshot fetch: `programmes/page.tsx` lines 17-24.

**Source/action row convention** — `CatalogueOpportunityCard.tsx` lines 71-90:

```tsx
<section aria-label="Reason to consider">
  <p>Status: {formatState(reason.state)} · Source: {reason.evidence.sourceLabel} · Source date: {formatEvidenceDate(reason.evidence.sourceDate)}</p>
  <p>{reason.evidence.verificationAction}</p>
  <a href={reason.evidence.sourceUrl} target="_blank" rel="noreferrer">Open source (opens a new tab)</a>
</section>
```

The reusable `QualificationExplanation` should follow that exact evidence/source/action pattern, but use Phase 12 copy: checked requirement, keyword connection, or `Needs verification`; blue styling is supplemental to text/icon/date/action. Render it before general factual reasons in the card and pass the same DTO to detail and comparison. Keep existing save/comparison/alternate/official actions unchanged (card lines 92-105).

**Detail and comparison keep full evidence** — `CatalogueFocusView.tsx` lines 63-95 and `CatalogueComparison.tsx` lines 148-162 show the established `dt/dd`, state/source/date/action/link sequence. Reuse it for checked/unchecked/needs-verification requirement rows. Use `min-w-0`, `break-words`, `flex-wrap`, and `min-h-touch` just as the existing views do.

**Snapshot-only page seam:** continue using `getPublishedCatalogueSnapshot()` plus `buildCatalogueDiscoveryModel()` from `programmes/[id]/page.tsx` lines 31-60 and `shortlist/page.tsx` lines 19-24. No learner-time provider fetch is an allowed fallback.

## Shared Patterns

### Account-only authorization

**Source:** `apps/web/lib/server/student-actor.ts` lines 43-65

```ts
const session = await getServerSession(authOptions);
const accountId = session?.user?.id;
if (accountId) {
  return { kind: 'account', accountId, storageKey: `account:${accountId}` };
}
if (!input.allowGuest) return null;
```

**Apply to:** qualification GET/POST/clear route and any server-side account record read. For this phase call with `allowGuest: false` and require `kind === 'account'`.

### Controlled public URLs

**Source:** `apps/web/lib/catalogue-discovery.ts` lines 99-117

Only `metro`, `pathway`, `delivery`, `status`, `q`, and `page` may be serialized. Qualifications, note, keywords, and selected lens order stay out of URL state.

### Evidence and uncertainty

**Source:** `apps/web/lib/catalogue-contract.ts` lines 257-316

Every requirement/description/support source reuses `FactEvidence`. Non-current evidence retains source/action and maps to the Phase 12 textual blue `Needs verification` row; it never changes a student result into a negative claim.

### Pure-test convention

**Source:** `apps/web/__tests__/lib/catalogue-discovery.test.ts` lines 8-33 and 99-120

Create small typed fixture factories, call named pure functions, assert ordered IDs and exact DTO evidence. Qualification-lens tests must additionally assert identical ID set/count before and after sort, stable ID tie-break, current-only checked count, keyword-only second bucket, and absence/invariance of prohibited inputs.

### Component-test convention

**Source:** `apps/web/__tests__/components/CatalogueOpportunityCard.test.tsx` lines 49-83 and `CatalogueComparison.test.tsx` lines 106-150

Use Testing Library role/name assertions for visible source, date, state, direct verification link, choice actions, wrapping classes, and banned verdict text. Test the same explanation DTO in overview, detail, and comparison; serialize response/component props and assert the private note never appears.

### Storage/API-test convention

**Source:** `apps/web/__tests__/lib/student-records.test.ts` lines 125-161 and `apps/web/__tests__/api/account-guest-routes.test.ts` lines 94-165, 328-350

Use a versioned in-memory store to prove one winning conditional replacement, account-key isolation, generic audit contents, legacy `{}` normalization, and no guest migration. Mock `resolveStudentActor` and store helpers for route tests; assert account-only denial for guest/anonymous, exact-key rejection, 413/400/409 responses, and that a submitted owner cannot redirect storage.

## No Analog Found

No close phase-specific analogue exists for a private note form that is deliberately excluded from browser storage, URLs, catalogue props, staff surfaces, and ranking input. Build `QualificationRecordForm` from the account-session and native-control patterns above, with this explicit exclusion as its contract.

## Metadata

**Analog search scope:** `apps/web/lib`, `apps/web/lib/server`, `apps/web/app`, `apps/web/components`, `apps/web/__tests__`  
**Primary analogs read:** onboarding account route/types; student actor/records/store; catalogue contract/publication/discovery; overview/card/detail/comparison; profile; discovery/card/comparison tests  
**Pattern extraction date:** 2026-09-24
