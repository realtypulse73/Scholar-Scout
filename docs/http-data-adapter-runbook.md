# ScholarScout HTTP Data Adapter Runbook

Use this runbook when `SCHOLARSCOUT_DATA_ADAPTER=http` backs account, shortlist, onboarding, admin programme, and audit data. For the Vercel-native Blob adapter, use [`vercel-blob-data-adapter.md`](vercel-blob-data-adapter.md).

## Command Prerequisite

The root `packageManager` selects pnpm 10.34.5. Run `corepack enable` once, then use `pnpm install --frozen-lockfile --ignore-scripts` before running the commands below.

## Runtime Contract

The configured service URL stores one ScholarScout data document.

- `GET SCHOLARSCOUT_DATA_SERVICE_URL` returns the full JSON document with a strong `ETag` that is opaque to application records.
- `GET /health` returns a simple service health response for the local fixture and any compatible service that chooses to expose it.
- `GET` returns `404` only when the document is genuinely absent; ScholarScout may treat that verified absence as an empty data document.
- Malformed stored JSON and provider/I/O read failures return `500`. They are operational failures, never editable empty data.
- `PUT SCHOLARSCOUT_DATA_SERVICE_URL` replaces the full JSON document only when its conditional precondition succeeds.
- Updating an existing document requires `If-Match: <etag-from-GET>`. Creating the first document requires `If-None-Match: *`.
- A missing, stale, or mismatched precondition returns `412 Precondition Failed` and does not write or create a backup.
- Successful `PUT` returns the new strong `ETag`. The local fixture holds an exclusive sibling-file lock from the precondition read through backup and atomic replacement, so separate local service instances and processes that share the configured data path cannot both accept one version.
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
SCHOLARSCOUT_RECOVERY_SIGNING_KEY_ID=current-recovery-key-id
SCHOLARSCOUT_RECOVERY_SIGNING_SECRET=replace-with-dedicated-recovery-secret
```

Keep `SCHOLARSCOUT_DATA_SERVICE_TOKEN` out of client bundles, logs, and docs. Rotate it whenever staff access changes or the service endpoint moves.

Recovery signing is separate from authentication signing. The current recovery key signs new packages and plans. During a controlled rotation, an explicitly configured previous key ID and secret may verify existing packages for the bounded retention or incident-hold grace period. Configure the previous pair together and remove it after the grace period. Recovery never falls back to `NEXTAUTH_SECRET`.

## Smoke Checks

Before a deployment:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build:vercel
pnpm vercel:docker-free
```

For local contract verification without Docker, run the fixture service:

```bash
pnpm --filter @scholar-scout/http-data-service dev
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

The HTTP compatibility adapter still stores one physical document, but ordinary application writes now enter through named programme, student, operational, or platform operations. Each operation composes its bounded change from one versioned snapshot and commits it conditionally.

- Back up the document before accepting each `PUT`.
- The local fixture writes timestamped backups beside the active document.
- Store timestamped versions for audit and rollback.
- Restore by replacing the service document with a known-good backup.
- After restore, restart or redeploy the app only if the service URL or token changed.

Scholar Scout performs one conditional application-port document write for an approved recovery. Before Apply, it requires a fresh active-staff authorization, a count-only server preview, a non-empty operator reason, and the exact typed confirmation. Apply reads the current document and opaque ETag together, verifies the signed actor/source/application digest bindings, and supplies that ETag only to the final write. A `412` race returns `recovery-state-changed`; current data is preserved and no success outcome is persisted. Provider ETags never enter recovery envelopes, previews, backups, or audit records. Retry only by refreshing and creating a new plan.

An incident hold may be resolved only through the authenticated server route by currently authorized staff, with the exact incident identity and a non-empty reason. The service records a lifecycle audit event. Phase 3 intentionally provides no delete or hold-release control in the browser UI.

The application now has tested optimistic compare-and-set behavior at this provider boundary, including deterministic contention between independent service instances sharing one local file. This is not a multi-document or distributed database transaction: the HTTP fixture remains a local one-document compatibility service, and its coordination and crash scope are the exclusive sibling lock plus atomic same-directory replacement provided by the host filesystem. Do not use the fixture as evidence that unrelated hosts or network filesystems provide the same lock semantics.

## Monitoring

Alert on these conditions:

- `GET` returns a non-`200` response other than a verified missing-document `404`.
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

## Compatibility And Migration Scope

Existing `GET` compatibility reads remain supported. Raw unconditional replacement is not used by migrated ordinary domain modules; the signed recovery/import boundary is the intentional whole-document composition seam and it uses the same conditional write contract. A future service may expose narrower physical endpoints without changing these application-level operation contracts.

No production migration, provider write, or deployment was performed as part of this change.
