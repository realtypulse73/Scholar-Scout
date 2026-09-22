# Regional Opportunity Navigator — Architecture Research

**Researched:** 2026-09-22  
**Scope:** Six-area source-verified opportunity catalogue
**Confidence:** High for application integration boundaries; medium for catalogue operations pending source-owner confirmation

## Executive Architecture Decision

Extend the existing governed-programme boundary instead of creating a second discovery service or fetching provider pages at request time. A published opportunity record must carry its own metro membership, pathway type, field-level source evidence, freshness state, and media-rights declaration. Server pages obtain only published records through `getGovernedProgrammes()`; pure client-safe matching functions turn those records and ordinary, student-controlled preferences into explanation-first cards. Staff are the only writers. Sensitive circumstances remain outside the persisted recommendation profile and can open only a local, purpose-specific referral interaction.

This preserves the active Next.js 15 / TypeScript / NextAuth / Vercel architecture and avoids the whole-document store's most dangerous failure mode: a broad catalogue import overwriting current student or operational data.

## Current Architecture and Reusable Seams

| Concern | Current seam | Required v1.1 use |
|---|---|---|
| Public catalogue read | `apps/web/lib/server/programme-records.ts` → `getGovernedProgrammes()` | All server-rendered metro listings and provider pages use this boundary, never the seed `programmes` array. |
| Publication and conflict control | `apps/web/lib/admin-programmes.ts`, `apps/web/app/api/admin/programmes/route.ts`, `ProgrammeRevisionConflictError` | Treat metro/citation/media updates as a normal staff record revision; retain the existing explicit `409` conflict/reload flow. |
| Field evidence | `apps/web/lib/programmes.ts` (`factEvidence`, documented support), `apps/web/lib/opportunity-matching.ts` | Add catalogue facts as field-scoped evidence, not a provider-wide “verified” boolean. |
| Student rendering | Server App Router pages pass serializable records to client feature components. | Keep source URLs, dates, evidence states, and rights-safe media metadata serializable; never import `lib/server` into a client component. |
| Ranking/explanations | `rankOpportunityMatches()` and `OpportunityMatchCard` | Use one deterministic view model across listing, detail, and recommendation surfaces. Never re-create ranking in a component. |
| Sensitive referral | `components/support/SensitiveReferralPanel.tsx`, `lib/sensitive-referral-directory.ts` | Continue local-memory consent and allowlisted public links only; no POST, analytics event, URL parameters, or profile field. |
| Staff management | `ProgrammeAdminManager`, active-staff route guard, data-store validation | Extend the existing staff form and validation contract rather than exposing source imports or edit controls to students. |

The Phase 7 implementation already demonstrates the intended pattern: `OpportunityMatchCard` renders last-reviewed/source information and `SensitiveReferralPanel` uses an allowlisted local fixture. The regional catalogue should generalize those contracts; it should not add a parallel catalogue, “fit” scorer, or referral database.

## Target Logical Architecture

```text
Official boundary authority + first-party/official pathway source
                  │
                  ▼
Staff research worksheet / approved import package (outside request path)
                  │ validate source authority, dates, wording, media rights
                  ▼
Admin route (requireActiveStaff + exact validation + CAS revision)
                  │
                  ▼
ScholarScoutData.programmeRecords (published staff records only)
                  │
                  ▼
getGovernedProgrammes() merge boundary
        ┌─────────┴─────────────────┐
        ▼                           ▼
Server pages                    Pure opportunity matcher
metro index / provider page     ordinary preferences + evidence only
        │                           │
        └─────────► serializable OpportunityMatch ◄─────────┘
                              │
             card: reasons + source/date/state + verify + compare/save
                              │
          optional sensitive category (client memory only)
                              ▼
              purpose-specific consent → allowlisted referral information URL
              (no identity, answers, provider POST, rank effect, or retention)
```

## Catalogue Record Model

Keep the existing `Programme` as the persistence and publication aggregate. Add finite unions and optional, backward-compatible fields; normalize missing legacy values to `unknown` at read/render time. Do not make a legacy record disappear merely because it predates the v1.1 evidence schema.

```ts
type MetroId =
  | 'greater-houston'
  | 'greater-chicago'
  | 'greater-buffalo'
  | 'greater-atlanta'
  | 'greater-new-orleans'
  | 'greater-kingston-jamaica';

type OpportunityType =
  | 'university'
  | 'community-college'
  | 'trade'
  | 'registered-apprenticeship'
  | 'employer-linked-training'
  | 'military-information';

type EvidenceState = 'current' | 'needs-confirmation' | 'unknown' | 'conflicting';
type MediaRights = 'scholarscout-owned' | 'licensed' | 'provider-approved' | 'approved-embed' | 'none';

interface SourceEvidence {
  state: EvidenceState;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceType: 'official-provider' | 'government' | 'official-workforce' | 'licensed-media';
  checkedAt?: string;
  publishedOrEffectiveAt?: string;
  nextReviewAt?: string;
  verificationPrompt: string;
}

interface RegionalOpportunityFields {
  metroIds: MetroId[];
  opportunityType: OpportunityType;
  boundaryEvidence: SourceEvidence;
  providerEvidence: SourceEvidence;
  requirementsEvidence?: SourceEvidence;
  payContextEvidence?: SourceEvidence; // occupation/area context only
  media?: { url?: string; rights: MediaRights; evidence: SourceEvidence };
}
```

Implementation cautions:

- `requirementsEvidence` contains published requirements and a verification action. It does not contain a student eligibility verdict.
- Pay context is separate from provider facts, labelled as dated occupational/area context, and is never a ranking signal or outcome promise.
- A record can be visible with `unknown`, `needs-confirmation`, or `conflicting` facts. Only unpublished/withdrawn records are excluded through the existing publication status.
- Multiple metro memberships are allowed only when each has boundary evidence. A campus/provider’s marketing name is not a metro definition.
- `military-information` must only link to official informational/education pages and preserve an especially explicit human-verification prompt; it is not a recruiting segment.

## Provenance, Freshness, and Staff Review

### Source authority ladder

1. First-party provider catalogue, requirements, admissions, sponsor, or official service/DoD/VA page.
2. Government registry or dataset for boundary, IPEDS/College Navigator, registered apprenticeship, labour/occupation, or public education facts.
3. Official state/local education or workforce authority corroboration.
4. Explicitly licensed or provider-approved media/embeds for visual content only.

Do not publish scraped summaries, search-result snippets, affiliate pages, social posts, unlicensed images/video, paid-placement copy, or AI-inferred claims as evidence. Secondary sources may flag a research lead but cannot satisfy publication validation on their own.

### Record lifecycle

```text
draft → in-review → published → needs-review / withdrawn
          │             │
          │             └─ public read only when every mandatory source contract passes
          └─ reviewer owns missing source, rights, date, and claim corrections
```

The existing status enum has `draft`, `in-review`, and `published`; preserve it for the first increment. Represent review-needed facts with field evidence state rather than silently changing a published record's availability. If a provider/programme has been withdrawn, staff unpublish the record through the existing audited mutation path. A later operational phase may add an explicit `withdrawn` status only with migration, filtering, and UI coverage.

Publication validation should require, for each displayable material fact:

- source authority/type, HTTPS URL, source label, `checkedAt`, and review deadline;
- `current`, `needs-confirmation`, `unknown`, or `conflicting` state plus user-facing verification wording;
- a source-backed fact/value or an explicit unknown—not a blank that renders as confirmed;
- a media-rights state; an image/video URL is invalid without an approved rights basis;
- reviewer/assignee evidence for in-review records and CAS revision protection on saves.

Freshness is a deterministic status calculation: compare `nextReviewAt` to the server clock during read/view-model construction. Do not mutate the catalogue on a student request just to label a record stale. A stale fact stays viewable as `needs-confirmation`, carries its original checked date and source, and is placed in a staff “review due” queue. This is safer than background scraping in a Vercel request and avoids secret/provider terms, rate limits, and unverifiable automated content changes.

## Server and Client Boundaries

### Server-only responsibilities

- Read/merge governed records and render public regional/provider pages.
- Enforce active staff authorization before parsing any admin write.
- Validate record evidence, availability, source URLs, and media-rights declarations; apply an atomic conditional mutation and return a safe conflict response.
- Generate a non-sensitive staff freshness queue from record metadata.
- Use a preapproved import/fixture package only as a staff operation; validate before an all-or-nothing bounded write. No client-submitted arbitrary source URL becomes authoritative content.

### Client responsibilities

- Filter already-governed public records by regional area/pathway type and render source/date/state exactly as received.
- Let students choose ordinary preferences and local compare/save actions.
- Render a `Verify with provider` / `Visit official source` link with `target="_blank"` and `rel="noreferrer"` for external sources.
- Maintain sensitive-referral category and consent only in component state. The only successful output is the vetted public information/contact URL.

No browser code can import `apps/web/lib/server/*`, write evidence records, calculate an eligibility result, attach selection answers to an external URL, or relay student data to a provider.

## Choice-Preserving Qualification Explanations

Use a two-part card model:

| Card section | Allowed content | Forbidden content |
|---|---|---|
| Why it appears | 2–4 reasons from ordinary stated preferences and documented provider facts. | “Best for you,” likelihood, potential, or hidden eligibility reasoning. |
| Published requirements | Provider’s own requirement text/facts, source/date/state, and “confirm directly.” | “You qualify/do not qualify,” admissions, enlistment, funding, placement, salary, or outcome conclusion. |
| Unknown/conflict | Explicit source gap and a human/provider verification action. | Silent omission, inferred availability, or ranking suppression. |
| Actions | Save, compare, view source, alternate/lower-cost route, ask a human. | Apply/submit data in Scholar Scout, auto-contact, paid rank. |

Ordinary qualifications (for example a voluntarily entered diploma/credits, degree, licence, prior work, or military history) may choose which published requirements are highlighted. They must never remove an opportunity, mutate the provider record, become a score of student capacity, or leave the client/device without a separately approved purpose.

## Provider Media and Transition Story Boundary

Scholar Scout transition storytelling is its own content layer: original or licensed imagery/video with an internal asset/source record and accessible captions, alt text, reduced-motion support, and a general inclusive message. It must not imply that a pictured person attended, was placed by, or is endorsed by a provider.

Provider pages use a stricter record-scoped media policy:

- No media: render the verified provider text, source links, and standard Scholar Scout visual system.
- Provider-approved/licensed: store the exact asset/approved URL, rights basis, source, checked date, and optional expiry/review date.
- Approved embed: use the provider's allowed embed instead of copying assets; preserve title/transcript/caption requirements and never pass student context to it.
- Missing/expired/uncertain rights: omit media, keep factual text with a source link, and queue staff review.

Never copy a provider-site image merely because it is public, scrape social/provider pages, or use generative imagery as proof of a particular provider or pathway.

## Sensitive Support Referral Boundary

Sensitive categories include disability, health/mental health, housing, childcare, immigration, re-entry, protected characteristics, and complex financial circumstances. They are not metro filters, opportunity rank inputs, provider-page claims, analytics dimensions, URL parameters, or persisted onboarding fields.

```text
select category locally → read purpose-specific disclosure → consent locally
   → show vetted human/provider information link → student chooses to open it
```

The referral directory itself may be staff-managed public metadata (category, destination URL, owner, jurisdiction, checked date, availability note). It contains no student record. Any future storage, provider handoff, appointment booking, or contact transfer requires a purpose-separated protected model with retention, access, delete/export, audit, and recipient-specific consent design; it is outside this milestone.

## Test and Validation Boundaries

| Layer | Required automated proof |
|---|---|
| Domain schema | Reject unknown metro/type/evidence/media-rights values; legacy records normalize to explicit unknowns. |
| Freshness | Current, due, stale, unknown, and conflicting facts produce deterministic state without a write. |
| Publication | Only active staff can publish; missing source/date/rights fails validation; stale revision returns the existing safe `409`. |
| Governed read | Draft/review records are not public; public server pages never import raw seed data; all six regional IDs can filter valid published records. |
| Matching | Every input programme remains visible; ordinary qualifications only change reasons/order; eligibility text never becomes a result. |
| Referral | Sensitive value causes no fetch, localStorage/sessionStorage write, analytics call, provider query string, or rank change. |
| Provider UI | Each material displayed fact has source/date/state; unknown and stale states contain a verification action; external links have `rel="noreferrer"`. |
| Media | A provider asset cannot render without an allowed rights state and source metadata; reduced-motion/caption fallback remains accessible. |

Run focused Jest unit/component/API tests on each change, then the full web suite, typecheck, and lint. The release gate additionally needs a manual source/rights review, keyboard/screen-reader check, and owner confirmation of every referral and high-risk military-information destination.

## Incremental Build Order

1. **Foundations:** Define stable metro/pathway/evidence/media unions, boundary metadata, source authority rules, freshness function, and fixtures. Add unit tests before staff UI changes.
2. **Governed storage:** Extend `Programme`/admin normalization/validation/manager and server merge tests with backward-compatible unknown defaults. Retain publication/CAS/audit behavior.
3. **First vertical slice:** Publish a small staff-reviewed record set for one metro across all six pathway categories. Add public list/detail cards, source/date/state, save/compare, and no-eligibility copy.
4. **Six-area expansion:** Add source-reviewed coverage matrices and fixtures region by region. A missing category is shown as an honest coverage gap, not fabricated inventory.
5. **Qualification explanations:** Add optional ordinary qualification highlight logic to the shared opportunity view model; prove all-visible, no-prediction behaviour across listing, detail, and recommendations.
6. **Referrals and media:** Generalize the local-only referral directory and rights-safe provider media boundary only after destination owners/rights are documented.
7. **Operations:** Add a staff freshness queue/report, Preview evidence, manual source/rights audit, and a bounded plan for moving catalogue records out of whole-document storage if volume/concurrent staff activity requires it.

## Risks and Explicit Non-Goals

- The current whole-document adapter remains a bounded implementation constraint. Do not bulk-scrape/import or introduce unbounded history; use small validated batches, CAS, audit events, and tested rollback/recovery procedures.
- “Employer/AI-infrastructure training” is a pathway type, not a claim that a provider operates AI infrastructure, offers employment, or guarantees a role. Publish only the provider's documented description.
- Official boundary membership—Census/OMB CBSA for the five U.S. regions and Statistical Institute of Jamaica Kingston Metropolitan Area authority for Greater Kingston—plus the allowed source list, field freshness intervals, provider-media permissions, and referral destination ownership require product/data-operations confirmation before publishing coverage claims.
- No runtime scraping, provider API integration, paid ranking, application submission, eligibility determinations, recruiting targeting, or sensitive-data retention is authorized by this architecture.

## Architecture Recommendation

Deliver the regional navigator as a governed extension of the existing programme catalogue: staff-verified facts in the current publication/CAS boundary; evidence-first public cards from a single pure matcher; client-only referral consent; and a strict source/media lifecycle. This lets the product broaden geographic and pathway coverage without weakening student choice, source integrity, or the server/client privacy boundary.
