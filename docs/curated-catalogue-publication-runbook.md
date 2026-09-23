# Curated Catalogue Publication Runbook

## Purpose

Use this process to stage and review small, source-backed opportunity records. Staging and review stay private. They do not update the learner catalogue or contact provider websites.

## Staff capabilities

Set `SCHOLARSCOUT_STAFF_EMAILS` to the current, comma-separated active staff allowlist. Set `SCHOLARSCOUT_CATALOGUE_STAFF_CAPABILITIES` to a server-only JSON object that maps each normalized lowercase email to a nonempty, duplicate-free capability array.

```json
{
  "editor@example.org": ["editor"],
  "reviewer@example.org": ["reviewer"],
  "administrator@example.org": ["editor", "administrator"]
}
```

- `editor` stages, corrects, and resubmits records they created.
- `reviewer` approves another editor’s passing record.
- An actor with both `editor` and `administrator` may approve their own passing record. The automated checklist still runs.

Never place this configuration, a token, raw import content, student information, or provider-private notes in an API response or audit note.

## Intake file

Send one through 25 changes to `POST /api/admin/catalogue-publications/import`. The endpoint accepts only schema version 1 and makes one conditional all-or-nothing private mutation.

```json
{
  "schemaVersion": 1,
  "changes": [
    {
      "action": "upsert",
      "candidate": {
        "id": "catalogue:example-training",
        "title": "Example training",
        "regionId": "greater-houston",
        "region": { "...": "approved regional boundary metadata" },
        "source": { "...": "official source metadata" },
        "facts": { "...": "source-backed factual card fields" },
        "claimBoundary": "Factual programme details from the official source."
      }
    }
  ]
}
```

An existing candidate needs its current `expectedRevision`. A `retire` change needs the existing stable ID and its current revision. It records a private retirement intent only; it does not delete or alter a public snapshot.

```json
{
  "schemaVersion": 1,
  "changes": [
    { "action": "retire", "id": "catalogue:example-training", "expectedRevision": 3 }
  ]
}
```

Malformed, oversized, deeply nested, duplicate, stale, or 26-change files are rejected without a partial write. Reload after a conflict and apply the correction to the newest candidate revision.

## Checklist and review

The server checks these six categories every time a record is staged, resubmitted, or reviewed:

1. source
2. material evidence
3. freshness
4. claim boundary
5. regional boundary
6. media-rights status

**A pass means editorial completeness, not verified real-world provider truth.**

When a check fails, keep the record private as a draft, correct the ordered list of flagged categories, and resubmit it. Any edit removes the previous approval and requires a new review. If provider-media rights are missing, expired, revoked, or uncertain, remove the media and keep the factual text plus official source links.

## Safe history

Authorized staff can view concise lifecycle history: actor, capability, action, timestamp, outcome, required reason when present, correction/review status, and candidate revision. The history exposes only the six checklist categories and the fixed pass-meaning statement; it excludes raw candidates, import files, learner data, secrets, capabilities configuration, and private provider details.

Snapshot release, restore, and emergency-publication procedures are intentionally separate from this private intake process.
