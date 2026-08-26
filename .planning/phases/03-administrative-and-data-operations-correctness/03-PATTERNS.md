# Phase 3: Administrative and Data Operations Correctness - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 12 new or modified files/file families
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/web/lib/server/data-recovery.ts` (new) | service, model, utility | transform, CRUD | `apps/web/lib/server/data-store.ts` | role-match |
| `apps/web/lib/server/data-store.ts` | store, adapter | file-I/O, request-response, CRUD | existing adapter and normalization sections in the same file | exact |
| `apps/web/app/api/admin/data/capabilities/route.ts` (new) | route, controller | request-response | `apps/web/app/api/admin/data/status/route.ts` | exact |
| `apps/web/app/api/admin/data/backups/route.ts` | route, controller | request-response | existing implementation plus `status/route.ts` | exact |
| `apps/web/app/api/admin/data/backups/[id]/plan/route.ts` | route, controller | request-response | existing implementation | exact |
| `apps/web/app/api/admin/data/backups/[id]/restore/route.ts` | route, controller | request-response, CRUD | existing implementation plus `apps/web/lib/api-request.ts` | exact |
| `apps/web/app/api/admin/data/import/validate/route.ts` | route, controller | request-response, transform | existing implementation plus `apps/web/lib/api-request.ts` | exact |
| `apps/web/app/api/admin/data/import/restore/route.ts` | route, controller | request-response, CRUD | existing implementation plus backup restore route | exact |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | component | event-driven, request-response | existing data-operations section in the same component | exact |
| `apps/web/__tests__/lib/data-recovery.test.ts` (new) | test | transform, CRUD | `apps/web/__tests__/lib/data-store.test.ts` | role-match |
| `apps/web/__tests__/lib/data-store.test.ts` | test | file-I/O, request-response | existing adapter tests in the same file | exact |
| `apps/web/__tests__/api/admin-data-routes.test.ts` and `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` | tests | request-response, event-driven | existing admin route suite; `AdvisorChat.test.tsx` for async UI | exact / role-match |

## Pattern Assignments

### `apps/web/lib/server/data-recovery.ts` (service/model/utility, transform + CRUD)

**Analog:** `apps/web/lib/server/data-store.ts`

Keep this module server-only and expose named types/functions. Move recovery policy here rather than adding more unrelated policy to the already-large store module. Reuse the store's explicit DTO style and whole-document port.

**Imports and server boundary** (`data-store.ts:1-14`):

```typescript
import 'server-only';

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type { OnboardingData } from '@/lib/onboarding-types';
```

Use Node 20 `crypto`; add no dependency. The recovery module should own stable unions/interfaces for read failures, capability DTOs, signed envelope claims, restore plans, retention holds, and privacy-minimal lifecycle audit events. Accept injected clock/signing material where tests need deterministic expiry and signatures.

**Port and DTO pattern** (`data-store.ts:133-180`):

```typescript
export interface ScholarScoutDataStore {
  read(): Promise<ScholarScoutData>;
  write(data: ScholarScoutData): Promise<void>;
}

export interface ScholarScoutDataStoreStatus {
  adapter: string;
  backingStore: string;
  isDurable: boolean;
  isConfigured: boolean;
  issues: string[];
  // typed nested status fields
}
```

**Compose-then-write pattern to preserve** (`data-store.ts:594-631`): current code reads current data, constructs a pre-restore backup, composes restored data plus audit, then calls `writeScholarScoutData` once. Phase 3 must strengthen this pattern: validate source and fresh current state first; compose restored data, non-nested recovery backup, retained/held backup set, and lifecycle audit in memory; validate the final document; invoke `store.write` exactly once. Do not write the backup separately.

**Preview projection pattern** (`data-store.ts:720-732`):

```typescript
const currentCounts = getDataCounts(data);
const restoredCounts = getDataCounts(backup.data);

return {
  rows: dataCountLabels.map((item) => ({
    key: item.key,
    label: item.label,
    currentCount: currentCounts[item.key],
    restoredCount: restoredCounts[item.key],
    delta: restoredCounts[item.key] - currentCounts[item.key],
  })),
};
```

Keep count/category deltas only. Add opaque signed plan token, expiry, source ID/schema/digest, and current-data digest; never include snapshot/student contents. Bind claims to the authorized actor and consume plans once.

**Retention analog** (`data-store.ts:1297-1332`): retain the existing pure status-returning style, but replace count-only five-backup policy with newest 10, 30-day maximum, incident holds, unique IDs, no nested histories, and auditable prune/hold/release events.

### `apps/web/lib/server/data-store.ts` (store/adapter, file-I/O + request-response)

**Analog:** its current JSON, HTTP, and Blob adapters (`data-store.ts:221-323`).

Preserve adapter selection and the `read`/`write` port. Change only read semantics and persisted-document normalization needed by the recovery service.

**Current absence/error branches to split** (`data-store.ts:224-230`):

```typescript
try {
  const file = await readFile(this.filePath, 'utf8');
  return { ...INITIAL_DATA, ...JSON.parse(file) } as ScholarScoutData;
} catch {
  return INITIAL_DATA;
}
```

Only verified `ENOENT` may return initial empty data. Permission errors, malformed JSON, provider failures, timeouts, and structurally invalid persisted documents must throw a typed operational failure with safe category and incident ID. HTTP 404 (`data-store.ts:251-258`) and a genuinely missing Blob (`data-store.ts:306-311`) remain valid absence; all successful provider bodies must pass complete structural validation before normalization.

Keep `readScholarScoutData`/`writeScholarScoutData` as the central normalization seam (`data-store.ts:793-797`). Do not introduce process-local fallback or queued writes. A failed/unknown fresh read must prevent every mutation before `write` is called.

### `apps/web/app/api/admin/data/capabilities/route.ts` (route/controller, request-response)

**Analog:** `apps/web/app/api/admin/data/status/route.ts:1-15`.

```typescript
import { NextResponse } from 'next/server';
import { requireActiveStaff } from '@/lib/server/active-staff';

export async function GET() {
  const authorization = await requireActiveStaff({
    action: 'view-data-status',
    route: '/api/admin/data/status',
  });

  if (!authorization.ok) {
    return authorization.response;
  }

  return NextResponse.json(await getScholarScoutDataStoreStatus());
}
```

Authorize before storage access. Return one canonical health/capability union containing adapter label, last-verified time, counts only when verified, and operation entries with availability, allowed action, safe reason, and retryability. On typed storage failure return structured `503`, not zero counts:

```typescript
return NextResponse.json(
  {
    ok: false,
    error: 'data-operations-unavailable',
    category: failure.category,
    incidentId: failure.incidentId,
    retryable: true,
  },
  { status: 503 },
);
```

Do not expose routes/actions the server cannot implement or authorize. No polling endpoint behavior is needed; every GET is a fresh explicit check.

### Existing `/api/admin/data/*` routes (routes/controllers, request-response + CRUD)

**Analogs:** current routes in the same family, `active-staff.ts`, and `api-request.ts`.

Apply this order consistently: (1) `requireActiveStaff`; (2) bounded and exact request parsing; (3) recovery service call; (4) typed expected-error mapping; (5) allow unexpected failures to propagate.

**Authorization guard** (`active-staff.ts:21-53`):

```typescript
const authorization = await requireActiveStaff({ action, route });
if (!authorization.ok) {
  return authorization.response;
}
// authorization.actor.id is the actor binding
```

This guard also records the minimal allowed/denied privileged-operation evidence. Call it before parsing untrusted input, plan lookup, or storage reads.

**Bounded exact request parsing** (`api-request.ts:17-53,60-70`):

```typescript
const result = await parseJsonRequest(request, {
  maxBytes: MAX_BYTES,
  validate(value) {
    if (!isExactObject(value, ['planToken', 'reason', 'confirmation'])) {
      return null;
    }
    return validateApplyRequest(value);
  },
});
```

Map `body-too-large` to `413`; malformed/shape-invalid input to `400`. Apply endpoints accept exactly `planToken`, non-empty bounded `reason`, and exact confirmation phrase. They must not accept `snapshot` or backup ID as authority.

**Expected typed error handling analog** (`backups/[id]/restore/route.ts:48-72`): catch only domain errors callers can recover from and translate them explicitly. Phase 3 mappings should include invalid request `400`, changed current/source version `409`, expired/consumed plan `410`, oversized body `413`, and storage unavailable `503`; all failures assert no write and safe body content.

Specific route responsibilities:

- `backups/route.ts`: verified newest-first summaries only; distinguish verified empty from unavailable; include schema, digest, retention/hold metadata, never `data`.
- `backups/[id]/plan/route.ts`: issue an actor/source/current-digest-bound short-lived plan and count-only preview; keep `404` for an absent backup.
- `backups/[id]/restore/route.ts`: consume the plan token rather than trusting the route ID; require reason and exact typed confirmation; return recovery backup and audit/operation IDs.
- `import/validate/route.ts`: pass raw bounded request bytes to authoritative envelope verification; do not browser-trust filename/metadata; successful validation stages a plan and never writes.
- `import/restore/route.ts`: use the identical plan-apply service/response semantics as backup restore; remove raw snapshot submission.

### `apps/web/components/admin/ProgrammeAdminManager.tsx` (component, event-driven + request-response)

**Analog:** its existing data-operations surface (`ProgrammeAdminManager.tsx:795-1067`). Extend this component; do not add a second admin namespace or a new design system.

**Existing visual patterns to reuse:** `Card` as the section container, responsive Tailwind grids, `Badge` with text state, `overflow-x-auto` around the impact table, full-width narrow-screen controls, and `danger-600` only on final destructive Apply. Current preview table (`973-1002`) already matches the four-column count/delta contract.

Replace nullable/empty-fallback state with discriminated state:

```typescript
type CapabilityState =
  | { status: 'loading' }
  | { status: 'healthy'; value: CapabilityResponse }
  | { status: 'refreshing'; value: CapabilityResponse }
  | { status: 'unavailable'; lastVerified?: CapabilityResponse; failure: SafeFailure };
```

Render operation cards only from server-reported capabilities. Retain last-known data read-only on refresh failure, label its timestamp, and derive `mutationsAllowed` only from the latest healthy response. Remove the unsupported hard-coded export link currently at `888-893` unless the server reports an implemented export capability.

**Fetch handler analog** (`ProgrammeAdminManager.tsx:342-407`): clear stale plan/result before preview, parse a safe JSON response, and update the appropriate state. Strengthen it with pending flags, safe error unions, `response.ok` checks, and focus refs. Import validation must send the package to the server without client JSON authority; apply sends only the plan token/reason/phrase.

Follow approved UI-SPEC details: manual Refresh/Retry only; `role="alert"` for unavailable/error; polite live region for loading/success; persistent labels and `aria-describedby`; focus preview/alert/result headings; preserve reason after retryable failure; clear typed confirmation on new/expired/conflicting plans; disable duplicate validate/apply; keep page-level horizontal overflow impossible.

### `apps/web/__tests__/lib/data-recovery.test.ts` and `data-store.test.ts` (tests)

**Analog:** `apps/web/__tests__/lib/data-store.test.ts`.

Use the cloned in-memory port and reset seam (`data-store.test.ts:44-89`):

```typescript
class MemoryDataStore implements ScholarScoutDataStore {
  data = cloneData(initialData);
  async read() { return cloneData(this.data); }
  async write(data: ScholarScoutData) { this.data = cloneData(data); }
}

afterEach(() => {
  setScholarScoutDataStoreForTests(null);
  jest.restoreAllMocks();
});
```

Extend this with throwing/counting stores and injected deterministic clock/signing key. The current negative invariant (`data-store.test.ts:546-570`) is the essential assertion pattern: reject invalid input and then prove current data and backup history are unchanged. The existing adapter mocks (`229-365`) show how to test HTTP and Blob outcomes.

Cover JSON `ENOENT` versus permission/malformed input, HTTP 404 versus provider/bad body, and missing Blob versus stream/parse/provider failure. Recovery tests cover exact envelope keys, size/schema/signature/digest validation, stable canonicalization, actor/source/current digest/expiry/single-use plan binding, count-only preview, required reason/phrase, exactly one write, no nested backup, 10/30-day retention plus incident holds, and privacy-minimal audit/prune events.

### `apps/web/__tests__/api/admin-data-routes.test.ts` (route test)

**Analog:** existing suite (`admin-data-routes.test.ts:1-55,118-175,245-328`).

Import handlers directly, mock `next-auth`, inject `MemoryDataStore`, and assert both status/body and resulting store state. Reuse helpers at `449-476` (`jsonRequest`, `routeContext`, `expectStatus`, `jsonBody`, `cloneData`). Existing tests demonstrate authorization-before-operation and preview count assertions.

Add capability contracts, partial capability availability, missing signing configuration, size/exact-shape checks, `409/410/413/503`, actor binding, expiry/replay, and provider-text redaction. Every rejection test must assert `write` count is zero; every successful apply must assert exactly one write containing restored data, recovery backup, and lifecycle audit.

### `apps/web/__tests__/components/ProgrammeAdminManager.test.tsx` (component test, event-driven)

**Analog:** `apps/web/__tests__/components/advisor/AdvisorChat.test.tsx:1-76` for sequential mocked responses and Testing Library async assertions.

```typescript
const fetchMock = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = fetchMock as typeof fetch;
});

const user = userEvent.setup();
render(<ProgrammeAdminManager {...props} />);
expect(await screen.findByText('Storage verified')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: 'Refresh data operations' }));
await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
```

Test initial loading, verified empty, capability-driven hidden actions, refreshing last-known state, unavailable alert/incident ID/Retry, all mutations disabled, preview focus and count-only content, expiry/version re-preview behavior, reason preservation and confirmation clearing, duplicate-submission prevention, success/failure live announcements, and accessible labels/descriptions. Long-text/responsive items remain visual backstops unless a DOM assertion can prove wrapping classes/overflow containment.

## Shared Patterns

### Authentication and actor binding

**Source:** `apps/web/lib/server/active-staff.ts:21-53`  
**Apply to:** every admin data route.

Fresh session plus live allowlist is resolved for each request, allowed/denied evidence is recorded, and only `authorization.actor.id` may bind a plan or lifecycle action. Never accept actor identity from request JSON.

### Input validation

**Source:** `apps/web/lib/api-request.ts:17-70`  
**Apply to:** import validation and both apply endpoints.

Read bounded bytes before parsing, require a plain exact-key object, then apply field bounds and cryptographic/schema validation in the recovery service. Never use `request.json()` for the import package or other bounded recovery payloads.

### Error handling and response shape

**Sources:** current restore route `48-72`; research fail-closed contract.  
**Apply to:** capability, backup, preview, validate, and apply routes.

Return stable safe machine categories, an incident ID, retryability, and explicit status. Do not return backend/provider messages, envelope contents, snapshot samples, or student records. Do not convert a failed read into `{ backups: [] }` or zero counts.

### Whole-document mutation boundary

**Source:** `ScholarScoutDataStore` at `data-store.ts:155-158` and restore composition at `594-625`.  
**Apply to:** backup/import apply.

All validation and version checks precede one composed write. This is application-level all-or-nothing behavior at the existing port; do not claim crash-safe provider transactions or Phase 4 compare-and-swap semantics.

### UI design system and accessibility

**Source:** `ProgrammeAdminManager.tsx:795-1067` and approved `03-UI-SPEC.md`.  
**Apply to:** the existing admin component only.

Use repository `Button`, `Card`, `Input`, and `Badge`, existing Tailwind tokens, Geist Mono for IDs/digests/confirmation, status text plus color, 40/44px targets, and responsive stacking. No shadcn, icons, background polling, or browser-only confirmation.

### Test isolation

**Source:** `data-store.test.ts:44-89` and `admin-data-routes.test.ts:21-55`.  
**Apply to:** all Phase 3 unit/route tests.

Inject the store with `setScholarScoutDataStoreForTests`, restore environment values, reset auth/fetch mocks, and clone documents across the test boundary. Prefer exact no-write/one-write assertions over success-body-only tests.

## No Analog Found

None. The new recovery service has no exact one-file equivalent, but all of its constituent patterns—server-only named exports, typed DTOs/errors, pure validation/projection, Node crypto, whole-document composition, and injected store tests—exist in the current persistence boundary. Use `03-RESEARCH.md` for the new signed-envelope and plan-claim details while retaining these repository conventions.

## Metadata

**Analog search scope:** `apps/web/lib/server`, `apps/web/lib`, `apps/web/app/api/admin/data`, `apps/web/components/admin`, `apps/web/components/ui`, and `apps/web/__tests__`  
**Primary analogs read:** 10 files across server store, request parsing, authorization, routes, UI, and tests  
**Pattern extraction date:** 2026-08-25

