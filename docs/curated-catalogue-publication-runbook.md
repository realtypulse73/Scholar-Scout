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

## Weekly release: administrator procedure

Use `/admin/catalogue-publications` to make a normal release. Only an active staff
member with `administrator` capability can preview or publish it.

1. Confirm every selected candidate is approved and its six-category checklist is passing.
2. Select the approved records and choose **Preview weekly release**. This never writes a
   snapshot, candidate, or audit event.
3. Read the server-provided preview. It shows the stable selected order, quarantine
   corrections, factual media fallbacks, the `YYYY-Www` ISO-week key, and whether the
   release is eligible.
4. A normal release is eligible only from **Monday 09:00 inclusive until 17:00 exclusive,
   America/New_York**, and only once for that ISO-week. Do not calculate the time locally;
   the publish command checks it again.
5. Select **Publish weekly** only after the preview is correct. The server repeats all
   checklist, selection, schedule, and conditional-write checks before it creates the new
   immutable snapshot and manifest.

If the server reports that the window has closed, that this ISO-week already published, or
that the state changed, do not retry blindly. Reload the preview. A checklist failure
quarantines only the affected selected candidate and leaves the current public snapshot and
private candidate work intact. Correct the ordered flags, resubmit, and obtain the required
review before a later release.

## Emergency correction: reviewer procedure

An active `reviewer` can make a checked emergency correction when a factual issue requires
an immediate replacement. The correction must include the candidate's current revision, the
complete corrected candidate JSON, and a bounded reason describing the urgency.

1. Re-check source, material evidence, freshness, claim boundary, regional boundary, and
   media-rights status.
2. In the **Emergency correction** panel, choose the approved candidate, paste the corrected
   candidate JSON, enter the reason, and submit.
3. Read the result and the snapshot history. The result is an `emergency` snapshot and
   manifest, distinct from a weekly release.

Emergency correction is exempt from the Monday schedule and does not use the weekly slot. It
is not exempt from the automated checklist, authorization, reason, or conditional-write
requirements. A conflict or failed checklist preserves the current public snapshot; reload,
correct the private draft, and try only after the issue is resolved.

## Retirement and restore: administrator procedure

A `retire` intake change is private until its approved candidate is included in a later
weekly release. That release removes the record from the new public snapshot while retaining
the previous snapshot, manifest, and audit history.

To restore a retained snapshot, an active `administrator` chooses its snapshot ID in the
**Restore retained snapshot** panel and records a bounded reason. Restore appends a new
`restore` snapshot with lineage back to the chosen version; it never changes the old snapshot
or manifest. If the command reports a conflict, reload snapshot history and repeat the
decision against the current state.

## Safe history

Authorized staff can view concise lifecycle history: actor, capability, action, timestamp, outcome, required reason when present, correction/review status, and candidate revision. The history exposes only the six checklist categories and the fixed pass-meaning statement; it excludes raw candidates, import files, learner data, secrets, capabilities configuration, and private provider details.

Snapshot history is redacted release evidence: actor, capability, action, timestamp, outcome,
version, release kind, required reason, correction/review status, and manifest lineage. It
excludes raw candidate data, imports, learner data, provider-private material, and secrets.

## Public read boundary and final checks

Learners receive data only from the reviewed stored catalogue snapshot. Neither learner
requests nor the staff release workflow retrieves, scrapes, aggregates, or depends on a live
provider website at request time. Media without current documented rights falls back to
factual text and source links; it does not suppress the factual record.

Before a weekly or emergency action, verify:

- Your normalized email is active and has the correct nonempty capability array.
- The candidate is within the one-to-25, schema-version-1 intake rules and has no stale
  revision conflict.
- The six automated checklist categories and the editorial-completeness disclosure are
  visible and understood.
- The action, reason (when required), anticipated release kind, and current manifest lineage
  are correct.
- No secret value, token, learner information, raw import, or provider-private notes will be
  entered into an audit reason or copied into documentation.
