# ScholarScout Vercel Blob Data Adapter

Use this adapter when ScholarScout runs on Vercel and needs durable account, shortlist, onboarding, admin programme, and audit data without operating a separate service.

## Runtime Setup

Create a private Vercel Blob store and expose a read-write token to the app environment.

```bash
SCHOLARSCOUT_DATA_ADAPTER=vercel-blob
BLOB_READ_WRITE_TOKEN=replace-with-vercel-blob-token
NEXTAUTH_SECRET=replace-with-nextauth-secret
NEXTAUTH_URL=https://your-scholar-scout-domain.example
```

Optional overrides:

```bash
SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN=replace-with-dedicated-token
SCHOLARSCOUT_BLOB_DATA_PATH=scholarscout/data.json
```

`SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN` takes priority over `BLOB_READ_WRITE_TOKEN` when both are present. The default blob path is `scholarscout/data.json`.

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

## Smoke Checks

Before deploy:

```bash
npm run test
npm run typecheck
npm run lint
npm run build:vercel
npm run vercel:docker-free
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
