# Phase 9: Catalogue Foundations and Source Contracts - Pattern Map

**Mapped:** 2026-09-22  
**Files analyzed:** 4 prospective files  
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/web/lib/catalogue-contract.ts` | domain library / validator | transform | `apps/web/lib/outcome-profiles.ts` | role-match |
| `apps/web/lib/catalogue-fixtures.ts` | static fixture / configuration | transform | `apps/web/lib/western-new-york.ts` | role-match |
| `apps/web/__tests__/lib/catalogue-contract.test.ts` | unit test | transform | `apps/web/__tests__/lib/outcome-profiles.test.ts` | exact |
| `apps/web/__tests__/lib/catalogue-fixtures.test.ts` | unit test | transform | `apps/web/__tests__/lib/western-new-york.test.ts` | exact |

Phase 9 creates these four files only. It must not modify the legacy `Programme` type, server persistence boundary, public routes, or ranking modules. The later deliberate publication bridge remains Phase 10 work.

## Pattern Assignments

### `apps/web/lib/catalogue-contract.ts` (domain library / validator, transform)

**Primary analog:** `apps/web/lib/outcome-profiles.ts`  
**Supporting analog:** `apps/web/lib/programmes.ts`

Use named type exports and finite literal unions for every controlled state. Keep the module pure: no `server-only`, React, `fetch`, browser storage, environment reads, or `new Date()` inside freshness functions. Export a small validator that returns `string[]` for invalid contracts; do not throw for expected invalid source/fixture input.

**Controlled vocabulary pattern** — `apps/web/lib/programmes.ts:8-38`:

```typescript
export type ProgrammePathway =
  | '4-year-university'
  | '2-year-community-college'
  | 'trade-vocational'
  | 'certificate-program'
  | 'apprenticeship'
  | 'online-degree';

export type ProgrammeEvidenceState =
  | 'documented'
  | 'unknown'
  | 'stale'
  | 'conflicting';

export interface ProgrammeFieldEvidence {
  state: ProgrammeEvidenceState;
  sourceLabel?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  verificationGuidance?: string;
}
```

Copy the shape, not the legacy labels. The new contract needs its own six Phase 9 pathways, six region IDs, coverage states, evidence authorities, delivery modes, and fact states. Do not reuse `Programme.matchScore`, `acceptanceRate`, or the legacy `ProgrammePathway` union.

**Validation-return pattern** — `apps/web/lib/outcome-profiles.ts:82-122`:

```typescript
export function validateOutcomeMetricRecord(record: OutcomeMetricRecord): string[] {
  const errors: string[] = [];

  if (!record.institution_id.trim()) errors.push('institution_id is required.');
  if (!record.cohort_definition.trim()) errors.push('cohort_definition is required.');
  if (!record.source_url.trim()) errors.push('source_url is required.');
  if (!isDate(record.as_of_date)) errors.push('as_of_date must be an ISO date.');

  if (record.value === null && !record.suppression_reason?.trim()) {
    errors.push('suppression_reason is required when value is unavailable.');
  }

  return errors;
}
```

Use this for `validateCatalogueRegion`, `validateFactEvidence`, `validateCoverageMatrix`, and any employer-training/wage fact validator. Require an explicit safe state and a direct verification action for unavailable, stale, or conflicting facts; never turn an incomplete fact into `current`.

**Deterministic date pattern** — `apps/web/lib/outcome-profiles.ts:171-205,252-262`:

```typescript
export function assessOutcomeEvidence(
  profile: OutcomeProfile | null,
  referenceDate = new Date(),
): OutcomeEvidenceStatus {
  // evaluate every record against the supplied reference date
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
```

Phase 9 improves the reference pattern: make `now: Date` required in `getFactStatus` / freshness helpers instead of defaulting it. Use ISO date-only parsing and test the exact 183-day operational and 731-day boundary thresholds.

**Evidence-normalization safety pattern** — `apps/web/lib/programmes.ts:90-143`:

```typescript
export function normalizeProgrammeForGovernance(programme: Programme): Programme {
  const materialFacts = Object.fromEntries(
    programmeSourceChecks.map((fact) => [
      fact,
      normalizeProgrammeFieldEvidence(rawEvidence?.materialFacts?.[fact]),
    ]),
  ) as Record<ProgrammeSourceCheck, ProgrammeFieldEvidence>;

  return {
    ...programme,
    programmeEvidence: { materialFacts, supportBundle },
  };
}

function normalizeProgrammeFieldEvidence(
  evidence: ProgrammeFieldEvidence | undefined,
): ProgrammeFieldEvidence {
  if (!evidence || !programmeEvidenceStates.includes(evidence.state)) {
    return {
      state: 'unknown',
      verificationGuidance: 'Verify this information directly with the programme.',
    };
  }
  // preserve a supported state; trim optional source fields
}
```

Apply the same "unknown, never upgraded" principle to the new contract. Its fixture matrix must use explicit `not-yet-verified` rows rather than treating a missing row, nearby provider, or a government record as proof of local current availability.

---

### `apps/web/lib/catalogue-fixtures.ts` (static fixture / configuration, transform)

**Primary analog:** `apps/web/lib/western-new-york.ts`  
**Supporting analog:** `apps/web/lib/programmes.ts`

Export immutable, typed static arrays from the domain library. Place all six regions, their official-boundary metadata, documented downtown ten-mile focus records, and the 36 explicit coverage cells in one deterministic fixture module. This is catalogue data for contract tests—not a live provider inventory and not a personalised recommendation input.

**Static record pattern** — `apps/web/lib/western-new-york.ts:1-37,53-79`:

```typescript
export type EvidenceStatus = 'verified' | 'review-before-applying';

export interface CampusSource {
  label: string;
  url: string;
  status: EvidenceStatus;
}

export interface WesternNewYorkInstitution {
  id: string;
  name: string;
  city: string;
  kind: 'university' | 'college' | 'community-college' | 'workforce-training';
  officialUrl: string;
  accountability: {
    notice: string;
    sources: CampusSource[];
  };
  sourceCheckedOn: string;
}

export const WESTERN_NEW_YORK_INSTITUTIONS: WesternNewYorkInstitution[] = [
  {
    id: 'university-at-buffalo',
    name: 'University at Buffalo',
    city: 'Buffalo / Amherst',
    kind: 'university',
    officialUrl: 'https://www.buffalo.edu/',
    sourceCheckedOn: '2026-07-25',
  },
];
```

Use the exported `CATALOGUE_REGIONS`, `CATALOGUE_PATHWAYS`, and `CATALOGUE_COVERAGE` arrays instead. Every region record needs separate `officialBoundary` and `localFocus` objects. Greater Kingston uses the STATIN Kingston Metropolitan Area authority and omits a U.S. CBSA code; the five U.S. regions use frozen Census/OMB CBSA source records. Each `localFocus` is a fixed, source-documented downtown anchor and `radiusMiles: 10`.

**Complete-set normalization pattern** — `apps/web/lib/programmes.ts:95-123`:

```typescript
const materialFacts = Object.fromEntries(
  programmeSourceChecks.map((fact) => [
    fact,
    normalizeProgrammeFieldEvidence(rawEvidence?.materialFacts?.[fact]),
  ]),
) as Record<ProgrammeSourceCheck, ProgrammeFieldEvidence>;
```

For coverage, derive expected region/pathway keys from the controlled arrays and make validation reject duplicates, unknown keys, or any missing key. Keep no actual provider, trainee-pay, support, restriction, wage, recruiter, or local-office claims in Phase 9 fixtures unless they carry reviewed source evidence; use `not-yet-verified`/`unknown` fixtures to exercise the contract safely.

Do **not** copy the personalised scoring portion of `western-new-york.ts:245-294`; Phase 9 has no qualification context, ranking, or eligibility determination.

---

### `apps/web/__tests__/lib/catalogue-contract.test.ts` (unit test, transform)

**Primary analog:** `apps/web/__tests__/lib/outcome-profiles.test.ts`  
**Supporting analog:** `apps/web/__tests__/lib/admin-programmes.test.ts`

Use direct `@/lib/...` imports, a typed fixture-builder helper, `describe` blocks by exported behavior, and individual negative assertions for each safety rule. Pass a fixed `Date` to every freshness call.

**Typed test-record helper and contract test pattern** — `apps/web/__tests__/lib/outcome-profiles.test.ts:1-20,22-39`:

```typescript
import {
  assessOutcomeEvidence,
  createOutcomeProfile,
  validateOutcomeMetricRecord,
  type OutcomeMetricRecord,
} from '@/lib/outcome-profiles';

const record = (
  metric_name: OutcomeMetricRecord['metric_name'],
  value: number | null,
): OutcomeMetricRecord => ({
  institution_id: 'buffalo-example',
  metric_name,
  value,
  source_url: 'https://data.example.edu/outcomes',
  as_of_date: '2026-06-01',
  // remaining valid defaults
});

describe('outcome profiles', () => {
  it('keeps the import schema and creates a high-confidence current profile', () => {
    // arrange valid data, then assert the public contract
  });
});
```

Build a valid `FactEvidence` / `CatalogueRegion` baseline fixture in the test, then override exactly one field per failure case. Cover invalid/non-HTTP source URLs, invalid/missing dates, unsupported authorities/states, stale operational facts at day 184, boundary facts at day 732, `unknown`, and `conflicting` without collapse. Add explicit assertions that employer-linked training contains a source-backed taught-skill/trainee-pay fact and an employment-commitment disclosure, never a job or salary promise field.

**Attributable-evidence test pattern** — `apps/web/__tests__/lib/admin-programmes.test.ts:99-151`:

```typescript
it('keeps documented material facts and ordinary supports attributable at the catalogue boundary', () => {
  const draft = prepareProgrammeDraft({
    // valid baseline fields
    programmeEvidence: {
      materialFacts: {
        tuition: {
          state: 'documented',
          sourceLabel: 'Metro Arts tuition page',
          sourceUrl: 'https://example.edu/tuition',
          verificationGuidance: 'Confirm this year\'s tuition directly with Metro Arts.',
        },
      },
      supportBundle: [],
    },
  });

  expect(validateProgrammeDraft(draft)).toEqual([]);
});
```

Apply its arrange/validate/negative-test structure, but do not depend on legacy programme validation. The new Phase 9 validator needs field-level authority, source URL, review date, state, and verification action.

---

### `apps/web/__tests__/lib/catalogue-fixtures.test.ts` (unit test, transform)

**Primary analog:** `apps/web/__tests__/lib/western-new-york.test.ts`  
**Supporting analog:** `apps/web/__tests__/lib/programmes.test.ts`

Assert public fixture invariants instead of snapshotting a large static object. Tests should prove the six-record / six-pathway / 36-cell contract, specific Kingston authority behavior, source fields, exact ten-mile radius, and safe explicit coverage states.

**Static-source regression pattern** — `apps/web/__tests__/lib/western-new-york.test.ts:14-60`:

```typescript
it('keeps corrected official visit sources in the production WNY dataset', () => {
  const expectedSources = {
    'bryant-stratton': {
      mediaUrl: 'https://www.bryantstratton.edu/location/buffalo-ny/buffalo/',
      sourceCheckedOn: '2026-08-29',
    },
  };

  for (const [id, source] of Object.entries(expectedSources)) {
    const institution = WESTERN_NEW_YORK_INSTITUTIONS.find((candidate) => candidate.id === id);
    expect(institution).toMatchObject(source);
  }
});
```

Use this loop pattern for all six region IDs. Assert the five U.S. region records have `us-census-omb-cbsa` authority and stable boundary IDs, while `greater-kingston-jamaica` has `statin-kingston-metropolitan-area` and no CBSA boundary ID. Assert each local focus has a source URL, checked date, and `radiusMiles: 10`.

**Small focused behavior tests** — `apps/web/__tests__/lib/programmes.test.ts:9-52`:

```typescript
describe('programme matching helpers', () => {
  it('filters programmes by search query', () => {
    const results = filterProgrammes(programmes, { query: 'cybersecurity' });
    expect(results).toHaveLength(1);
  });
});
```

Mirror this compact style for `validateCoverageMatrix(CATALOGUE_REGIONS, CATALOGUE_COVERAGE)`. Add separate cases for missing, duplicate, and unknown coverage keys. Do not test UI sorting, qualification matching, support-referral content, or provider inventory in this phase.

## Shared Patterns

### Domain contracts remain pure and adjacent to legacy models

**Sources:** `apps/web/lib/programmes.ts:8-50`; `apps/web/lib/outcome-profiles.ts:82-122`  
**Apply to:** Both new library modules

- Use named exports, precise unions, interfaces, small private helpers, and `string[]` validation results.
- Do not import `server-only`, `next/*`, React, environment/config modules, or persistence modules.
- Do not replace or mutate the existing `Programme` model. It retains current rendering and governance responsibilities until a later explicit mapper is planned.

### Evidence does not upgrade missing information

**Source:** `apps/web/lib/programmes.ts:90-143`

```typescript
if (!evidence || !programmeEvidenceStates.includes(evidence.state)) {
  return {
    state: 'unknown',
    verificationGuidance: 'Verify this information directly with the programme.',
  };
}
```

**Apply to:** Fact evidence, coverage, wage context, and employer-training disclosures. Unsupported/incomplete information must remain `unknown`, `needs-confirmation`, or `conflicting`, with a human-facing verification action. It must never become a promise, an eligibility conclusion, or `current` merely because the provider exists.

### Source and date validation stays explicit

**Source:** `apps/web/lib/admin-programmes.ts:468-571,690-716`

```typescript
if (sourceUrl && !isHttpUrl(sourceUrl)) {
  errors.push('Source URL must start with http:// or https://.');
}

if (!evidence.sourceLabel?.trim()) {
  errors.push(`Documented ${label} evidence needs a public source label.`);
}
if (!evidence.sourceUrl?.trim() || !isHttpUrl(evidence.sourceUrl)) {
  errors.push(`Documented ${label} evidence needs a public source URL.`);
}
```

**Apply to:** Regional-boundary, downtown-anchor, material-fact, trainee-pay, employment-commitment, and occupation/area wage evidence. Phase 9 adds review-age rules: 183 days for operational facts and 731 days for boundary records, evaluated against an injected clock.

`sourceDate` is a required discriminated value, never an optional property: validate a documented ISO calendar date, or retain an explicit unavailable branch that classifies the affected fact as non-current/unresolved and still requires a direct verification action. Apply the same metadata contract to official boundaries and local-focus anchors before fixture construction.

### Static-source test fixtures are assertion-driven

**Sources:** `apps/web/__tests__/lib/outcome-profiles.test.ts:8-20`; `apps/web/__tests__/lib/western-new-york.test.ts:14-60`  
**Apply to:** Both new test files

- Build one fully valid typed baseline fixture locally in the test file.
- Override only the field under test for error/freshness cases.
- Assert source URLs/dates and controlled-state invariants directly, rather than snapshotting the whole fixture.
- Use fixed dates; the suite must not vary by execution day or require a network connection.

## No Analog Found

None. Existing domain and static-dataset patterns are sufficient, with one deliberate difference: the Phase 9 fixture module must not inherit the personalised ranking behavior in `western-new-york.ts`.

## Metadata

**Analog search scope:** `apps/web/lib/`, `apps/web/lib/server/`, and `apps/web/__tests__/lib/`  
**Files scanned:** 10  
**Pattern extraction date:** 2026-09-22
