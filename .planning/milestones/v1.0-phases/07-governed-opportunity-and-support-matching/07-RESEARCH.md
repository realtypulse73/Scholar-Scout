# Phase 07: Governed Opportunity and Support Matching - Research

**Researched:** 2026-09-20  
**Domain:** Transparent, choice-preserving programme and support matching  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Match purpose

- **D-01:** Each match is a programme or pathway paired with its documented support bundle; it is not a disconnected list of opportunities and services. — **Reversibility:** costly — This shapes the catalogue evidence model, matching rules, and student-facing card contract.
- **D-02:** A pathway with missing requested support remains visible but ranks lower; it must never be hidden. Its card must say that the support is not documented and needs verification. — **Reversibility:** costly — This is a choice-preserving ranking contract used by discovery and recommendation surfaces.
- **D-03:** Personal support alignment may use only supports documented by a programme or linked provider and only after the student explicitly selects that support category.
- **D-04:** For sensitive or high-stakes needs—including disability access, housing, mental health, immigration, and complex financial help—the product offers a human-advisor or qualified-provider referral instead of ranking a “best” programme.

### Student control

- **D-05:** Ordinary opportunity matching may use the student's existing onboarding preferences: interests, pathway, location, affordability, and non-sensitive support preferences. The student can edit or clear those preferences at any time.
- **D-06:** Sensitive support categories need separate, plain-language, purpose-specific consent before they can be used to locate a referral. They never influence opportunity rank.
- **D-07:** Sensitive support details are used for the current referral only and are not retained in a referral or recommendation profile. — **Reversibility:** costly — Persisting them later would require a separately designed protected data model, retention policy, access control, delete/export behavior, and migration.
- **D-08:** Following a referral opens the provider's information or contact page; Scholar Scout does not send the student’s identity or answers to a provider automatically.

### Match cards

- **D-09:** Every match card shows two to four plain-language reasons grounded in the student's stated preferences and documented programme details; it does not lead with an unexplained fit score.
- **D-10:** Every card shows at least one material fact with a source link, the date when available, and a visible “verify before applying” prompt.
- **D-11:** Cards offer save, compare, visit-source, and lower-cost or alternate-pathway actions; they do not start an application in Scholar Scout.
- **D-12:** When a material fact or requested support is missing, old, or conflicting, the card says that it is unknown or needs verification and offers an appropriate source or human referral.

### the agent's Discretion

- Choose the exact accessible layout, wording, source-evidence schema, deterministic weighting, and test fixtures, provided the decisions above and the recommendation-governance constraints remain intact.

### Deferred Ideas (OUT OF SCOPE)

- Persisting a protected sensitive-referral profile is deferred until a purpose-separated data model, retention/delete/export controls, and access/audit protections are designed and tested.
- Automated provider referrals, eligibility decisions, admissions predictions, and application submission are out of scope.
- Area-specific source-verified resource discovery and area-aware advisor/simulation guidance remain mapped to the pending `PROD-07` work in Phase 8.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Read `PROJECT-INDEX.md` and the task-applicable source-of-truth documents before planning; distinguish active sources from historical evidence.
- Retain the Next.js 15, React 18, TypeScript, NextAuth, and Vercel foundation; avoid platform churn. [CITED: AGENTS.md]
- Preserve in-progress feature work and use incremental, tested migration boundaries; do not risk production data with whole-document persistence changes. [CITED: AGENTS.md]
- Keep deterministic reusable domain logic in `apps/web/lib/`, server-only data access under `apps/web/lib/server/`, and browser interaction in client components or API calls. [CITED: AGENTS.md]
- Use strict TypeScript, named domain exports, accessible interactive controls, Tailwind patterns already used by the app, and lint plus relevant Jest tests for web changes. [CITED: AGENTS.md]
- Begin implementation through a GSD execution workflow; this research artifact is the only change made by this task. [CITED: AGENTS.md]

## Summary

Phase 07 is a governed-model replacement, not a cosmetic result-card change. The current matcher ranks programmes with a numerical “fit” score and uses every `OnboardingData` support category plus GPA/access signals. That conflicts with the locked rule that sensitive needs never affect rank and with the governance rule that GPA is not an eligibility or potential proxy. Replace the shared ranking/explanation contract first, then have programme discovery, the detail fit panel, recommendations, and pathway recommendations consume that one contract. [VERIFIED: codebase grep] [CITED: docs/product-recommendation-governance.md]

The existing programme record boundary already gives the phase a safe catalogue seam: `getGovernedProgrammes()` returns published staff records merged over seeds, and staff publication validation already requires a source name, verification date, verified confidence, and checks for tuition, credential, duration, delivery, support, and next steps. Extend that same record shape with field-level evidence/availability instead of adding a second catalogue or calling the raw seed array. Records lacking a required fact must render an explicit unknown/verification state, not disappear. [VERIFIED: codebase grep] [CITED: 07-CONTEXT.md]

The safest implementation of one-time sensitive referral is a narrow client-side, in-memory consent interaction: select a category, read purpose-specific consent, then render only an allowlisted human/provider information link. It sends no request, creates no referral record, persists nothing, and does not include sensitive values in rank, telemetry, URLs, or provider requests. The server page continues to fetch the governed catalogue; the interactive consent control is the small client boundary. [CITED: https://nextjs.org/learn/react-foundations/server-and-client-components] [CITED: docs/product-recommendation-governance.md]

**Primary recommendation:** Create a single pure `opportunity-matching` domain contract that classifies ordinary versus referral-only categories, derives 2–4 reasons plus evidence/unknown/verification actions, and is used by every programme/recommendation surface before redesigning cards.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Governed programme evidence and support bundles | Database / Storage | API / Backend | Staff-published programme records are the catalogue source; `getGovernedProgrammes` is the established merge boundary. [VERIFIED: codebase grep] |
| Deterministic opportunity ordering and explanations | API / Backend | Browser / Client | A pure shared `apps/web/lib/` function makes one inspectable result consumable by server pages and client cards. [CITED: AGENTS.md] |
| Discovery and recommendation rendering | Frontend Server (SSR) | Browser / Client | Server pages retrieve governed programmes; client components only manage local rendering/profile refresh. [VERIFIED: codebase grep] |
| Sensitive referral consent and selected category | Browser / Client | — | The data must exist only for the current action; no server request or durable state is required. [CITED: 07-CONTEXT.md] |
| Referral destination | CDN / Static | Browser / Client | A vetted, source-linked external information/contact URL is opened by the student; no identity or answers are sent. [CITED: 07-CONTEXT.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 15.5.15 | App Router server pages, route boundaries, links | Already the supported project framework; server pages can keep governed data access out of the client bundle. [VERIFIED: codebase grep] [CITED: https://nextjs.org/docs/app/glossary] |
| `react` / `react-dom` | 18 | Accessible local interaction for referral-consent UI | Already used for existing client result and recommendation components. [VERIFIED: codebase grep] |
| TypeScript | 5.x | Exhaustive category and evidence-state unions | Project uses strict no-emit TypeScript; finite unions prevent an undocumented support state from becoming rank input. [CITED: AGENTS.md] |
| Jest + Testing Library | 30.3.0 / 16.3.2 | Deterministic-contract and accessible UI tests | Existing web-test harness and conventions. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `next/link` | bundled with Next.js | Source, compare, programme, and alternate-path actions | For internal actions; use a normal anchor for vetted external source/referral URLs. [VERIFIED: codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory sensitive-referral control | Persisted referral/profile API | Rejected by D-07: persistence would need a separate protected model, retention, access, export/delete, audit, and migration design. [CITED: 07-CONTEXT.md] |
| One shared deterministic contract | Surface-specific ranking calculations | Rejected: duplicate ranking causes explanations and ordering to drift across discovery, detail, and recommendations. [VERIFIED: codebase grep] |

**Installation:** No external package is needed or recommended for this phase. [VERIFIED: codebase grep]

## Architecture Patterns

### System Architecture Diagram

```text
Staff-managed programme facts
  -> publication validation + field evidence state
  -> getGovernedProgrammes() merge boundary
  -> pure opportunity-matching contract
       -> ordered visible matches (never filter for missing support)
       -> 2–4 stated-preference/documented-fact reasons
       -> material fact + source/date + verify action
       -> support bundle + documented/unknown/conflicting state
       -> ordinary support lower-ranking caution OR referral-only trigger
  -> ProgrammeResults / ProgrammeFitPanel / RecommendationDashboard / pathway recommendations
       -> save | compare | visit source | lower-cost / alternate pathway

Sensitive category selected in referral control
  -> plain-language, purpose-specific consent (browser memory only)
  -> allowlisted human/provider information URL
  -> browser opens provider page
  -> no profile write | no referral record | no provider data transfer | no rank input
```

### Recommended Project Structure

```text
apps/web/
├── lib/
│   ├── opportunity-matching.ts             # pure ranking, explanation, evidence, and category rules
│   ├── programmes.ts                       # programme + field-evidence/support-bundle types
│   └── referral-directory.ts               # allowlisted referral categories and public destination metadata
├── components/
│   ├── programmes/OpportunityMatchCard.tsx # reusable choice-preserving card
│   ├── programmes/SensitiveReferralPanel.tsx # local-only consent and destination link
│   └── recommendations/RecommendationDashboard.tsx
└── __tests__/
    ├── lib/opportunity-matching.test.ts
    └── components/OpportunityMatchCard.test.tsx
```

### Pattern 1: Evidence is a field-level render contract

**What:** Model each displayable material fact and documented support with status, source URL, optional source label/date, and a verification message. Derive a card’s visible facts from this model, rather than treating a programme-wide `verified` value as proof of every field. [CITED: 07-CONTEXT.md]

**When to use:** For tuition, credential, duration, delivery, documented support, and next steps; source facts can be missing, stale, or conflicting without suppressing the programme. [CITED: docs/product-recommendation-governance.md]

**Example:**

```typescript
// Recommended phase contract; source: governed-programme pattern in apps/web/lib/programmes.ts
type EvidenceStatus = 'documented' | 'unknown' | 'stale' | 'conflicting';

interface ProgrammeFactEvidence {
  status: EvidenceStatus;
  sourceUrl?: string;
  sourceLabel?: string;
  lastVerifiedAt?: string;
  verifyPrompt: string;
}

interface DocumentedSupport {
  category: OrdinarySupportCategory;
  evidence: ProgrammeFactEvidence;
}
```

### Pattern 2: A shared match view model, not shared presentation logic

**What:** `buildOpportunityMatch(programme, ordinaryPreferences)` returns a serializable view model: stable deterministic ordering value, exactly 2–4 reasons, support-bundle result, one material fact, visible unknowns, and permitted actions. Card components render that model and never calculate rank themselves. [VERIFIED: codebase grep]

**When to use:** For `/programmes`, `/programmes/[id]`, `/recommendations`, and `pathway-recommendations`; refactor all current callers of `explainProgrammeFit`, `getRankedProgrammeMatches`, and `rankProgrammesForProfile` in the same wave. [VERIFIED: codebase grep]

### Pattern 3: Referral-only categories are outside `OnboardingData`

**What:** Split the current taxonomy into `OrdinarySupportCategory` (`financial-aid`, `first-gen`, `tutoring`, `career-counseling`) and referral-only categories (`disability-services`, `mental-health`, `housing`, `childcare`, `language-support`, plus transient immigration and complex-financial-help choices). `none` remains a UI selection, not a matching category. This classification follows the governance inventory’s prohibition on ranking with disability, mental-health, housing, childcare, language, immigration, or sensitive data. [CITED: docs/product-recommendation-governance.md]

**When to use:** The onboarding request validator and stored profile must accept only ordinary categories after migration. The referral panel owns referral-only choices as component-local state. Existing stored values must be normalized safely into an empty ordinary list rather than thrown, leaked, or reclassified as a student preference. [CITED: 07-CONTEXT.md]

### Anti-Patterns to Avoid

- **A sensitive-support “best match”:** Never feed referral-only categories into points, sort order, reasons, badges, simulation boosts, or pathway priority. [CITED: 07-CONTEXT.md]
- **A boolean `sourceConfidence` rendered as proof of every claim:** A programme can have verified general metadata while support availability is unknown; retain per-fact status and show it. [CITED: docs/product-recommendation-governance.md]
- **A client-to-server referral POST:** `platform-store` referral records are existing engagement records, not a suitable store for sensitive selection/consent. [VERIFIED: codebase grep] [CITED: 07-CONTEXT.md]
- **GPA/access-based personal rank:** GPA and acceptance-rate signals must not become a gate, admission likelihood, “realistic” match, or potential proxy. They may be shown only as dated, sourced items to verify. [CITED: docs/product-recommendation-governance.md]
- **Using source links as automatic sharing:** Do not append answers to the URL, use query parameters, preload provider forms, or relay data through Scholar Scout. [CITED: 07-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistence for sensitive-referral data | A transient database collection, event log, or analytics event | Browser-local state with a vetted destination link | D-07 explicitly forbids retention; storage would introduce a protected-data lifecycle this phase does not design. [CITED: 07-CONTEXT.md] |
| Provider referral integration | A provider API, auto-filled contact form, or identity forwarding | A source-linked human/provider information page | Preserves student control and meets D-08 without an external disclosure boundary. [CITED: 07-CONTEXT.md] |
| Recommendation scoring | ML fit/potential model or click-optimized ranking | Existing pure deterministic TypeScript pattern, refactored to governed inputs | Governance requires inspectability and forbids predictive/potential or engagement-driven ranking. [CITED: docs/product-recommendation-governance.md] |
| Source verification state | An inferred quality/safety verdict | Explicit documented/unknown/stale/conflicting status plus a verification prompt | Programme facts change and may conflict; the product must not claim certainty it lacks. [CITED: 07-CONTEXT.md] |

**Key insight:** A simple local-only referral interaction is more correct than a “feature-rich” referral pipeline because the intended safety property is absence of sensitive retention and disclosure.

## Common Pitfalls

### Pitfall 1: Fixing only the programmes list

**What goes wrong:** `/programmes` says “preference alignment,” while the detail panel, recommendation dashboard, adaptive ranking, or pathway priority still says fit, scores GPA/access, or uses support values differently. [VERIFIED: codebase grep]

**How to avoid:** Enumerate every import/call of the current matcher and migrate them to the single match view model; test identical programme/profile cases across the pure entry points.

### Pitfall 2: Treating undocumented support as absent or hidden

**What goes wrong:** A `programme.support` array does not distinguish “no service” from “not documented,” and the current no-match branch lowers a score without a factual explanation. [VERIFIED: codebase grep]

**How to avoid:** Evidence state drives the caution: show “support not documented—verify” and lower ordinary-support alignment only; retain the programme in the list.

### Pitfall 3: Retaining sensitive details indirectly

**What goes wrong:** A supposedly temporary category leaks into localStorage, account onboarding, a URL, analytics, an API body, error telemetry, or the existing `referralRecords` collection. [VERIFIED: codebase grep]

**How to avoid:** No route, persistence function, browser-storage key, or analytics event accepts these values. Test the referral control’s only observable result: consent reveals a static destination link.

### Pitfall 4: Evidence migration breaks existing catalogue visibility

**What goes wrong:** Requiring new evidence for all seeded programmes makes historical records fail validation or disappear from `getGovernedProgrammes`. [VERIFIED: codebase grep]

**How to avoid:** Add optional backward-compatible evidence fields and normalize missing legacy values to `unknown`; staff-published writes require the stronger field-level data, but reads render unknown status safely.

### Pitfall 5: Accidentally creating an application funnel

**What goes wrong:** A prominent external link or action wording implies that Scholar Scout submits an application, determines eligibility, or guarantees support availability. [CITED: 07-CONTEXT.md]

**How to avoid:** Label actions `Visit source`, `Compare`, `Save`, `Explore lower-cost routes`, and `Contact a human/provider`; each card includes “Verify before applying.”

## Code Examples

### Choice-preserving support handling

```typescript
// Recommended phase contract; preserves visibility and makes missing evidence explicit.
function getOrdinarySupportAlignment(
  programme: Programme,
  preferences: OrdinaryPreferences,
): SupportAlignment {
  const selected = preferences.supportCategories;
  const documented = programme.documentedSupport.filter((item) =>
    selected.includes(item.category) && item.evidence.status === 'documented',
  );

  if (selected.length === 0) {
    return { rankDelta: 0, message: 'No support preference selected.' };
  }

  if (documented.length > 0) {
    return {
      rankDelta: documented.length,
      message: `Documents ${documented.map((item) => item.category).join(', ')} support.`,
    };
  }

  return {
    rankDelta: -1,
    message: 'Requested support is not documented; verify directly with the programme.',
  };
}
```

### Local-only referral gate

```tsx
// Recommended component boundary; source: Next.js Server/Client Components docs.
'use client';

const [consented, setConsented] = useState(false);

return consented ? (
  <a href={referral.destinationUrl} rel="noreferrer">
    View {referral.destinationLabel}
  </a>
) : (
  <button type="button" onClick={() => setConsented(true)}>
    I understand this only opens referral information
  </button>
);
```

The component must receive only public referral metadata and must not write a category, consent state, or free text outside component memory. [CITED: 07-CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One programme-level score with generic cautions | Inspectable preference alignment with source-aware facts, support evidence, unknown state, and verification actions | Phase 07 | The score is an internal deterministic sort aid only; cards lead with reasons rather than a percentage. [CITED: 07-CONTEXT.md] |
| One mixed support list in a persistent onboarding profile | Ordinary matching preferences separate from local-only sensitive referral choices | Phase 07 | Sensitive category never reaches ranking or storage. [CITED: docs/product-recommendation-governance.md] |

**Deprecated/outdated:** Student-facing “fit,” “adaptive fit,” “best pathway,” “confidence,” “high access fit,” and “academic fit” wording is incompatible wherever it can be read as an admissions, success, or potential judgement. Replace it with stated-preference alignment and explicit verification language. [VERIFIED: codebase grep] [CITED: docs/product-recommendation-governance.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A static, vetted referral directory can supply at least one appropriate destination for every referral-only category without a provider API. | Architecture Patterns | A category may need an explicitly maintained human-contact fallback before the UI can claim a referral is available. |
| A2 | `first-gen` is an ordinary, student-controlled support preference, while childcare and language support are referral-only. | Architecture Patterns | The product owner/privacy reviewer may require a stricter taxonomy; ranking rules and migration allowlist must follow the approved classification. |

## Resolved Planning Decisions

The phase owner approved the following pre-launch resolution on 2026-09-21; it supersedes the open planning questions above without creating a new product requirement.

1. **Provider destinations:** Phase 7 contains no maintained real provider destination. Each referral UI fixture uses an explicitly labelled `*.invalid` destination and makes no availability claim. A future public release is blocked until the authoritative release workflow contains a per-destination record with a source, accountable owner, availability or jurisdiction note, review date, and human sign-off. No student identity or answers transfer automatically. [CITED: 07-CONTEXT.md]

2. **Taxonomy:** The approved ordinary, editable, matchable allowlist is `financial-aid`, `first-gen`, `tutoring`, and `career-counseling`; `none` clears the ordinary selection. Disability access, housing, mental health, immigration, complex financial help, childcare, and language support are referral-only. Referral-only values never enter matching, persistent profiles, browser storage, URLs, analytics, or provider requests. [CITED: 07-CONTEXT.md]

3. **Phase authority:** Phase 7 is a governance-only pre-launch hardening slice with no new milestone requirement ID. The roadmap now provides its goal and success criteria. `PROD-07` remains exclusively mapped to Phase 8 and must not be relabelled as Phase 7 coverage. [CITED: ROADMAP.md] [CITED: REQUIREMENTS.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build and Jest | ✓ | v24.19.0 | — |
| Corepack-selected pnpm | Workspace test commands | ✓ | 10.34.5 | — |
| External provider API | Sensitive referral | Not required | — | Static, vetted information/contact URL only. [CITED: 07-CONTEXT.md] |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None; Phase 07 should not introduce a provider integration.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with `next/jest` and Testing Library [VERIFIED: codebase grep] |
| Config file | `apps/web/jest.config.ts` [VERIFIED: codebase grep] |
| Quick run command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` |
| Full suite command | `corepack pnpm --filter @scholar-scout/web test -- --runInBand` |

### Phase Behaviors → Test Map

No requirement IDs are mapped for Phase 07; behavior-level coverage below must not be relabeled as a requirement-ID map.

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Every governed programme remains in results when ordinary requested support is undocumented; that case ranks lower and exposes a verification prompt | unit | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/opportunity-matching.test.ts` | ❌ Wave 0 |
| Sensitive/referral-only categories never affect rank, reasons, or serialized ordinary preferences | unit | same quick command | ❌ Wave 0 |
| Exactly 2–4 plain-language reasons, source/date/unknown states, and verify prompt derive from fixture evidence | unit | same quick command | ❌ Wave 0 |
| Card provides save, compare, source, alternate/lower-cost actions and no application action | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/components/OpportunityMatchCard.test.tsx` | ❌ Wave 0 |
| Consent gate reveals only the vetted URL and does not POST, store in localStorage, or add query data | component | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/components/SensitiveReferralPanel.test.tsx` | ❌ Wave 0 |
| Published-programme evidence validation remains backward-compatible for legacy records while new governed writes validate field evidence | unit / API | `corepack pnpm --filter @scholar-scout/web test -- --runInBand apps/web/__tests__/lib/admin-programmes.test.ts apps/web/__tests__/api/admin-programmes.test.ts` | ✅ extend |

### Sampling Rate

- **Per task commit:** applicable focused Jest command plus `corepack pnpm --filter @scholar-scout/web run lint`.
- **Per wave merge:** `corepack pnpm --filter @scholar-scout/web test -- --runInBand` and `corepack pnpm --filter @scholar-scout/web run typecheck`.
- **Phase gate:** Full suite green, source-link manual review, keyboard/screen-reader check of card/referral wording, and human confirmation of referral destination ownership/freshness.

### Wave 0 Gaps

- [ ] `apps/web/__tests__/lib/opportunity-matching.test.ts` — governed ordering, all-visible guarantee, taxonomy exclusion, reasons, and evidence states.
- [ ] `apps/web/__tests__/components/OpportunityMatchCard.test.tsx` — action contract, plain-language evidence, unknown state, and accessibility.
- [ ] `apps/web/__tests__/components/SensitiveReferralPanel.test.tsx` — purpose-specific consent and non-retention behavior.
- [ ] Extend existing preference/pathway recommendation tests to prove the legacy GPA/access and support score language no longer drives rank.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Indirectly | The sensitive flow has no authenticated write/read endpoint; existing ordinary profile access continues through server-resolved actor routes. [VERIFIED: codebase grep] |
| V3 Session Management | Indirectly | Do not bind referral consent/details to a session or account record. [CITED: 07-CONTEXT.md] |
| V4 Access Control | Yes | Server-only governed catalogue and staff publication boundary; no browser-supplied sensitive value becomes an authorization or storage selector. [VERIFIED: codebase grep] |
| V5 Input Validation | Yes | Use exhaustive category allowlists; if a future route is proposed, validate exact bounded input and reject unknown fields. [CITED: https://devguide.owasp.org/en/06-verification/01-guides/03-asvs/] |
| V6 Cryptography | No new control | No sensitive data is persisted or transmitted in this slice; do not create a new client-side encryption scheme. [CITED: 07-CONTEXT.md] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Sensitive category enters a durable profile, event, URL, or provider request | Information disclosure | Component-local state only; no route/analytics/storage key accepts it; regression test for no request and no browser storage. [CITED: 07-CONTEXT.md] |
| Browser selects a programme/source/referral truth value | Tampering | Render governed programme evidence from the server; use an internal allowlisted referral directory, not arbitrary destination input. [VERIFIED: codebase grep] |
| Stale or missing data presented as confirmed support | Tampering | Explicit per-fact documented/unknown/stale/conflicting state plus source/date/verify prompt. [CITED: 07-CONTEXT.md] |
| “Fit” wording is understood as admission/success prediction | Spoofing / information integrity | Replace with decomposable stated-preference reasons; remove GPA/access predictive framing. [CITED: docs/product-recommendation-governance.md] |

## Sources

### Primary (HIGH confidence)

- `07-CONTEXT.md` — locked product boundaries, student control, card behavior, and scope fences.
- `docs/product-recommendation-governance.md` — governed signal inventory, prohibited uses, evidence behavior, referral triggers, and claims catalogue.
- `apps/web/lib/preference-matching.ts`, `apps/web/lib/programmes.ts`, `apps/web/lib/server/programme-records.ts`, `apps/web/components/programmes/ProgrammeResults.tsx`, `apps/web/components/programmes/ProgrammeFitPanel.tsx`, and `apps/web/components/recommendations/RecommendationDashboard.tsx` — present implementation seams and conflicting legacy rank language.

### Secondary (MEDIUM confidence)

- [Next.js Server and Client Components](https://nextjs.org/learn/react-foundations/server-and-client-components) — server/client boundary guidance, fetched 2026-09-20.
- [Next.js App Router glossary](https://nextjs.org/docs/app/glossary) — current App Router and `use client` semantics, fetched 2026-09-20.
- [OWASP ASVS developer guide](https://devguide.owasp.org/en/06-verification/01-guides/03-asvs/) — input validation/data-protection verification categories, fetched 2026-09-20.

### Tertiary (LOW confidence)

- None. The referral-directory availability and exact ordinary-support classification are explicitly recorded as assumptions/questions rather than treated as verified facts.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new library; existing versions and harness verified in the workspace.
- Architecture: HIGH — governed catalogue boundary and all current matcher consumers were inspected.
- Pitfalls: MEDIUM — core conflicts are verified in code and governance; provider-directory availability awaits a human owner.

**Research date:** 2026-09-20  
**Valid until:** 2026-10-20 for repository findings; revisit referral destinations immediately before release.
