# ScholarScout Production Incident Response

Use this when production smoke checks, data health checks, OAuth, or staff operations start failing.

## First Five Minutes

1. Open the latest **ScholarScout Production Monitor** run.
2. Read the workflow summary first, then download `production-smoke-report.json` if the summary is unclear.
3. Check whether the failing item is public route access, Auth.js provider discovery, data health, backup retention, or staff export access.
4. Avoid restore or credential rotation actions until a current data snapshot exists.
5. If admin data might be affected, sign in as staff and export a snapshot from `/api/admin/data/export`.

## Common Failure Paths

| Signal | Likely cause | First action |
|---|---|---|
| Public route returns non-200 | Deployment, routing, or runtime failure | Check hosting deployment logs and rollback if a known-good deployment exists |
| Expected auth provider missing | OAuth env var pair missing or provider callback misconfigured | Run production env readiness and inspect `/api/auth/providers` |
| Data adapter is not durable | Wrong `SCHOLARSCOUT_DATA_ADAPTER` or missing data-store token | Do not write data; correct env and redeploy |
| Data status has issues | Adapter config, local JSON fallback, or data-store read failure | Compare readiness report with deployed env and check data provider health |
| Backup retention failed | Backup history drift or duplicate/nested backups | Export snapshot, review backup history, then plan cleanup |
| Health freshness failed | Slow response, stale cache, or clock skew | Re-run monitor and compare platform time before rotating secrets |
| Request timed out or failed | Deployment down, DNS/routing issue, or timeout too short | Check hosting status first; only raise `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` after confirming the app is healthy but slow |
| Latency check failed | Deployment is reachable but slow for at least one smoke request | Check hosting metrics and recent deploy changes before raising `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` |
| Staff export failed | Expired staff cookie or staff authorization problem | Prefer health-token checks; refresh cookie only if export monitoring is needed |

## Data Safety

Before any restore:

1. Export the active data snapshot.
2. Validate the snapshot in the admin data operations panel.
3. Preview saved-backup restore impact.
4. Require the `RESTORE SCHOLARSCOUT DATA` confirmation phrase for any restore execution.
5. Record the backup id created before restore.

## Credential Response

Rotate credentials only when evidence points to expiry, compromise, or provider-side invalidation.

After rotation:

```bash
npm run check:production-env
npm run smoke:production
```

If the change affects monitoring, run **ScholarScout Production Readiness** and then manually trigger **ScholarScout Production Monitor**.

## Communication Notes

Keep updates practical:

- What is affected.
- What is still working.
- Whether student-facing programme discovery is available.
- Whether staff data operations are paused.
- Next check time and owner.

Do not paste secrets, cookies, exported snapshots, or full data documents into issue trackers or chat.

## Local Workaround Boundary

The `.env.prelaunch.local` path is for local rehearsal plumbing only. If an incident involves a public deployment, do not switch it to credentials-only auth or a localhost data service. Use the production provider secrets and durable adapter instead.
