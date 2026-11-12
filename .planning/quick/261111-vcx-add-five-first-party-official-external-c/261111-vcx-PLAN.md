---
quick_id: 261111-vcx
title: Add five official external catalogue sources
status: ready
mode: quick-validate-inline
must_haves:
  truths:
    - Five named, first-party official sources appear as separate local Greater Houston catalogue records.
    - The Phase 11 UAT fixture remains byte-for-byte unchanged and keeps no outbound source link.
    - Every rendered outbound catalogue link is visibly labelled as an official external source and retains safe new-tab attributes.
    - The active catalogue snapshot and manifest preserve append-only lineage and pass integrity validation.
    - Each new official-source record has one project-owned, original photorealistic contextual image with an explicit non-affiliation disclosure.
  artifacts:
    - apps/web/data/scholarscout-data.json
    - apps/web/components/catalogue/CatalogueOpportunityCard.tsx
    - apps/web/components/catalogue/CatalogueFocusView.tsx
    - apps/web/components/catalogue/CatalogueComparison.tsx
    - apps/web/__tests__/lib/catalogue-discovery.test.ts
  key_links:
    - Published records map their official first-party URLs to the discovery model only when they are not the local Phase 11 fixture.
    - The active snapshot digest and matching manifest cover the five added records plus the existing fixture.
---

# Quick Task 261111-vcx: Add five official external catalogue sources

## Scope

Add five separate, source-backed catalogue records to the local Greater Houston snapshot:

1. Houston City College — Programs & Courses (`https://www.hccs.edu/programs--courses/`)
2. Lone Star College — Programs of Study (`https://www.lonestar.edu/programs-of-study/`)
3. San Jacinto College — Areas of Study (`https://www.sanjac.edu/programs/areas-of-study/`)
4. U.S. Department of Labor — Apprenticeship Job Finder (`https://www.apprenticeship.gov/apprenticeship-job-finder`)
5. Federal Student Aid — Types of Financial Aid (`https://studentaid.gov/understand-aid/types`)

Do not alter the local-only `phase11-uat-community-pathway` fixture or add remote media, deployment, production configuration, provider affiliation, availability, cost, or eligibility claims.

## Tasks

1. Add a new append-only local snapshot and manifest that retain the existing fixture and include five separate official-source records, using only source-backed, bounded factual claims and explicit unknown facts where the source does not support a card field.
2. Make external-link labels consistent across the discovery card, detail/focus, and comparison views, without adding an official URL for the local Phase 11 fixture; update focused tests for the label and fixture boundary.
3. Add integrity-focused coverage for the records and run focused tests, typecheck, lint, JSON/snapshot integrity validation, and whitespace checks. Commit only task files locally; do not push.
4. Copy the five approved original images into project-owned static assets and attach each only to its matching new record as static generated context. Preserve the Phase 11 fixture as text-only, use accurate alt text and a non-provider/non-campus disclosure, then update coverage and revalidate locally.
