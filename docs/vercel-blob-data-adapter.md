# ScholarScout Vercel Blob Data Adapter

Use this adapter when ScholarScout runs on Vercel and needs durable account, shortlist, onboarding, admin programme, and audit data without operating a separate service.

## Command Prerequisite

The root `packageManager` selects pnpm 10.34.5. Run `corepack enable` once, then use `pnpm install --frozen-lockfile --ignore-scripts` before running the commands below.

## Runtime Setup

Create a private Vercel Blob store and expose a read-write token to the app environment.

```bash
SCHOLARSCOUT_DATA_ADAPTER=vercel-blob
BLOB_READ_WRITE_TOKEN=replace-with-vercel-blob-token
NEXTAUTH_SECRET=replace-with-nextauth-secret
NEXTAUTH_URL=https://your-scholar-scout-domain.example
SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID=current-recovery-key-id
SCHOLARSCOUT_RECOVERY_SIGNING_SECRET=replace-with-dedicated-recovery-secret
```

Optional overrides:

```bash
SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN=replace-with-dedicated-token
SCHOLARSCOUT_BLOB_DATA_PATH=scholarscout/data.json
```

`SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` takes priority over `BLOB_READ_WRITE_TOKEN` when both are present. The default blob path is `scholarscout/data.json`.

Use dedicated recovery signing material. The current key signs new packages and plans; one explicitly configured previous key pair may verify packages during the bounded retention or incident-hold grace period. Configure both previous-key variables together, remove them after the grace period, and never use `NEXTAUTH_SECRET` as a recovery fallback.

## Data Shape

The adapter stores the same full ScholarScout document used by the JSON and HTTP adapters:

```json
{
  "users": [],
  "onboardingProfiles": {},
  "shortlists": {},
  "programmeRecords": [],
  "auditEvents": []
}
```

Reads use private Blob access with cache bypass. Writes overwrite the same JSON blob with `contentType: application/json` and a short cache window so staff changes can be read back quickly.

A missing blob is the only empty-store condition. Authentication errors, malformed stored JSON, timeouts, and provider failures are operational failures: the admin surface retains any last verified values read-only, disables mutations, and displays a safe category and incident ID until a fresh read succeeds.

Approved restore/import applies through one application-port document write after fresh active-staff authorization, count-only preview, non-empty reason, and exact typed confirmation. Preview and audit output never include snapshot or student content. Incident-hold release remains an authenticated server-only operator route with exact incident identity, reason, and lifecycle audit; Phase 3 has no delete or hold-release UI.

## Smoke Checks

Before deploy:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build:vercel
pnpm vercel:docker-free
```

After deploy:

1. Sign in with a staff account.
2. Open `/admin/programmes`.
3. Save a governed programme record.
4. Confirm the record appears with a revision label and audit event.
5. Open `/programmes` and confirm published governed records are visible publicly.

## Rollback

If Blob storage is unavailable, switch back to the JSON adapter for local operation or the HTTP adapter for a compatible hosted service:

```bash
SCHOLARSCOUT_DATA_ADAPTER=json
```

or

```bash
SCHOLARSCOUT_DATA_ADAPTER=http
SCHOLARSCOUT_DATA_SERVICE_URL=https://your-data-service.example/scholarscout
```

Before switching adapters permanently, copy any records that should remain in the target backing store.

## Follow-Up Work

The Blob adapter is durable and Vercel-native, but it still writes the full data document. A future database or CMS adapter should expose narrower record-level writes for staff programme updates, account profiles, shortlists, and audit history.

Phase 3 does not claim provider transactions, compare-and-set, crash atomicity, or concurrent-write conflict protection. Those guarantees are Phase 4 work.
