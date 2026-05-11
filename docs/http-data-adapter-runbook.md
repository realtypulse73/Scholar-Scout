# ScholarScout HTTP Data Adapter Runbook

Use this runbook when `SCHOLARSCOUT_DATA_ADAPTER=http` backs account, shortlist, onboarding, admin programme, and audit data. For the Vercel-native Blob adapter, use [`vercel-blob-data-adapter.md`](vercel-blob-data-adapter.md).

## Runtime Contract

The configured service URL stores one ScholarScout data document.

- `GET SCHOLARSCOUT_DATA_SERVICE_URL` returns the full JSON document.
- `GET /health` returns a simple service health response for the local fixture and any compatible service that chooses to expose it.
- `GET` may return `404` for an empty store; ScholarScout treats that as an empty data document.
- `PUT SCHOLARSCOUT_DATA_SERVICE_URL` replaces the full JSON document.
- `PUT` must accept `Content-Type: application/json`.
- Invalid JSON writes should return `400` with a practical error.
- If `SCHOLARSCOUT_DATA_SERVICE_TOKEN` is set, the app sends `Authorization: Bearer <token>` on both reads and writes.

The document shape is:

```json
{
  "users": [],
  "onboardingProfiles": {},
  "shortlists": {},
  "programmeRecords": [],
  "auditEvents": []
}
```

## Environment Setup

Set these in the deployment environment:

```bash
SCHOLARSCOUT_DATA_ADAPTER=http
SCHOLARSCOUT_DATA_SERVICE_URL=https://your-data-service.example/scholarscout
SCHOLARSCOUT_DATA_SERVICE_TOKEN=replace-with-service-token
NEXTAUTH_SECRET=replace-with-nextauth-secret
NEXTAUTH_URL=https://your-scholar-scout-domain.example
```

Keep `SCHOLARSCOUT_DATA_SERVICE_TOKEN` out of client bundles, logs, and docs. Rotate it whenever staff access changes or the service endpoint moves.

## Smoke Checks

Before a deployment:

```bash
npm run test
npm run typecheck
npm run lint
npm run build:vercel
npm run vercel:docker-free
```

For local contract verification without Docker, run the fixture service:

```bash
npm run dev --workspace @scholar-scout/http-data-service
```

Then point the web app at:

```bash
SCHOLARSCOUT_DATA_ADAPTER=http
SCHOLARSCOUT_DATA_SERVICE_URL=http://localhost:4010/scholarscout
```

If the fixture has `SCHOLARSCOUT_DATA_SERVICE_TOKEN` set, use the same value in the web app environment.

After deployment:

1. Sign in with a staff account.
2. Open `/admin/programmes`.
3. Create or update a draft programme record.
4. Confirm the record appears in the staff list with a revision label.
5. Confirm the audit trail shows the programme change.
6. If publishing a record, confirm source name and verification date are present before saving.
7. Open `/programmes` and confirm only published governed records appear publicly.

## Backup And Restore

Because the current HTTP adapter writes the full data document, the service should keep versioned backups for every successful write.

- Back up the document before accepting each `PUT`.
- The local fixture writes timestamped backups beside the active document.
- Store timestamped versions for audit and rollback.
- Restore by replacing the service document with a known-good backup.
- After restore, restart or redeploy the app only if the service URL or token changed.

## Monitoring

Alert on these conditions:

- `GET` returns a non-`200`/`404` response.
- `PUT` returns any non-`2xx` response.
- Read or write latency exceeds the service target.
- The service receives a request without the expected bearer token.
- The document cannot be parsed as JSON.

## Rollback

If the service is unavailable and local operation is acceptable:

```bash
SCHOLARSCOUT_DATA_ADAPTER=json
SCHOLARSCOUT_DATA_FILE=data/scholarscout-data.json
```

This restores the local JSON adapter. Before switching back to `http`, export or migrate any JSON changes that should remain in the service-backed document.

## Future Service Improvements

The current app adapter intentionally avoids heavy deployment dependencies. A production service should eventually add narrower endpoints for account profiles, shortlists, programme records, revisions, and audit events so staff edits do not require full-document writes.
