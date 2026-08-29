# Phase 5: School Community and WNY Release Slice - Pattern Map

**Mapped:** 2026-08-29  
**Files analyzed:** 18 planned new/modified files  
**Analogs found:** 17 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx` | component | request-response | same file | exact |
| `apps/web/app/schools/[slug]/page.tsx` | route/page | request-response | same file | exact |
| `apps/web/lib/peer-guides.ts` | utility | transform | same file | exact |
| `apps/web/components/peer-community/PeerCommunity.tsx` | component | request-response | same file | exact |
| `apps/web/lib/campus-community.ts` | model/utility | transform | same file | exact |
| `apps/web/lib/server/rate-limit.ts` | service | request-response | same file | exact |
| `apps/web/lib/server/data-store.ts` | service/model | CRUD | same file | exact |
| `apps/web/lib/server/operational-records.ts` | service | CRUD / CAS | same file | exact |
| `apps/web/app/api/campus-notes/route.ts` | route | request-response | same file | exact |
| `apps/web/app/api/campus-notes/[id]/report/route.ts` | route | request-response / event-driven | `app/api/campus-notes/route.ts` + `operational-records.ts` | composed |
| `apps/web/app/api/peer-connections/route.ts` | route | request-response | same file | exact |
| `apps/web/components/campus-community/CampusNoteBoard.tsx` | component | request-response | same file | exact |
| `apps/web/components/campus-community/UploaderContactPanel.tsx` | component | request-response | same file | exact |
| `apps/web/app/admin/community-moderation/page.tsx` | route/page | request-response | `app/admin/feed/page.tsx` | role-match |
| `apps/web/app/api/admin/community-moderation/route.ts` | route | request-response / CRUD | `app/api/admin/programmes/route.ts` | role-match |
| `apps/web/components/admin/CommunityModerationQueue.tsx` | component | request-response | `components/campus-community/CampusNoteBoard.tsx` | partial |
| `apps/web/__tests__/api/community-moderation.test.ts` | test | request-response / CRUD | `__tests__/api/admin-programmes.test.ts` | role-match |
| `apps/web/__tests__/components/community-release.test.tsx` | test | request-response | `__tests__/components/advisor/AdvisorChat.test.tsx` | role-match |

## Pattern Assignments

### Discovery source panels and empty states

**Apply to:** `WesternNewYorkDirectory.tsx`, `schools/[slug]/page.tsx`, discovery tests.

**Primary analog:** `apps/web/components/western-new-york/WesternNewYorkDirectory.tsx`

**Client state and deterministic input pattern** (lines 18-20):

```tsx
const [context, setContext] = useState<WesternNewYorkStudentContext>(DEFAULT_WNY_CONTEXT);
const ranked = useMemo(() => rankWesternNewYorkInstitutions(institutions, context), [institutions, context]);
```

**Decision-point verification panel and external-link pattern** (lines 51-53):

```tsx
<div className="mt-4 rounded-card bg-ink-50 p-3">
  <p className="text-xs font-bold uppercase text-ink-500">Verify before applying</p>
  <ul className="mt-2 space-y-1 text-sm leading-5 text-ink-700">
    {reviewItems.map((item) => <li key={item}>• {item}</li>)}
  </ul>
</div>
<a href={institution.officialUrl} target="_blank" rel="noreferrer" ...>Official site</a>
```

Replace the source-status wording at lines 53 and 57 (`checked`, “sources checked”) with the locked source-oriented copy; retain `target="_blank"` and `rel="noreferrer"`. Put the new shared notice above the result grid (the existing notice position at lines 37-39 is the location analog), then retain the small per-result panel immediately before official links.

**Server-page 404 boundary and governed read** (source: `apps/web/app/schools/[slug]/page.tsx`, lines 9-14):

```tsx
const { slug } = await params;
const uploaders = creatorProfiles.filter((uploader) => uploader.schoolSlug === slug);
if (!uploaders.length) notFound();
const programmes = (await getGovernedProgrammes())
  .filter((programme) => programme.school === uploaders[0].school);
```

Preserve the unknown-slug `notFound()` condition. Branch on `programmes.length` after the governed read to render the specified known-locker empty `Card`; do not turn a known locker with zero programmes into a 404.

**Card list composition** (same file, lines 22-27): use `section` + heading + `space-y-3` `Card` list, leaving the uploader grid and `CampusNoteBoard` placement intact.

**Test analog:** `apps/web/__tests__/lib/western-new-york.test.ts`, lines 13-31, uses a local typed fixture and asserts ranking/review outcomes. Add equal-score alphabetical ordering to `rankWesternNewYorkInstitutions` tests, then add Testing Library coverage for notice/link/empty copy rather than implementation-class selectors.

### Peer sorting and detailed public cards

**Apply to:** `lib/peer-guides.ts`, `PeerCommunity.tsx`, peer guide/component tests.

**Primary analog:** `apps/web/lib/peer-guides.ts`

**Pure matching boundary** (lines 15-43):

```ts
if (!profile || profile.interests.length === 0 || !profile.pathwayPreference) {
  return [];
}

return uploaders.flatMap((uploader) => {
  const programme = programmes.find((item) => item.id === uploader.programmeId);
  if (!programme || !matchesDeclaredPath(programme, profile)) return [];
  // Produce only declared-preference reasons.
  return [{ uploader, programme, reasons }];
});
```

Sort the final match array by normalized `uploader.displayName` at this pure boundary, after eligibility filtering and before returning. Do not add GPA, support, engagement, identity, or inferred-fit signals.

**Detailed card / no-match pattern** (source: `apps/web/components/peer-community/PeerCommunity.tsx`, lines 82-115):

```tsx
{matches.length ? (
  <div className="mt-5 grid gap-4 sm:grid-cols-2">
    {matches.map((match) => (
      <Card key={match.uploader.username} className="flex flex-col p-5">
        <h3 ...>{match.uploader.displayName}</h3>
        <Badge tone="brand">{match.programme.name}</Badge>
        <p ...>{match.uploader.bio}</p>
        <p ...>{match.reasons[0]}</p>
        <Link href={`/schools/${match.uploader.schoolSlug}`}>School locker</Link>
      </Card>
    ))}
  </div>
) : (
  <Card className="mt-5 p-6">...</Card>
)}
```

Keep this public-field inventory, the school-locker action, and the existing signed-in/no-profile recovery CTA. Add the locked display-name ordering test to `peer-guides.test.ts` (which already asserts only declared matching inputs at lines 6-22).

### Shared Upstash community quota

**Apply to:** `lib/server/rate-limit.ts`, both submission routes, `rate-limit.test.ts`, route tests.

**Primary analog:** `apps/web/lib/server/rate-limit.ts`

**Policy/service/export shape** (lines 50-78, 125-167, 176-196):

```ts
export const REGISTRATION_POLICY: RateLimitPolicy = {
  limit: 5,
  prefix: 'registration',
  window: { seconds: 3_600, duration: '1 h' },
};

export interface RateLimitService {
  reserveRegistration(ip: string): Promise<RateLimitReservation>;
}

export function reserveRegistration(ip: string): Promise<RateLimitReservation> {
  return getRateLimitService().reserveRegistration(ip);
}
```

Add one `COMMUNITY_SUBMISSION_POLICY` and one `reserveCommunitySubmission(accountId)` method/export. Both `/api/campus-notes` and `/api/peer-connections` must call that one method with the server session ID, after bounded shape validation and before a store write. Never return a remaining count.

**Fail-closed reservation behavior** (lines 221-261):

```ts
if (!limiter || !normalizedIdentity) return unavailableReservation();
try {
  const response = await limiter.reserve(createProviderKey(policy.prefix, normalizedIdentity), ...);
  if (response.allowed) return { status: 'allowed', allowed: true, ... };
  return { status: 'denied', allowed: false, ... };
} catch {
  return unavailableReservation();
}
```

Keep this exact no-write-on-unavailable contract. **Important:** lines 113-119 currently construct `Ratelimit.fixedWindow`; Phase 5 requires a rolling hour. Planner must specify the installed library’s sliding-window configuration and boundary test, rather than silently reusing `fixedWindow`.

**Test analog:** `apps/web/__tests__/lib/rate-limit.test.ts`, lines 15-42 creates an injectable in-memory atomic limiter; lines 143-167 assert unavailable is denied. Extend this fixture to alternate note/inbox calls against one shared key and assert the sixth denial.

### Public DTO mapping and bounded community storage

**Apply to:** `lib/campus-community.ts`, `lib/server/data-store.ts`, campus-notes/peer-connections routes.

**Primary analog:** stored versus input model in `apps/web/lib/campus-community.ts`, lines 1-35:

```ts
export interface CampusNote {
  id: string;
  author_id: string;
  school_slug: string;
  uploader_username: string | null;
  program_id: string | null;
  body: string;
  created_at: string;
}

export function validateCampusNote(input: Omit<CampusNote, 'id' | 'author_id' | 'created_at'>) {
  const errors: string[] = [];
  if (!input.school_slug.trim()) errors.push('Choose a school locker.');
  if (!input.body.trim() || input.body.trim().length > 500) ...
  if (containsContactDetails(input.body)) ...
  return errors;
}
```

Keep persistence-only `author_id` / `sender_id` in stored records. Add explicitly named public DTO interfaces and mapper functions beside these models; routes/components consume the DTO, never an `Omit` assertion at the response call site.

**Read/write and newest-first behavior** (source: `apps/web/lib/server/data-store.ts`, lines 1329-1369):

```ts
return (data.campusNotes ?? [])
  .filter((note) => note.school_slug === schoolSlug && ...)
  .sort((left, right) => right.created_at.localeCompare(left.created_at));

const note: CampusNote = { ...input, body: input.body.trim(), id: randomUUID(),
  author_id: authorId, created_at: new Date().toISOString() };
```

Move public visibility filtering into the server read operation before mapping to the DTO. Preserve server-side trimming/validation/ID creation and newest-first sort. Extend `ScholarScoutData` optional collections (lines 106-124), normalisation (lines 1620-1626), and persisted type guard (lines 1881-1888) together for status/review data.

**Route response pattern** (source: `apps/web/app/api/campus-notes/route.ts`, lines 16-29): authenticate first, return stable `NextResponse.json({ error }, { status })` failures, and let the store own domain validation. Replace the raw `CampusNote` casts/returns in both routes with DTO responses.

### Report / moderation state transitions with CAS

**Apply to:** `data-store.ts`, `operational-records.ts`, report route, staff moderation route/page, integration tests.

**Primary analog:** `apps/web/lib/server/operational-records.ts`

**Bounded CAS retry and duplicate-safe append** (lines 33-57):

```ts
for (let attempt = 0; attempt < 2; attempt += 1) {
  const snapshot = await readVersionedScholarScoutData();
  if (!appendUnique(snapshot.data, input.collection, input.record)) return input.record;
  const result = await writeVersionedScholarScoutData(snapshot.data, snapshot.version);
  if (result.status === 'applied') return input.record;
}
throw new PersistenceConflictError();
```

Use a focused stable-ID/idempotent report operation: atomically transition `public -> pending-review` and create at most one review keyed by note ID. The current `communityMutation` is explicitly no-retry (lines 15-31), so it is not sufficient for the report/publication race; add a narrowly named allowlisted policy/operation rather than broadly changing replacement retry behavior.

**Conflict fixture analog:** `apps/web/__tests__/lib/operational-records.test.ts`, lines 20-72. Reuse its `ConflictStore`, injected interleaving callback, and two-write assertion to prove report/publish race end-state is hidden. Lines 109-124 show the duplicate stable-ID no-op test required for repeated reports.

**State-machine constraints:** public reads accept only `public`; report is idempotent; restore permits only `pending-review -> public`; removal permits only `pending-review -> removed`; a removed record is never republished. Return a safe conflict result (`409`) when a staff action loses the expected transition rather than overwriting it.

### Active staff page and API

**Apply to:** `app/admin/community-moderation/page.tsx`, `app/api/admin/community-moderation/route.ts`, moderation API/page tests.

**Page gate analog:** `apps/web/app/admin/feed/page.tsx`, lines 10-20:

```tsx
const authorization = await requireActiveStaff({
  action: 'view-feed-metrics',
  route: '/admin/feed',
});
if (!authorization.ok) {
  notFound();
}
const metrics = await getPlatformMetrics();
```

Use the same server-only gate before any queue read, with dedicated `community-moderation:read` and `community-moderation:resolve` actions. The page must call `notFound()` on denial (not reveal a role/error client-side).

**Route gate and conflict response analog:** `apps/web/app/api/admin/programmes/route.ts`, lines 18-31 and 34-69:

```ts
const authorization = await requireActiveStaff({ action: 'programme:write', route: '/api/admin/programmes' });
if (!authorization.ok) return authorization.response;
// Parse and validate only after authorization.
if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });
try {
  const record = await saveProgrammeRecord(authorization.actor.id, programme);
  return NextResponse.json({ ok: true, record });
} catch (error) {
  if (error instanceof ProgrammeRevisionConflictError) return NextResponse.json({ error: '...', ... }, { status: 409 });
  throw error;
}
```

`requireActiveStaff` itself records every allow/deny outcome and returns a safe `403` response (`active-staff.ts`, lines 21-52); reuse it rather than a client role check or custom allowlist.

**Test analog:** `apps/web/__tests__/api/admin-programmes.test.ts`, lines 1-24 mock server dependencies under `@jest-environment node`; lines 26-51 assert safe 409 JSON and absence of internal tokens. Apply this to denied, allowed, conflict, restore, and remove tests.

### Community client interactions and Jest component tests

**Apply to:** `CampusNoteBoard.tsx`, `UploaderContactPanel.tsx`, `PeerCommunity.tsx`, component tests.

**Fetch/status/list update pattern** (source: `CampusNoteBoard.tsx`, lines 29-44 and 59-66):

```tsx
const data = (await response.json()) as { note?: CampusNote; error?: string };
if (!response.ok) {
  setStatus(data.error ?? 'Unable to post your note.');
  return;
}
if (createdNote) setNotes((current) => [createdNote, ...current]);
setBody('');
setStatus('Your note is live on this school locker.');

{status ? <p role="status">{status}</p> : null}
```

Change the type to the public DTO, preserve `role="status"`, add disabled/sending state, and implement report success as `setNotes(current => current.filter(...))` only after a successful response. Failure keeps the row and focusable report control. Place the exact shared quota sentence before both submit controls: `CampusNoteBoard.tsx` lines 51-59 and `UploaderContactPanel.tsx` lines 35-41 are the two insertion analogs.

**Component-test pattern:** `apps/web/__tests__/components/advisor/AdvisorChat.test.tsx`, lines 1-16 resets mocks and sets `global.fetch`; lines 49-76 sequences non-OK/success responses with accessible text assertions. Use `userEvent`, role/text queries, Unicode fixtures, and assertions for shared helper text, status messages, report hide/failure retention, and no rendered identifier/contact fields.

## Shared Patterns

### Authentication and authorization

**Sources:** `apps/web/app/api/campus-notes/route.ts:16-18`; `apps/web/lib/server/active-staff.ts:21-52`  
**Apply to:** all mutating community routes; staff page/API.

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Sign in to post a note.' }, { status: 401 });
}
```

Mutating report routes also require a signed-in session. Use only the derived session ID for author, reporter, and quota identity.

### Error and API response conventions

**Source:** `apps/web/app/api/admin/programmes/route.ts:44-69`  
**Apply to:** all Phase 5 API routes.

Validate bounded input, return `{ error }` or `{ errors }` with explicit 400/401/403/409/429/503 statuses, and rethrow unexpected errors. Quota unavailability must be a safe no-write `503`; quota denial must be `429`, without remaining counts.

### Persistence normalisation

**Source:** `apps/web/lib/server/data-store.ts:1610-1626,1881-1888`  
**Apply to:** every new persisted note status/moderation review field.

All persisted additions require the interface collection, normalization default, and structural/domain validator together; absent legacy collections normalize to `[]`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/web/components/admin/CommunityModerationQueue.tsx` | component | request-response | No focused staff moderation queue exists. Compose the staff page/API gate and `CampusNoteBoard` list/action/status patterns; do not embed this workflow in `ProgrammeAdminManager`. |

## Metadata

**Analog search scope:** `apps/web/app`, `apps/web/components`, `apps/web/lib`, `apps/web/__tests__`  
**Files scanned:** 24  
**Pattern extraction date:** 2026-08-29
