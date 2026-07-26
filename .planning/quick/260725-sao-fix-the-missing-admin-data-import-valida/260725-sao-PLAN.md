# Quick Task 260725-sao: Fix the missing admin data import validation route module

## Goal

Restore the missing staff-only admin data API route modules so import validation and its related restore workflows can execute against the existing data-store contracts.

## Tasks

1. Add staff-authorized routes for data status, backup listing, import validation, and import restore, plus the separately token-protected health endpoint.
   - Verify malformed JSON and invalid snapshots return useful `400` responses, and restores require the explicit confirmation phrase.
2. Add staff-authorized backup restore plan and backup restore routes.
   - Verify missing backups return `404` and successful restores delegate to the existing data-store APIs.
3. Run the focused admin data route test, then the full workspace suite.

## Expected outcome

The admin-data API test resolves all imported route modules and passes without weakening the existing confirmation or staff-authorization boundary.
