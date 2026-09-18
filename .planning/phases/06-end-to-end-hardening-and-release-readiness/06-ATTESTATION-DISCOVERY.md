# Phase 6 Preview Attestation Discovery

**Observed:** 2026-09-18 21:51:10 UTC  
**Purpose:** Approved, non-secret Vercel GitHub Deployment/status semantics for the Phase 6 Preview attestation.

## Accepted Provider Semantics

The following one real Git-integrated Vercel Preview deployment was inspected read-only for the immutable Phase 6 candidate:

| Field | Observed value |
| --- | --- |
| Candidate SHA | `bb252ef3e9bfc19ef4d8c701babefb8b8722fcc5` |
| Deployment ID | `6529912226` |
| Deployment creator login | `vercel[bot]` |
| Deployment creator type | `Bot` |
| Deployment environment | `Preview` |
| Deployment created at | `2026-09-18T21:51:10Z` |
| Status ID | `18536621607` |
| Status state | `success` |
| Status environment | `Preview` |
| Status URL | `https://scholar-scout-8rq97fj36-scholar-scout.vercel.app` |
| Status created at | `2026-09-18T21:51:10Z` |

The status target is a normalized HTTPS Preview URL. The observed deployment and status use the same Preview environment semantics and timestamp.

## Release-Gate Freshness Policy

Scholar Scout Phase 6 accepts a deployment status only when its GitHub `created_at` is no more than **900 seconds** old, measured against the runner's injected current UTC time. Missing, malformed, future, stale, non-Preview, non-successful, or ambiguous provider records fail the release gate before any lifecycle or browser traffic.

## Boundary Confirmation

- The accepted identity source is the observed GitHub Deployment/status record, not workflow-supplied metadata.
- The observed creator/environment values above are the allowlist semantics for Plan 06-09's independently controlled attestation.
- This record intentionally excludes credentials, provider payloads, headers, cookies, fixture material, Blob paths, student data, and all other sensitive configuration.
