# ScholarScout Codex Backlog

## Overview

ScholarScout is a rejection-free post-secondary discovery platform that matches students with programmes that fit their goals, budget, and life circumstances.

---

## Sprint 1

### Task 1 – Project Scaffold
**Status:** ✅ Complete  
**Description:** Initialise the Next.js 14 + TypeScript + Tailwind CSS monorepo.

---

### Task 2 – Design Tokens & Theme
**Status:** ✅ Complete  
**Description:** Define a consistent colour palette, typography scale, and spacing tokens in Tailwind config.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/tailwind.config.ts` | Added ScholarScout brand, ink, status colors, font families, radius, shadow, and touch spacing tokens |
| `apps/web/app/globals.css` | Simplified global foreground/background tokens for a stable light UI baseline |

---

### Task 3 – Component Library Baseline
**Status:** ✅ Complete  
**Description:** Build Button, Input, Card, and Badge primitives using Tailwind.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/class-names.ts` | Lightweight class name join helper with no new dependencies |
| `apps/web/components/ui/Button.tsx` | Button primitive with variants, sizes, focus, disabled, and default type handling |
| `apps/web/components/ui/Input.tsx` | Input primitive with invalid state and accessible `aria-invalid` support |
| `apps/web/components/ui/Card.tsx` | Card primitive for repeated framed content |
| `apps/web/components/ui/Badge.tsx` | Badge primitive with neutral, brand, and status tones |
| `apps/web/components/ui/index.ts` | Barrel exports for UI primitives |
| `apps/web/__tests__/components/ui-primitives.test.tsx` | Baseline render and accessibility assertions |

---

### Task 4 – Landing Page
**Status:** Complete  
**Description:** Create a marketing landing page with hero, value-proposition section, and CTA.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/page.tsx` | Added ScholarScout landing page with hero, value proposition sections, match preview, and onboarding CTAs |

---

### Task 4a - Vercel Docker Workaround
**Status:** Complete  
**Description:** Document and script the Docker-free Vercel build path so the frontend can deploy from the npm workspace without depending on Docker.

**Files Changed:**
| File | Description |
|---|---|
| `vercel.json` | Keeps Vercel pointed at the root workspace and the web app output |
| `package.json` | Added `vercel:docker-free` local smoke-test script |
| `docs/vercel-docker-workaround.md` | Added dedicated Docker-free Vercel setup and maintenance notes |
| `docs/vercel-deployment.md` | Updated install command and linked the workaround |
| `docs/docker-free-development.md` | Added portable wrapper command for the Vercel smoke test |
| `README.md` | Linked the workaround from the main project docs |

---

### Task 5 – Authentication
**Status:** Partial - Local Prototype  
**Description:** Implement sign-up / sign-in with NextAuth.js (email + OAuth).

**Implemented Local Baseline:**
- [x] Local sign-in route at `/auth/sign-in`.
- [x] Local sign-up route at `/auth/sign-up`.
- [x] Browser-local session storage for student and staff roles.
- [x] Profile route at `/profile` summarising account, preferences, shortlist, and staff access.
- [x] Staff CMS route is gated behind a local staff role check.
- [x] Unit tests cover local session parsing, creation, and staff access checks.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/local-auth.ts` | Local session creation, parsing, serialization, and staff-access helpers |
| `apps/web/components/auth/AuthForm.tsx` | Local sign-in/sign-up form |
| `apps/web/components/auth/AuthStatusLink.tsx` | Session-aware navigation link |
| `apps/web/components/auth/StaffGate.tsx` | Client-side staff-role gate for prototype staff tools |
| `apps/web/components/profile/ProfileDashboard.tsx` | Local account dashboard with saved preference and shortlist status |
| `apps/web/app/auth/sign-in/page.tsx` | Sign-in route |
| `apps/web/app/auth/sign-up/page.tsx` | Sign-up route |
| `apps/web/app/profile/page.tsx` | Profile route |
| `apps/web/app/admin/programmes/page.tsx` | Wrapped local CMS in staff gate |
| `apps/web/__tests__/lib/local-auth.test.ts` | Added local auth helper coverage |

**Remaining for Production Auth:**
1. Add real NextAuth/Auth.js integration when provider credentials and persistence are ready.
2. Move sessions, onboarding profile, shortlist, and staff drafts out of `localStorage`.
3. Enforce staff authorization server-side before exposing CMS routes.

---

### Task 6 – Mobile-First Onboarding Wizard
**Status:** ✅ Complete  
**Description:** Build a multi-step onboarding wizard that collects the six student-preference signals needed to drive programme matching.

**Acceptance Criteria:**
- [x] Step 1 – **GPA Band**: chip/pill selection from six bands (`below-2.0` → `3.5-4.0` + `no-gpa`).
- [x] Step 2 – **Interests**: multi-select chips from 12 subject areas.
- [x] Step 3 – **Location Preference**: radio group (local, in-state, out-of-state, international, online-only, no preference).
- [x] Step 4 – **Pathway Preference**: radio group (4-year, 2-year, trade, certificate, apprenticeship, online degree, undecided).
- [x] Step 5 – **Affordability Sensitivity**: 5-point labelled slider.
- [x] Step 6 – **Support Needs**: multi-select checklist with mutual-exclusion `none` option.
- [x] Per-step client-side validation with accessible `role="alert"` error messages.
- [x] Progress indicator (step dots + progress bar + sr-only text).
- [x] Back / Next / Submit navigation.
- [x] Summary / confirmation screen after final step.
- [x] Unit tests for validation logic.
- [x] Component tests for all six step components.
- [x] Integration tests for the full wizard flow.

**Files Changed:**
| File | Description |
|---|---|
| `lib/onboarding-types.ts` | TypeScript types, constants, and label maps for all wizard fields |
| `lib/onboarding-validation.ts` | Per-step and full-form validation functions |
| `components/onboarding/StepGpa.tsx` | Step 1 – GPA band chip selector |
| `components/onboarding/StepInterests.tsx` | Step 2 – Interest multi-select chips |
| `components/onboarding/StepLocation.tsx` | Step 3 – Location preference radio group |
| `components/onboarding/StepPathway.tsx` | Step 4 – Pathway preference radio group |
| `components/onboarding/StepAffordability.tsx` | Step 5 – Affordability slider with numeric buttons |
| `components/onboarding/StepSupportNeeds.tsx` | Step 6 – Support needs checklist |
| `components/onboarding/ProgressIndicator.tsx` | Step dot progress indicator with progress bar |
| `components/onboarding/OnboardingSummary.tsx` | Post-submit summary / confirmation screen |
| `components/onboarding/OnboardingWizard.tsx` | Root orchestrator: state, validation, navigation |
| `app/onboarding/page.tsx` | Next.js App Router page serving the wizard |
| `app/page.tsx` | Updated home page with CTA link to `/onboarding` |
| `__tests__/lib/onboarding-validation.test.ts` | Tests for validation logic |
| `__tests__/components/StepGpa.test.tsx` | Tests for StepGpa component |
| `__tests__/components/StepInterests.test.tsx` | Tests for StepInterests component |
| `__tests__/components/StepAffordability.test.tsx` | Tests for StepAffordability component |
| `__tests__/components/StepSupportNeeds.test.tsx` | Tests for StepSupportNeeds component |
| `__tests__/components/OnboardingWizard.test.tsx` | Integration tests for wizard flow |

**Follow-up Risks:**
1. **Persistence** – Wizard state is in-memory only; a browser refresh loses progress. Future: save to `localStorage` or send to API.
2. **Matching engine** – "Find My Matches" CTA on the summary screen is a stub. Needs a programme-matching service (Sprint 2+).
3. **Analytics** – No funnel tracking. Drop-off rates per step are unknown.
4. **Accessibility audit** – Keyboard navigation and screen-reader testing beyond basic ARIA roles not yet validated with real assistive technology.
5. **Internationalisation** – Labels are English only. i18n infrastructure not yet in place.

---

### Task 7 – Programme Listing Page
**Status:** Complete  
**Description:** Display a filterable, paginated list of matched post-secondary programmes.

**Acceptance Criteria:**
- [x] Static programme catalogue with fit score, tuition, access, pathway, delivery, support, and highlights.
- [x] Search and filter controls for query, pathway, location mode, and tuition ceiling.
- [x] Paginated result cards with stable summary metrics.
- [x] Onboarding summary "Find My Matches" CTA routes into the listing.
- [x] Unit tests for filtering, sorting, and pagination helpers.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Programme data model, sample catalogue, filtering, sorting, and pagination helpers |
| `apps/web/app/programmes/page.tsx` | Server-rendered programme listing page with filters, result cards, and pagination |
| `apps/web/__tests__/lib/programmes.test.ts` | Coverage for programme filtering, sorting, and pagination |
| `apps/web/components/onboarding/OnboardingSummary.tsx` | Connected "Find My Matches" to `/programmes` |
| `apps/web/app/page.tsx` | Added a direct browse-programmes CTA |

**Follow-up Risks:**
1. **Personalisation** - Listing filters are URL-driven and static; onboarding preferences are not yet persisted into matching.
2. **Data source** - Programme catalogue is sample data. Future work needs CMS or service-backed records.
3. **Data source** - Sample records should be replaced with governed programme data before production use.

---

### Project Shortcut - ScholarScout Rubric
**Status:** Complete  
**Description:** Consolidate current project standards, completed work, verification commands, and next-step guidance into one rubric.

**Files Changed:**
| File | Description |
|---|---|
| `docs/scholarscout-rubric.md` | One-page rubric for product promise, baseline status, build standards, and definition of done |
| `README.md` | Linked the rubric from the workspace overview |

---

### Task 8 – Programme Detail Page
**Status:** Complete  
**Description:** Show full programme details (tuition, acceptance rate, support services, location).

**Acceptance Criteria:**
- [x] Dynamic detail route for every programme in the current catalogue.
- [x] Detail page includes tuition, access rate, duration, delivery, credential, pathway, and location.
- [x] Support services and interest areas are visible with readable labels.
- [x] Practical next-step guidance is shown for each programme.
- [x] Listing cards link to their programme detail pages.
- [x] Related programme links help students continue comparison.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/programmes/[id]/page.tsx` | Added static dynamic detail route with metadata, snapshot metrics, support services, next steps, and related options |
| `apps/web/lib/programmes.ts` | Expanded programme records with overview, credential, next steps, lookup, and related-programme helpers |
| `apps/web/app/programmes/page.tsx` | Added detail links from listing result cards |
| `apps/web/__tests__/lib/programmes.test.ts` | Added coverage for programme lookup and related-programme helpers |

**Follow-up Risks:**
1. **Apply flow** - Detail pages show guidance but do not yet include real school links or contact workflows.
2. **Personalisation** - Detail pages use static fit scores rather than a student-specific explanation from onboarding data.
3. **Data governance** - Tuition, access, and support information are sample records and need source tracking before production use.

---

### Task 9 – Favourites / Shortlist
**Status:** Complete  
**Description:** Allow students to save and compare shortlisted programmes.

**Acceptance Criteria:**
- [x] Students can save or remove programmes from listing cards.
- [x] Students can save or remove a programme from its detail page.
- [x] Saved programmes persist locally across page navigation and refreshes.
- [x] Shortlist count is visible from programme navigation.
- [x] `/shortlist` compares saved programmes by tuition, access, pathway, delivery, and fit score.
- [x] Empty shortlist state routes students back to programme browsing.
- [x] Unit tests cover shortlist parsing, toggling, and programme mapping helpers.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/shortlist.ts` | Local shortlist storage key, parsing, normalization, toggle, and mapping helpers |
| `apps/web/components/shortlist/ShortlistButton.tsx` | Client save/remove button backed by `localStorage` |
| `apps/web/components/shortlist/ShortlistCountLink.tsx` | Navigation link that reflects saved programme count |
| `apps/web/components/shortlist/ShortlistComparison.tsx` | Client comparison table and empty state for saved programmes |
| `apps/web/app/shortlist/page.tsx` | Shortlist comparison route |
| `apps/web/app/programmes/page.tsx` | Added save controls and shortlist navigation |
| `apps/web/app/programmes/[id]/page.tsx` | Added save control and shortlist navigation |
| `apps/web/app/page.tsx` | Added a main-nav shortlist link |
| `apps/web/__tests__/lib/shortlist.test.ts` | Added helper coverage for shortlist behavior |

**Follow-up Risks:**
1. **Device-bound state** - Shortlist is local to the browser until authentication and server persistence exist.
2. **Comparison depth** - Current comparison is metric-based; future work should add support fit explanations and notes.
3. **Analytics** - Saves/removes are not tracked, so programme interest signals are not yet measurable.

---

### Task 10 – Admin CMS
**Status:** Complete  
**Description:** Allow ScholarScout staff to add / edit programme records.

**Acceptance Criteria:**
- [x] Staff-facing `/admin/programmes` route exists.
- [x] Staff can create local programme draft records.
- [x] Staff can edit seed records into local drafts without mutating source data.
- [x] Staff can delete local drafts.
- [x] Local drafts persist in browser storage.
- [x] Draft JSON can be exported for a future database or governed CMS.
- [x] Unit tests cover draft parsing, preparation, upsert, deletion, and merging.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/admin/programmes/page.tsx` | Added staff programme admin route |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added local programme editor, record list, draft delete, and JSON export |
| `apps/web/lib/admin-programmes.ts` | Added draft storage, parsing, normalization, merge, upsert, and preparation helpers |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added helper coverage for local CMS behavior |
| `apps/web/app/page.tsx` | Added an admin navigation link |
| `README.md` | Documented local staff routes |

**Follow-up Risks:**
1. **No access control** - Admin route is public until authentication and authorization are added.
2. **Browser-only storage** - Draft records are local and do not update public programme pages.
3. **Governed data** - Production use needs a real CMS/database, audit history, and source tracking.

---

### Task 11 - Preference-Based Fit Explanations
**Status:** Complete  
**Description:** Persist completed onboarding preferences locally and explain programme fit against those preferences.

**Acceptance Criteria:**
- [x] Completed onboarding profile is saved locally after submit.
- [x] Programme detail pages show a personal fit panel when preferences exist.
- [x] Fit explanations include matching interests, pathway, location, affordability, and support signals.
- [x] Detail pages show a clear onboarding CTA when no saved profile exists.
- [x] Unit tests cover profile parsing and fit explanation helper behavior.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/preference-matching.ts` | Added onboarding profile storage, parsing, serialization, and fit explanation helpers |
| `apps/web/components/programmes/ProgrammeFitPanel.tsx` | Added client-side programme fit explanation panel |
| `apps/web/components/onboarding/OnboardingWizard.tsx` | Saves completed onboarding profile to browser storage |
| `apps/web/app/programmes/[id]/page.tsx` | Displays personal fit panel on programme detail pages |
| `apps/web/__tests__/lib/preference-matching.test.ts` | Added coverage for profile parsing and fit explanations |

**Follow-up Risks:**
1. **Local-only profile** - Preferences are browser-local until account persistence exists.
2. **Heuristic scoring** - Fit percentages are simple heuristics and need calibration with real advising rules.
3. **Listing integration** - Programme list order still uses static match score rather than personalized fit score.

---

### Task 12 - Personalized Listing Order
**Status:** Complete  
**Description:** Use saved onboarding preferences to personalize programme listing order and result-card fit signals.

**Acceptance Criteria:**
- [x] Programme listing reads the saved onboarding profile from browser storage.
- [x] Listing order uses personalized fit score when a profile exists.
- [x] Listing falls back to baseline fit score when no profile exists.
- [x] Result cards show personal fit score and a fit reason when preferences exist.
- [x] Existing URL filters and pagination continue to work.
- [x] Unit tests cover personalized ranking and baseline fallback.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/components/programmes/ProgrammeResults.tsx` | Added client-side result rendering with personalized sorting, fit reason snippets, and pagination |
| `apps/web/app/programmes/page.tsx` | Delegated filtered programme rendering to the personalized results component |
| `apps/web/lib/preference-matching.ts` | Added reusable profile-aware programme ranking helper |
| `apps/web/__tests__/lib/preference-matching.test.ts` | Added coverage for personalized ranking and fallback ordering |

**Follow-up Risks:**
1. **Pagination after personalization** - Personalized sorting happens client-side after server filters; future server persistence should move this into the API.
2. **Heuristic ranking** - Ranking needs calibration with real advising and outcomes data.
3. **Profile freshness** - The page reads saved profile on load only; cross-tab profile changes need a future sync pattern.

---

### Task 13 - Account Persistence And Governed Programme Data
**Status:** Account-backed baseline  
**Description:** Connect onboarding, shortlist, and staff programme data to authenticated APIs while preserving local browser fallback behaviour.

**Acceptance Criteria:**
- [x] Onboarding summary links translate completed preferences into programme listing filters.
- [x] Signed-in onboarding profiles are saved and loaded through `/api/account/onboarding`.
- [x] Signed-in shortlists are saved and loaded through `/api/account/shortlist`.
- [x] Staff programme records are saved, listed, and deleted through `/api/admin/programmes`.
- [x] Programme listing, detail, shortlist, and admin pages read governed programme records server-side.
- [x] Local browser storage remains as fallback/cache for unsigned-in users.
- [x] Local JSON app data is ignored by git.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/onboarding-programme-filters.ts` | Converts onboarding preferences into listing filter URLs |
| `apps/web/lib/server/data-store.ts` | Server-side JSON store for users, onboarding profiles, shortlists, and programme records |
| `apps/web/lib/server/programme-records.ts` | Merges static seed programmes with governed programme records |
| `apps/web/app/api/account/onboarding/route.ts` | Authenticated onboarding persistence API |
| `apps/web/app/api/account/shortlist/route.ts` | Authenticated shortlist persistence API |
| `apps/web/app/api/admin/programmes/route.ts` | Staff-only programme record API |
| `apps/web/auth.ts` | NextAuth credentials provider and session callbacks |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | Auth.js/NextAuth route handler |
| `apps/web/app/api/register/route.ts` | Account registration API |
| `apps/web/components/onboarding/OnboardingWizard.tsx` | Saves completed onboarding locally and through the account API when available |
| `apps/web/components/onboarding/OnboardingSummary.tsx` | Routes students into listing filters derived from onboarding answers |
| `apps/web/components/programmes/ProgrammeResults.tsx` | Loads authenticated onboarding profile before personalized listing order |
| `apps/web/components/programmes/ProgrammeFitPanel.tsx` | Loads authenticated onboarding profile before detail fit explanations |
| `apps/web/components/shortlist/ShortlistButton.tsx` | Syncs save/remove actions with authenticated shortlist API |
| `apps/web/components/shortlist/ShortlistCountLink.tsx` | Shows authenticated shortlist count when signed in |
| `apps/web/components/shortlist/ShortlistComparison.tsx` | Loads and updates authenticated shortlists |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Syncs admin records through staff-only APIs |
| `.gitignore` | Ignores local JSON data files |
| `docs/scholarscout-rubric.md` | Updated the shortcut rubric for account-backed persistence and governed data |

**Follow-up Risks:**
1. **Production durability** - The JSON store is a service-backed baseline, not a production database.
2. **Provider completeness** - Auth.js uses credentials today; OAuth providers still need provider credentials and environment configuration.
3. **Data governance depth** - Programme records still need source metadata, review workflow, audit history, and publish states.

---

### Task 14 - Governed Programme Write Validation
**Status:** Complete  
**Description:** Harden staff programme saves so governed records are validated before they enter account-backed programme data.

**Acceptance Criteria:**
- [x] Staff programme records are validated with a shared helper before API writes.
- [x] Required comparison fields include programme, school, location, duration, credential, overview, highlights, and next steps.
- [x] Delivery, pathway, interest, support, tuition, access, and fit values must stay inside supported ScholarScout ranges.
- [x] Staff editor surfaces practical validation/API messages before changing local fallback state.
- [x] Staff CMS copy describes governed records and protected APIs instead of browser-only drafts.
- [x] Helper tests cover valid records and incomplete records.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/admin-programmes.ts` | Added shared governed-record validation |
| `apps/web/app/api/admin/programmes/route.ts` | Validates staff programme payloads before saving |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Saves through the staff API first and updates governed-data wording |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added validation coverage |

**Follow-up Risks:**
1. **Source depth** - Source name, URL, and verification date are captured, but records still need reviewer notes and source confidence.
2. **Concurrent edits** - The JSON baseline does not handle multi-staff conflict resolution.
3. **Production CMS** - The JSON data store still needs replacement with a durable CMS or database.

---

### Task 15 - Programme Review States And Source Metadata
**Status:** Complete  
**Description:** Add governance fields that let staff keep records private until they are ready for students to compare.

**Acceptance Criteria:**
- [x] Programme records support Draft, In review, and Published states.
- [x] Staff can edit source name, source URL, and verification date for governed records.
- [x] Published records require source name and verification date.
- [x] Source URLs must use `http://` or `https://` when present.
- [x] Public programme pages merge only published governed records with seed records.
- [x] Staff admin keeps draft and review records visible to staff.
- [x] Helper tests cover publication filtering and published-source validation.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Added optional publication status and source metadata fields to programme records |
| `apps/web/lib/admin-programmes.ts` | Added publication status options, labels, source validation, and published-record filtering |
| `apps/web/lib/server/programme-records.ts` | Filters governed records to published records before public catalogue merge |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added status/source controls and status badges |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added publication and source metadata coverage |
| `docs/scholarscout-rubric.md` | Updated governed data baseline and next work |

**Follow-up Risks:**
1. **Reviewer handoff** - In review is a state, not a full approval queue with comments or assignment.
2. **Conflict handling** - The JSON baseline does not handle concurrent multi-staff edits.
3. **Production CMS** - The JSON data store still needs replacement with a durable CMS or database.

---

### Task 16 - Staff Programme Audit Trail
**Status:** Complete  
**Description:** Surface programme change history to staff so governed data changes are visible in the admin workflow.

**Acceptance Criteria:**
- [x] Programme create, update, and delete events are returned by the staff programme API.
- [x] Audit events are scoped to programme changes and sorted newest first.
- [x] Staff admin shows a recent audit trail with action, programme id, actor label, and timestamp.
- [x] The audit view avoids exposing account email addresses.
- [x] Helper tests cover audit ordering and action labels.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added programme audit event reader with actor labels |
| `apps/web/app/api/admin/programmes/route.ts` | Returns programme audit events to staff clients |
| `apps/web/lib/admin-programmes.ts` | Added audit summary helpers and labels |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added staff-visible audit trail panel |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added audit helper coverage |
| `docs/scholarscout-rubric.md` | Updated governed data baseline and next work |

**Follow-up Risks:**
1. **Conflict handling** - The JSON baseline does not handle concurrent multi-staff edits.
2. **Production CMS** - The JSON data store still needs replacement with a durable CMS or database.

---

### Task 17 - Reviewer Handoff For Programme Records
**Status:** Complete  
**Description:** Add lightweight reviewer assignment and notes so staff can move governed records through review without relying on out-of-band context.

**Acceptance Criteria:**
- [x] Programme records support reviewer assignee and review notes fields.
- [x] Staff can edit reviewer and review notes in the programme admin form.
- [x] In review records require an assigned reviewer.
- [x] Reviewer and notes fields are trimmed before save.
- [x] Staff record cards show reviewer assignment and review notes when present.
- [x] Helper tests cover reviewer validation and preparation.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Added optional reviewer handoff fields to programme records |
| `apps/web/lib/admin-programmes.ts` | Trims reviewer fields and validates in-review assignee |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added reviewer controls and record-card reviewer context |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added reviewer handoff coverage |
| `docs/scholarscout-rubric.md` | Updated governed data baseline and next work |

**Follow-up Risks:**
1. **Production CMS** - Reviewer handoff still lives in the local service-backed store until a durable CMS/database adapter exists.

---

### Task 18 - Programme Revision Conflict Checks
**Status:** Complete  
**Description:** Add optimistic revision checks so staff programme saves do not silently overwrite newer governed records.

**Acceptance Criteria:**
- [x] Governed programme records carry a revision number.
- [x] New programme records start at revision 1 after API save.
- [x] Existing programme saves require the loaded revision to match the current stored revision.
- [x] Stale programme saves return a `409 Conflict` response with a practical refresh message.
- [x] Successful saves return the updated record so local fallback state keeps the latest revision.
- [x] Staff record cards show revision labels.
- [x] Helper tests cover revision labels.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Added optional revision field to programme records |
| `apps/web/lib/server/data-store.ts` | Added optimistic revision checks and conflict error |
| `apps/web/app/api/admin/programmes/route.ts` | Returns conflict responses for stale saves and updated records for successful saves |
| `apps/web/lib/admin-programmes.ts` | Preserves prepared revision values and exposes revision labels |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Uses API-returned records and displays revision labels |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added revision label coverage |
| `docs/scholarscout-rubric.md` | Updated governed data baseline and next work |

**Follow-up Risks:**
1. **Production CMS** - Revision checks are implemented in the JSON store and need a durable CMS/database adapter next.
2. **Conflict recovery UI** - Staff get a practical refresh message, but not a side-by-side merge view.

---

### Task 19 - Replaceable Data Store Boundary
**Status:** Complete  
**Description:** Put account, shortlist, onboarding, audit, and programme persistence behind a data-store adapter boundary so JSON remains the local implementation while a durable CMS/database can be added cleanly.

**Acceptance Criteria:**
- [x] Server persistence exposes a `ScholarScoutDataStore` interface.
- [x] JSON file persistence is implemented as the default adapter.
- [x] `SCHOLARSCOUT_DATA_ADAPTER` selects the adapter and currently supports `json`.
- [x] Existing account and admin API imports continue to use stable data-store functions.
- [x] Tests can inject an in-memory adapter without touching local JSON files.
- [x] Adapter tests cover programme save and stale-revision behavior through the active adapter.
- [x] README documents the adapter selector.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Refactored persistence through a data-store interface and JSON adapter implementation |
| `apps/web/__tests__/lib/data-store.test.ts` | Added in-memory adapter tests for programme saves and revision conflicts |
| `README.md` | Documented `SCHOLARSCOUT_DATA_ADAPTER=json` |
| `docs/scholarscout-rubric.md` | Added data persistence adapter baseline |

**Follow-up Risks:**
1. **Production implementation** - Only the JSON adapter exists today; a durable CMS/database adapter still needs to be implemented.
2. **Conflict recovery UI** - Staff get a practical refresh message, but not a side-by-side merge view.

---

### Task 20 - HTTP Service Data Adapter
**Status:** Complete  
**Description:** Add a service-backed data adapter option so the same account/admin APIs can use a durable external data service without adding deployment-heavy dependencies.

**Acceptance Criteria:**
- [x] `SCHOLARSCOUT_DATA_ADAPTER=http` selects an HTTP data adapter.
- [x] The HTTP adapter requires `SCHOLARSCOUT_DATA_SERVICE_URL`.
- [x] The HTTP adapter can send an optional bearer token from `SCHOLARSCOUT_DATA_SERVICE_TOKEN`.
- [x] Reads use `GET` with `cache: no-store`.
- [x] Writes use `PUT` with the full ScholarScout data document.
- [x] `404` reads fall back to the initial empty data shape.
- [x] Tests cover URL enforcement and HTTP read/write requests.
- [x] README documents the HTTP adapter env vars.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added HTTP service-backed data adapter and adapter selection |
| `apps/web/__tests__/lib/data-store.test.ts` | Added HTTP adapter configuration and read/write coverage |
| `README.md` | Documented `SCHOLARSCOUT_DATA_ADAPTER=http`, service URL, and token |
| `docs/scholarscout-rubric.md` | Updated data persistence baseline and next work |

**Follow-up Risks:**
1. **Service contract** - The external HTTP data service still needs to be provisioned and operated.
2. **Granular writes** - The adapter writes the full data document; a future service should expose narrower account/programme endpoints.
3. **Conflict recovery UI** - Staff get a practical refresh message, but not a side-by-side merge view.

---

### Task 21 - Server-Seeded Personalized Programme Listing
**Status:** Complete  
**Description:** Use authenticated onboarding data on the server so signed-in students see personalized programme ordering on first render.

**Acceptance Criteria:**
- [x] Programme listing reads the authenticated session server-side.
- [x] Signed-in users with an onboarding profile pass that profile into programme results before hydration.
- [x] Client results still fall back to local onboarding storage for unsigned-in users.
- [x] Client results still refresh from the account onboarding API when a session exists.
- [x] Programme listing keeps URL filters, pagination, and rejection-free framing intact.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/programmes/page.tsx` | Loads authenticated onboarding profile server-side and passes it into results |
| `apps/web/components/programmes/ProgrammeResults.tsx` | Accepts an initial profile while preserving local/API fallback behavior |

**Follow-up Risks:**
1. **Server-side pagination order** - Pagination still happens in the client results component after ranking; future work can move all ranking and pagination into server helpers.
2. **Cross-tab freshness** - Local profile changes in another tab still rely on reload/fetch behavior.

---

### Task 22 - Server-Ranked Programme Listing
**Status:** Complete  
**Description:** Apply authenticated profile ranking on the server before programme results are passed to the client.

**Acceptance Criteria:**
- [x] Programme listing filters the governed catalogue server-side.
- [x] Server-loaded onboarding profile is used to rank filtered programmes before render.
- [x] Baseline ranking still applies when no authenticated profile exists.
- [x] Client results still preserve localStorage fallback and account API refresh behavior.
- [x] Entry flexibility copy remains rejection-free and explicitly not an admission prediction.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/programmes/page.tsx` | Ranks filtered programmes server-side with the authenticated onboarding profile before passing them to results |

**Follow-up Risks:**
1. **Server-side pagination helper** - Pagination still happens in the client component; future work can move ranking plus pagination into one shared server helper.
2. **Hydration fallback ordering** - Unsigned-in localStorage profiles still personalize after hydration, as intended for local fallback behavior.

---

### Task 23 - Shared Programme Pagination
**Status:** Complete  
**Description:** Move programme page parsing, clamping, result metadata, and filter-preserving page links into a shared server/client helper.

**Acceptance Criteria:**
- [x] Programme page query params are parsed through a shared helper.
- [x] Programme result slicing returns page count, page size, total count, current page, and items from one helper.
- [x] Pagination links preserve active filters while replacing the page param.
- [x] The programme listing uses the shared helper without changing touch-sized pagination controls.
- [x] Helper tests cover parsing, clamping, minimum page size, and filter-preserving page links.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/pagination.ts` | Added shared pagination constants and helpers |
| `apps/web/app/programmes/page.tsx` | Parses listing page params with the shared helper |
| `apps/web/components/programmes/ProgrammeResults.tsx` | Uses shared pagination and page-link helpers |
| `apps/web/lib/programmes.ts` | Keeps the existing programme pagination export as a wrapper |
| `apps/web/__tests__/lib/pagination.test.ts` | Added focused pagination helper coverage |

**Follow-up Risks:**
1. **Conflict recovery UI** - Staff get a practical refresh message for stale saves, but not a side-by-side recovery view.
2. **Operational runbook** - The HTTP data adapter has tests and docs, but not a full operations handoff for a durable service.

---

### Task 24 - Staff Conflict Recovery UI
**Status:** Complete  
**Description:** Give staff a practical recovery path when a programme record changes after they loaded it.

**Acceptance Criteria:**
- [x] Stale programme saves return the current stored record along with the current revision.
- [x] Staff see a comparison panel with latest values beside their attempted edits.
- [x] Staff can load the latest record, keep their edits on the latest revision, or dismiss the warning.
- [x] Conflict copy stays practical and avoids blame.
- [x] Helper tests cover comparison rows for conflict recovery.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Includes the current record on stale revision conflicts |
| `apps/web/app/api/admin/programmes/route.ts` | Returns current record data in 409 conflict responses |
| `apps/web/lib/admin-programmes.ts` | Adds comparison helpers for stale edit recovery |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Adds side-by-side conflict recovery actions |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Covers conflict comparison rows |
| `apps/web/__tests__/lib/data-store.test.ts` | Covers current record payloads on stale revision errors |

**Follow-up Risks:**
1. **Full merge workflow** - Staff can choose latest or their edits, but individual field-level merge selection remains future work.

---

### Task 25 - HTTP Data Adapter Operations Runbook
**Status:** Complete  
**Description:** Document the operational contract for running the HTTP data adapter against a durable service.

**Acceptance Criteria:**
- [x] Runbook documents required HTTP methods and document shape.
- [x] Runbook documents environment variables and token handling.
- [x] Runbook includes smoke checks for staff programme records and public listings.
- [x] Runbook covers backup, restore, monitoring, and rollback to JSON.
- [x] README links to the runbook from the account-backed data notes.

**Files Changed:**
| File | Description |
|---|---|
| `docs/http-data-adapter-runbook.md` | Added service-backed adapter operations handoff |
| `README.md` | Linked the HTTP adapter runbook |

**Follow-up Risks:**
1. **Service implementation** - The durable service itself still needs provisioning.
2. **Granular endpoints** - The current adapter writes a full document rather than narrower account/programme resources.

---

### Task 26 - HTTP Data Service Contract Fixture
**Status:** Complete  
**Description:** Add a no-dependency local HTTP data service fixture so the service-backed adapter path can be verified against a real GET/PUT endpoint without Docker.

**Acceptance Criteria:**
- [x] Fixture service exposes `GET /scholarscout` and `PUT /scholarscout`.
- [x] Fixture service can require the same bearer token shape as the app adapter.
- [x] Fixture service stores the full ScholarScout data document as JSON.
- [x] Node contract tests cover auth, empty reads, writes, reads, and persisted data.
- [x] README and runbook document how to use the fixture with `SCHOLARSCOUT_DATA_ADAPTER=http`.

**Files Changed:**
| File | Description |
|---|---|
| `services/http-data-service/package.json` | Adds a workspace package for the local HTTP service fixture |
| `services/http-data-service/src/server.mjs` | Implements the no-dependency GET/PUT data service |
| `services/http-data-service/test/server.test.mjs` | Adds Node contract tests |
| `services/http-data-service/scripts/validate-fixture.mjs` | Adds lightweight build/lint/typecheck script hooks |
| `services/http-data-service/README.md` | Documents fixture usage |
| `docs/http-data-adapter-runbook.md` | Adds local contract verification steps |
| `README.md` | Links the fixture from the data notes |

**Follow-up Risks:**
1. **Production durability** - The fixture is for contract verification only; production still needs a durable hosted service or CMS/database adapter.

---

### Task 27 - Service Fixture Health And Backups
**Status:** Complete  
**Description:** Harden the local HTTP data service fixture so production service work has clearer readiness checks and rollback behavior.

**Acceptance Criteria:**
- [x] Fixture exposes a health endpoint.
- [x] Fixture returns `400` for invalid JSON writes instead of a generic service error.
- [x] Fixture backs up the previous document before replacing it.
- [x] Fixture tests cover health, invalid payloads, and backup creation.
- [x] Runbook documents health, invalid payload, and backup expectations.

**Files Changed:**
| File | Description |
|---|---|
| `services/http-data-service/src/server.mjs` | Added health check, invalid JSON handling, and write backups |
| `services/http-data-service/test/server.test.mjs` | Added fixture health, invalid JSON, and backup tests |
| `services/http-data-service/README.md` | Documented health and backup behavior |
| `docs/http-data-adapter-runbook.md` | Documented compatible service expectations |

**Follow-up Risks:**
1. **Hosted durability** - Backups are local fixture files; production still needs managed object storage or database snapshots.

---

### Task 28 - Field-Level Staff Conflict Merge
**Status:** Complete  
**Description:** Let staff merge selected latest fields into stale programme edits instead of choosing only the full latest record or full attempted edit.

**Acceptance Criteria:**
- [x] Conflict comparisons include stable field keys for merge actions.
- [x] Staff can select changed fields from the latest record.
- [x] Staff can merge selected fields into their attempted edit on the latest revision.
- [x] Existing full-record conflict actions remain available.
- [x] Helper tests cover selected-field merge behavior.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/admin-programmes.ts` | Added field-keyed comparisons and selected-field merge helper |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added conflict field checkboxes and merge-selected action |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added selected-field merge coverage |

**Follow-up Risks:**
1. **Rich text diffs** - Long overview, highlights, and next-step list diffs are still summarized rather than shown as granular line-level merges.

---

### Task 29 - Source Confidence And Review Readiness
**Status:** Complete  
**Description:** Add source-confidence fields and readiness signals so staff can see whether governed programme records are ready for publishing review.

**Acceptance Criteria:**
- [x] Programme records support source confidence and evidence notes.
- [x] Staff can edit source confidence and source evidence in the programme editor.
- [x] Published records require verified source confidence.
- [x] Verified source confidence requires evidence notes.
- [x] Staff record cards show readiness badges and the first blocking issue.
- [x] Helper tests cover source confidence validation and review readiness.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Added source-confidence fields to programme records |
| `apps/web/lib/admin-programmes.ts` | Added source confidence options, validation, and readiness helper |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added source confidence/evidence fields and readiness badges |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added source confidence and readiness coverage |

**Follow-up Risks:**
1. **Evidence depth** - Evidence notes are free text; future work can add structured source checks for tuition, duration, credential, support, and next steps.

---

### Task 30 - Structured Source Checks
**Status:** Complete  
**Description:** Replace free-text-only source evidence with structured verification checks for comparison-critical programme facts.

**Acceptance Criteria:**
- [x] Programme records support structured source checks for tuition, credential, duration, delivery mode, support services, and next steps.
- [x] Staff can toggle source checks in the programme editor.
- [x] Published records require every structured source check.
- [x] Review readiness reports the missing source checks in practical language.
- [x] Helper tests cover missing source checks and publish readiness.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/programmes.ts` | Added structured source-check field types |
| `apps/web/lib/admin-programmes.ts` | Added source-check options, labels, validation, and missing-check helper |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added source-check checklist to the staff editor |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added structured source-check coverage |

**Follow-up Risks:**
1. **List diffs** - Highlights and next-step edits still do not have line-level conflict diffs.

---

### Task 31 - Student-Facing Guidance List Diffs
**Status:** Complete  
**Description:** Show line-level list changes for highlights and next steps during stale staff edit recovery.

**Acceptance Criteria:**
- [x] Helper logic compares highlights and next steps as lists.
- [x] List diffs identify added, removed, and unchanged items.
- [x] Conflict recovery shows student-facing guidance changes below the field comparison table.
- [x] Conflict recovery keeps existing full-record and selected-field actions.
- [x] Helper tests cover highlight and next-step list diffs.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/admin-programmes.ts` | Added list-diff helpers and summaries |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Shows added, removed, and unchanged guidance items in conflict recovery |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added list-diff coverage |

**Follow-up Risks:**
1. **Inline editing** - Staff can inspect list diffs, but cannot yet accept individual list items without editing the comma-separated field.

---

### Task 32 - Individual Guidance Item Merge Controls
**Status:** Complete  
**Description:** Let staff apply selected latest highlight and next-step item changes during stale edit recovery.

**Acceptance Criteria:**
- [x] Conflict recovery exposes individual controls for changed highlight and next-step items.
- [x] Staff can restore removed latest items or remove added attempted items without accepting an entire list field.
- [x] Existing full-record and selected-field merge actions remain available.
- [x] Helper logic preserves attempted item order and appends restored latest items deterministically.
- [x] Helper tests cover selected list-item merge behavior.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/admin-programmes.ts` | Added selected guidance item merge helper |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added item-level conflict recovery controls for guidance lists |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added selected list-item merge coverage |
| `docs/scholarscout-rubric.md` | Updated the governed admin baseline and next logical work |

**Follow-up Risks:**
1. **Inline editing** - Conflict recovery can apply latest list items, but richer inline text editing still happens through the comma-separated editor fields.

---

### Task 33 - Inline Guidance Conflict Editing
**Status:** Complete  
**Description:** Let staff revise student-facing overview, highlights, and next steps directly from stale edit recovery before applying the result to the latest revision.

**Acceptance Criteria:**
- [x] Overview conflicts render in a dedicated guidance recovery section instead of crowding the compact field table.
- [x] Staff can edit the attempted overview while comparing it with the latest overview.
- [x] Staff can revise comma-separated highlight and next-step drafts from the conflict panel.
- [x] Applying edited guidance preserves the latest revision and keeps governed programme validation intact.
- [x] Helper tests cover inline guidance merge trimming and list normalization.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/admin-programmes.ts` | Added inline guidance merge input and helper |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added inline conflict editor for overview, highlights, and next steps |
| `apps/web/__tests__/lib/admin-programmes.test.ts` | Added inline guidance merge coverage |
| `docs/scholarscout-rubric.md` | Updated the governed admin baseline and next logical work |

**Follow-up Risks:**
1. **Durable CMS workflow** - Conflict editing is stronger, but governed programme data still needs a production CMS or database adapter.

---

### Task 34 - Vercel Blob Data Adapter
**Status:** Complete  
**Description:** Add a Vercel-native durable data adapter behind the existing ScholarScout data-store boundary.

**Acceptance Criteria:**
- [x] `SCHOLARSCOUT_DATA_ADAPTER=vercel-blob` selects a private Vercel Blob document adapter.
- [x] The adapter requires `BLOB_READ_WRITE_TOKEN` or `SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN`.
- [x] The adapter reads the full ScholarScout data document from a configurable blob path.
- [x] The adapter overwrites the same JSON blob with private access and `application/json` content type.
- [x] Helper tests cover token validation plus Blob read/write calls.
- [x] README and adapter docs explain setup, smoke checks, and rollback.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/package.json` | Added the official `@vercel/blob` SDK |
| `package-lock.json` | Captured the Blob SDK dependency tree |
| `apps/web/lib/server/data-store.ts` | Added the Vercel Blob data-store adapter |
| `apps/web/__tests__/lib/data-store.test.ts` | Added Blob adapter coverage |
| `docs/vercel-blob-data-adapter.md` | Added setup, smoke checks, and rollback notes |
| `README.md` | Documented the new adapter selector |
| `docs/scholarscout-rubric.md` | Updated the data baseline and next logical work |

**Follow-up Risks:**
1. **Record-level writes** - The Blob adapter is durable, but still replaces the full ScholarScout data document. A future CMS or database should add narrower writes for high-traffic production use.

---

### Task 35 - Data Store Status Summary
**Status:** Complete  
**Description:** Add reusable data-store status helpers so operations surfaces can report adapter readiness and record counts.

**Acceptance Criteria:**
- [x] Status helper reports the selected adapter and backing store.
- [x] Status helper identifies local JSON as non-durable for production.
- [x] Status helper reports missing HTTP and Vercel Blob configuration without reading the store.
- [x] Status helper includes counts for users, profiles, shortlists, programme records, and audit events.
- [x] Helper tests cover configured and missing-token paths.

---

### Task 36 - Protected Admin Data Status API
**Status:** Complete  
**Description:** Expose data-store status through a staff-only API endpoint.

**Acceptance Criteria:**
- [x] `/api/admin/data/status` requires a staff session.
- [x] The endpoint returns adapter status, backing store, readiness issues, and data counts.
- [x] The endpoint uses the same protected account boundary as programme admin APIs.

---

### Task 37 - Protected Data Snapshot Export
**Status:** Complete  
**Description:** Give staff a protected export endpoint for backing up the active ScholarScout data document.

**Acceptance Criteria:**
- [x] `/api/admin/data/export` requires a staff session.
- [x] The endpoint returns the full ScholarScout data document with an export timestamp.
- [x] The response uses JSON content type and an attachment filename.

---

### Task 38 - Staff Data Operations Panel
**Status:** Complete  
**Description:** Surface data backing status and snapshot export controls inside the programme admin screen.

**Acceptance Criteria:**
- [x] Admin UI loads the protected data status endpoint.
- [x] Staff can see adapter, durable/local status, backing store, and data counts.
- [x] Staff can download a data snapshot from a touch-sized CTA.
- [x] Operations copy stays practical and avoids implying student screening.

---

### Task 39 - Optional OAuth Provider Wiring
**Status:** Complete  
**Description:** Add production-ready Google and GitHub OAuth provider hooks that activate only when credentials are configured.

**Acceptance Criteria:**
- [x] Auth.js includes Google and GitHub providers when matching env vars exist.
- [x] OAuth users are created in the active data store on first sign-in.
- [x] `SCHOLARSCOUT_STAFF_EMAILS` assigns staff role to trusted OAuth emails.
- [x] Credentials sign-in remains available.
- [x] Tests cover OAuth user creation and staff allowlist role assignment.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/auth.ts` | Added optional Google/GitHub providers and OAuth account persistence |
| `apps/web/lib/server/data-store.ts` | Added status helpers, OAuth user creation, and staff email role mapping |
| `apps/web/app/api/admin/data/status/route.ts` | Added protected data status endpoint |
| `apps/web/app/api/admin/data/export/route.ts` | Added protected data snapshot export endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added data operations panel |
| `apps/web/__tests__/lib/data-store.test.ts` | Added status and OAuth helper coverage |
| `README.md` | Documented OAuth and staff allowlist env vars |
| `docs/scholarscout-rubric.md` | Updated the auth, admin, and next-work rubric |

**Follow-up Risks:**
1. **Restore workflow** - Staff can export the active data document, but restore/import still needs dry-run validation and a protected UI.

---

### Task 40 - Restore Snapshot Dry-Run Validation
**Status:** Complete  
**Description:** Let staff validate exported ScholarScout data snapshots before any restore/import write path exists.

**Acceptance Criteria:**
- [x] Restore validation accepts raw ScholarScout data documents and timestamped export snapshots.
- [x] Validation checks users, onboarding profiles, shortlists, programme records, and audit events.
- [x] Programme records reuse governed programme validation for practical issue messages.
- [x] `/api/admin/data/import/validate` requires a staff session and returns validation counts/errors.
- [x] Admin data operations panel includes a touch-sized dry-run validator.
- [x] Helper tests cover valid exports and invalid restore snapshots.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added restore snapshot validation helpers |
| `apps/web/app/api/admin/data/import/validate/route.ts` | Added protected dry-run validation endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added snapshot validation UI to data operations |
| `apps/web/__tests__/lib/data-store.test.ts` | Added restore validation coverage |
| `docs/scholarscout-rubric.md` | Updated next logical work after dry-run restore validation |

**Follow-up Risks:**
1. **Restore write path** - Snapshots can be validated, but staff still need a protected restore workflow with confirmation, backup-before-restore, and audit logging.

---

### Task 41 - Restore Backup Snapshot Model
**Status:** Complete  
**Description:** Preserve the current ScholarScout data document before any staff restore replaces it.

**Acceptance Criteria:**
- [x] Restore backups capture the previous full data document.
- [x] Backups include actor, reason, timestamp, and record counts.
- [x] Restored documents retain the newest backup history with a bounded retention limit.

---

### Task 42 - Restore Execution Helper
**Status:** Complete  
**Description:** Add a reusable restore helper that validates snapshots, writes a backup, restores the document, and returns restore metadata.

**Acceptance Criteria:**
- [x] Restore execution reruns snapshot validation server-side.
- [x] Invalid snapshots are rejected without replacing current data.
- [x] Successful restores write the validated snapshot plus backup history.
- [x] Restore helper returns backup id, restored timestamp, and restored counts.
- [x] Helper tests cover successful restore and invalid restore rejection.

---

### Task 43 - Protected Restore API
**Status:** Complete  
**Description:** Expose restore execution through a staff-only API with an explicit confirmation phrase.

**Acceptance Criteria:**
- [x] `/api/admin/data/import/restore` requires a staff session.
- [x] Restore requests require `RESTORE SCHOLARSCOUT DATA` confirmation.
- [x] Invalid snapshots return validation errors without writing data.
- [x] Successful restores return backup and count metadata.

---

### Task 44 - Staff Restore Execution UI
**Status:** Complete  
**Description:** Add guarded restore controls to the admin data operations panel.

**Acceptance Criteria:**
- [x] Restore controls appear only after a snapshot validates.
- [x] Staff can enter a restore reason.
- [x] Staff must type the exact restore confirmation before the action enables.
- [x] Successful restores clear the pasted snapshot, refresh admin data, and show backup metadata.
- [x] Restore UI remains touch-sized and readable on narrow screens.

---

### Task 45 - Restore Audit Trail
**Status:** Complete  
**Description:** Record restore activity in the ScholarScout audit stream.

**Acceptance Criteria:**
- [x] Restores append a data audit event to the restored document.
- [x] The audit event points to the backup id created before restore.
- [x] Audit validation accepts data restore events.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added restore backups, restore execution, confirmation constant, and data audit events |
| `apps/web/app/api/admin/data/import/restore/route.ts` | Added protected restore execution endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added restore reason, confirmation, and execution controls |
| `apps/web/__tests__/lib/data-store.test.ts` | Added restore execution and rejection coverage |
| `docs/scholarscout-rubric.md` | Updated the admin baseline and next logical work |

**Follow-up Risks:**
1. **Backup browsing** - Backups are recorded, but staff cannot yet browse backup history or restore one directly from the UI.

---

### Task 46 - Restore Backup History Browsing
**Status:** Complete  
**Description:** Let staff review recent restore backups without exposing the full backed-up data document in the browser.

**Acceptance Criteria:**
- [x] Backup history summaries include id, timestamp, actor, reason, and data counts.
- [x] Backup summaries are sorted newest first.
- [x] The staff API returns only backup metadata, not full snapshot payloads.
- [x] The admin data operations panel shows recent backup history in a mobile-readable layout.
- [x] Helper tests cover backup summary ordering and payload redaction.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added restore backup summary helper |
| `apps/web/app/api/admin/data/backups/route.ts` | Added protected backup history endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added restore backup history panel |
| `apps/web/__tests__/lib/data-store.test.ts` | Added backup summary coverage |
| `docs/scholarscout-rubric.md` | Updated admin baseline and next logical work |

**Follow-up Risks:**
1. **Backup restore planning** - Staff can browse backup summaries, but still need a comparison preview before restoring a saved backup.

---

### Task 47 - Backup Restore Planning
**Status:** Complete  
**Description:** Let staff preview the count-level impact of restoring a saved backup before any backup restore execution path exists.

**Acceptance Criteria:**
- [x] Restore planning compares current data counts with the selected backup's saved data counts.
- [x] Planning rows include current count, restored count, and delta for each governed data area.
- [x] `/api/admin/data/backups/[id]/plan` requires a staff session.
- [x] Missing backups return a practical 404 response.
- [x] The admin backup history panel includes a touch-sized preview action and read-only impact table.
- [x] Helper tests cover restore plan rows and missing backup behavior.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added restore backup planning helper and count rows |
| `apps/web/app/api/admin/data/backups/[id]/plan/route.ts` | Added protected restore planning endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added backup impact preview UI |
| `apps/web/__tests__/lib/data-store.test.ts` | Added restore planning coverage |
| `docs/scholarscout-rubric.md` | Updated admin baseline and next logical work |

**Follow-up Risks:**
1. **Backup restore execution** - Staff can preview a saved backup restore, but cannot yet execute that restore directly from backup history.

---

### Task 48 - Guarded Backup Restore Execution
**Status:** Complete  
**Description:** Let staff restore a previously saved backup after reviewing the impact preview and typing the restore confirmation phrase.

**Acceptance Criteria:**
- [x] Backup restore execution requires staff auth through a protected API.
- [x] Staff must type `RESTORE SCHOLARSCOUT DATA` before the restore runs.
- [x] Backup restore saves the current data document as a new backup before replacing it.
- [x] The restored document retains bounded backup history and removes the backup that became active data.
- [x] The restored document records a data audit event for the source backup.
- [x] The admin backup impact preview includes reason capture and a guarded restore action.
- [x] Helper tests cover missing backup handling, current-data backup, restored data counts, and audit event recording.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added saved-backup restore execution helper |
| `apps/web/app/api/admin/data/backups/[id]/restore/route.ts` | Added protected backup restore endpoint |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added guarded saved-backup restore controls |
| `apps/web/__tests__/lib/data-store.test.ts` | Added saved-backup restore coverage |
| `docs/scholarscout-rubric.md` | Updated admin baseline and next logical work |

**Follow-up Risks:**
1. **API route coverage** - Helper coverage exists, but the new backup restore route should get auth/confirmation/not-found tests alongside the existing admin route tests when route-level tests are introduced.

---

### Task 49 - Admin Data Route-Level Tests
**Status:** Complete  
**Description:** Add focused route-level coverage for admin data import validation, snapshot restore confirmation, backup restore planning, and saved-backup restore authorization behavior.

**Acceptance Criteria:**
- [x] Route tests cover staff-session enforcement for import validation, backup planning, and backup restore.
- [x] Import validation route tests cover invalid JSON and valid snapshots.
- [x] Snapshot restore route tests cover confirmation enforcement before writes.
- [x] Backup planning route tests cover missing backup and successful plan responses.
- [x] Saved-backup restore route tests cover confirmation enforcement and successful restore behavior.
- [x] Route tests use the active data-store boundary without exposing full backup payloads to the browser route responses.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/__tests__/api/admin-data-routes.test.ts` | Added admin data route-level coverage |
| `docs/scholarscout-rubric.md` | Updated next logical work after route coverage |

**Follow-up Risks:**
1. **Production configuration** - OAuth and durable data-store secrets still need to be provisioned in the chosen hosting environment.

---

### Task 50 - Production Readiness Checklist
**Status:** Complete  
**Description:** Add an operator checklist for OAuth, staff allowlist, durable data-store setup, restore validation, deployment checks, and credential rotation.

**Acceptance Criteria:**
- [x] Checklist identifies supported production data adapters and required secrets.
- [x] Auth secret setup includes `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth provider secrets, and staff allowlist guidance.
- [x] OAuth redirect URLs are documented for Google and GitHub.
- [x] Staff access validation includes signed-in and signed-out API checks.
- [x] Data operations validation includes export, restore validation, backup history, and backup restore preview.
- [x] Docker-free Vercel verification remains part of deployment checks.
- [x] Credential rotation steps include redeploy, role verification, and old-secret revocation.

**Files Changed:**
| File | Description |
|---|---|
| `docs/production-readiness-checklist.md` | Added production setup and rotation checklist |
| `README.md` | Linked the production readiness checklist |
| `docs/scholarscout-rubric.md` | Added production readiness baseline and updated next logical work |

**Follow-up Risks:**
1. **External provisioning** - Actual OAuth clients, Vercel Blob token, or HTTP service credentials still need to be created in their provider consoles before production traffic.

---

### Task 51 - Backup Retention Health Checks
**Status:** Complete  
**Description:** Add automated restore-backup retention checks to the data status path so staff can see whether backup history is within policy.

**Acceptance Criteria:**
- [x] Data status includes retained backup count, max retained backups, policy state, and retention issues.
- [x] Retention checks flag backup history above the bounded retention policy.
- [x] Retention checks flag nested backup history inside saved backups.
- [x] Retention checks flag duplicate backup ids.
- [x] Admin data operations shows backup retention status in a mobile-readable panel.
- [x] Tests cover retention policy drift.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added backup retention status helper and data status field |
| `apps/web/components/admin/ProgrammeAdminManager.tsx` | Added backup retention panel to data operations |
| `apps/web/__tests__/lib/data-store.test.ts` | Added retention drift coverage |
| `docs/production-readiness-checklist.md` | Added retention check to production data validation |
| `docs/scholarscout-rubric.md` | Updated admin baseline and next logical work |

**Follow-up Risks:**
1. **Production smoke tests** - Retention is visible to staff, but OAuth and durable adapter secrets still need live-environment smoke tests after provisioning.

---

### Task 52 - Production Smoke Test Script
**Status:** Complete  
**Description:** Add a deploy-target smoke test command for public routes, Auth.js provider discovery, admin data API protection, staff data status, durable adapter health, backup retention, and export access.

**Acceptance Criteria:**
- [x] Smoke command accepts `SCHOLARSCOUT_SMOKE_BASE_URL` or `NEXTAUTH_URL`.
- [x] Public smoke checks cover home, programmes, sign-in, and Auth.js providers.
- [x] Signed-out smoke checks confirm admin data APIs return `403`.
- [x] Optional staff-cookie smoke checks verify data status, durable adapter state, backup retention, and export access.
- [x] Optional expected adapter check verifies the deployed adapter matches the provisioned target.
- [x] Production readiness docs explain how to run unauthenticated and staff-authenticated smoke checks without committing secrets.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added production smoke test runner |
| `package.json` | Added `npm run smoke:production` |
| `docs/production-readiness-checklist.md` | Documented smoke check usage |
| `README.md` | Listed the production smoke command |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and next logical work |

**Follow-up Risks:**
1. **Live secrets required** - Authenticated production smoke checks still require a real deployed URL, staff sign-in, and durable adapter credentials.

---

### Task 53 - Scheduled Production Monitoring
**Status:** Complete  
**Description:** Add scheduled GitHub Actions monitoring for deployed ScholarScout smoke checks, data adapter health, and backup retention once production secrets are configured.

**Acceptance Criteria:**
- [x] Scheduled workflow runs the production smoke command every six hours.
- [x] Workflow can be triggered manually with an override base URL.
- [x] Workflow installs dependencies with `--ignore-scripts` to preserve the Docker-free Vercel posture.
- [x] Workflow supports repository secrets for deployed URL, staff cookie, and expected adapter.
- [x] Production readiness docs explain the required monitoring secrets and staff-cookie refresh path.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-monitor.yml` | Added scheduled production smoke monitor |
| `docs/production-readiness-checklist.md` | Documented scheduled monitoring setup |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and next logical work |

**Follow-up Risks:**
1. **Secret freshness** - Staff-authenticated checks depend on a valid staff session cookie until a service-token based health endpoint exists.

---

### Task 54 - Provider-Specific Production Secret Notes
**Status:** Complete  
**Description:** Add concrete provider mapping notes for production OAuth, durable data-store, and scheduled monitoring secrets.

**Acceptance Criteria:**
- [x] Google OAuth notes map client id, client secret, and callback URL to ScholarScout env vars.
- [x] GitHub OAuth notes map client id, client secret, and callback URL to ScholarScout env vars.
- [x] Vercel Blob notes identify adapter, token, path, validation, and rotation steps.
- [x] HTTP data-store notes identify service URL, bearer token, validation, and rotation steps.
- [x] GitHub Actions monitoring notes identify required smoke-test repository secrets.
- [x] Production readiness docs link to the provider-specific notes.

**Files Changed:**
| File | Description |
|---|---|
| `docs/production-secret-provider-notes.md` | Added provider-specific production secret setup notes |
| `docs/production-readiness-checklist.md` | Linked provider-specific notes |
| `README.md` | Linked provider-specific production setup notes |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and next logical work |

**Follow-up Risks:**
1. **Monitoring auth** - Scheduled staff checks still depend on browser cookie freshness until a service-token health endpoint exists.

---

### Task 55 - Service-Token Data Health Endpoint
**Status:** Complete  
**Description:** Add a bearer-token data health endpoint so scheduled production monitoring can verify data adapter health and backup retention without a staff browser session.

**Acceptance Criteria:**
- [x] `/api/admin/data/health` requires `SCHOLARSCOUT_HEALTH_TOKEN`.
- [x] Requests without the bearer token or with the wrong token return `403`.
- [x] Missing server health-token configuration returns a practical `503`.
- [x] Successful health responses include checked timestamp, data status, counts, and backup retention status.
- [x] Production smoke checks prefer `SCHOLARSCOUT_SMOKE_HEALTH_TOKEN` for data health.
- [x] Scheduled monitoring workflow accepts the smoke health-token secret.
- [x] Route tests cover forbidden, misconfigured, and successful health responses.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/app/api/admin/data/health/route.ts` | Added bearer-token data health endpoint |
| `scripts/production-smoke.mjs` | Added health-token data checks |
| `.github/workflows/production-monitor.yml` | Added health-token monitoring secret |
| `apps/web/__tests__/api/admin-data-routes.test.ts` | Added health endpoint route coverage |
| `README.md` | Documented `SCHOLARSCOUT_HEALTH_TOKEN` |
| `docs/production-readiness-checklist.md` | Documented health token setup and smoke usage |
| `docs/production-secret-provider-notes.md` | Added health token to provider secret notes |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and next logical work |

**Follow-up Risks:**
1. **Live provisioning** - Health checks are ready, but still need production secrets and a deployed URL to run against.

---

### Task 56 - Production Environment Readiness Check
**Status:** Complete  
**Description:** Add a local command that validates production environment variables before deployment.

**Acceptance Criteria:**
- [x] Command validates `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, staff allowlist, and health-token configuration.
- [x] Command checks Google/GitHub OAuth pairs and fails incomplete provider configuration.
- [x] Command rejects local JSON storage for production and validates the selected HTTP or Vercel Blob adapter.
- [x] Command reports warnings for optional monitoring settings without printing secret values.
- [x] README and production checklist document when to run the command.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-env-check.mjs` | Added production env readiness checker |
| `package.json` | Added `npm run check:production-env` |
| `README.md` | Documented the production env check command |
| `docs/production-readiness-checklist.md` | Added the env check to deployment checks |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and definition of done |

**Follow-up Risks:**
1. **Live validation** - The checker catches configuration shape problems, but provider consoles, deployed URLs, and durable data permissions still need smoke testing after deployment.

---

### Task 57 - Machine-Readable Production Env Report
**Status:** Complete  
**Description:** Let release tooling capture the production environment readiness result as JSON.

**Acceptance Criteria:**
- [x] `npm run check:production-env -- --json` returns the same pass/warn/fail checks as structured JSON.
- [x] JSON output includes summary counts.
- [x] Secret values are not printed in text or JSON output.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-env-check.mjs` | Added `--json` report mode |
| `README.md` | Documented the JSON readiness report command |

**Follow-up Risks:**
1. **Artifact retention** - CI can upload the report, but retention and access controls should follow the repository's release policy.

---

### Task 58 - Production Environment Template
**Status:** Complete  
**Description:** Add a placeholder-only production environment template for hosting and monitoring setup.

**Acceptance Criteria:**
- [x] Template includes Auth.js, OAuth, staff allowlist, data adapter, health-token, and smoke-test variables.
- [x] Template avoids real secrets.
- [x] README and provider notes point operators to the template.

**Files Changed:**
| File | Description |
|---|---|
| `.env.production.example` | Added production variable-name template |
| `README.md` | Linked the template |
| `docs/production-secret-provider-notes.md` | Linked the template from provider setup notes |

**Follow-up Risks:**
1. **Provider drift** - Provider dashboards can change; the template covers variable names, not provider-console UI.

---

### Task 59 - Manual Production Readiness Workflow
**Status:** Complete  
**Description:** Add a GitHub Actions workflow that runs the production env checker against configured secrets before launch.

**Acceptance Criteria:**
- [x] Workflow can run manually with an optional production base URL override.
- [x] Workflow maps the same production env and monitoring secret names used by the app.
- [x] Workflow installs dependencies with `--ignore-scripts`.
- [x] Workflow uploads a JSON readiness report artifact.
- [x] Production readiness docs mention the workflow.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-readiness.yml` | Added manual readiness workflow |
| `docs/production-readiness-checklist.md` | Documented the manual readiness workflow |

**Follow-up Risks:**
1. **Secret scoping** - Repository or environment secrets still need to be granted to the workflow in GitHub before it can pass.

---

### Task 60 - Production Smoke Auth Provider Expectations
**Status:** Complete  
**Description:** Let production smoke checks verify that expected Auth.js OAuth providers are visible after deployment.

**Acceptance Criteria:**
- [x] Smoke checks accept `SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS` as a comma-separated provider list.
- [x] Provider discovery fails the smoke run when an expected provider is missing.
- [x] Scheduled monitoring passes the expected provider secret through to the smoke command.
- [x] README and production secret notes document the setting.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added expected Auth.js provider checks |
| `.github/workflows/production-monitor.yml` | Added provider expectation env mapping |
| `README.md` | Documented the smoke provider expectation |
| `docs/production-secret-provider-notes.md` | Added monitoring secret notes for provider expectations |

**Follow-up Risks:**
1. **OAuth behavior** - Provider discovery confirms configuration is loaded; full sign-in still needs a real browser OAuth check after provider setup.

---

### Task 61 - Production Data Health Freshness Checks
**Status:** Complete  
**Description:** Strengthen production smoke checks so service-token data health responses prove they are current and issue-free.

**Acceptance Criteria:**
- [x] Health-token smoke checks fail when data status issues are present.
- [x] Health-token smoke checks validate `checkedAt` freshness.
- [x] Freshness window can be tuned with `SCHOLARSCOUT_SMOKE_MAX_HEALTH_AGE_MINUTES`.
- [x] Staff-cookie data status checks continue to work without requiring `checkedAt`.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added data status issue and health freshness checks |

**Follow-up Risks:**
1. **Clock skew** - Freshness checks assume the runner and deployed platform clocks are reasonably aligned.

---

### Task 62 - Production Tooling Test Harness
**Status:** Complete  
**Description:** Add focused root-level tests for production environment and smoke-check scripts.

**Acceptance Criteria:**
- [x] Tests cover JSON production env readiness output.
- [x] Tests verify secret values are not printed in readiness reports.
- [x] Tests cover production rejection of the JSON data adapter.
- [x] Tests cover successful smoke provider and health checks against a local mock target.
- [x] Tests cover missing expected Auth.js provider failures.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/test-production-tooling.mjs` | Added Node test harness for production scripts |
| `package.json` | Added `npm run test:production-tooling` |
| `README.md` | Listed the production tooling test command |
| `docs/production-readiness-checklist.md` | Added tooling tests to deployment checks |

**Follow-up Risks:**
1. **End-to-end OAuth** - The mock target covers provider discovery shape; real OAuth sign-in still needs manual/live validation.

---

### Task 63 - Production Smoke JSON Report
**Status:** Complete  
**Description:** Let production smoke checks emit machine-readable results for release notes and workflow artifacts.

**Acceptance Criteria:**
- [x] `npm run smoke:production -- --json` returns summary counts and check details.
- [x] Text output remains the default for local operator use.
- [x] JSON smoke output preserves failing exit codes when checks fail.
- [x] Tests cover successful and failing JSON smoke reports.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added `--json` report mode and summary counts |
| `scripts/test-production-tooling.mjs` | Covered smoke JSON reports |

**Follow-up Risks:**
1. **Report history** - Artifact retention is controlled by GitHub Actions settings rather than the script.

---

### Task 64 - Scheduled Monitor Smoke Artifacts
**Status:** Complete  
**Description:** Preserve scheduled production smoke results as a JSON artifact for easier incident triage.

**Acceptance Criteria:**
- [x] Production monitor writes `production-smoke-report.json` after smoke runs.
- [x] Report creation runs even when the main smoke command fails.
- [x] Workflow uploads the report artifact.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-monitor.yml` | Added smoke report generation and artifact upload |

**Follow-up Risks:**
1. **Artifact access** - Repository permissions determine who can read monitor artifacts.

---

### Task 65 - Production Secret Freshness Notes
**Status:** Complete  
**Description:** Document practical freshness and rotation cues for production and monitoring secrets.

**Acceptance Criteria:**
- [x] Notes cover OAuth secrets, Auth.js secret, data-store tokens, health token, and staff smoke cookie.
- [x] Notes remind operators to rerun env and smoke checks after rotation.
- [x] Notes avoid storing or exposing secret values.

**Files Changed:**
| File | Description |
|---|---|
| `docs/production-secret-provider-notes.md` | Added secret freshness and rotation cue table |

**Follow-up Risks:**
1. **Policy alignment** - Organization-specific security policy may require shorter rotation windows than this project guidance.

---

### Task 66 - Production Release Runbook
**Status:** Complete  
**Description:** Add an end-to-end production release sequence tying readiness checks, deployment, smoke checks, staff validation, monitoring, and release notes together.

**Acceptance Criteria:**
- [x] Runbook starts with production env validation.
- [x] Runbook includes the manual readiness workflow.
- [x] Runbook covers deployment, unauthenticated smoke checks, service-token smoke checks, and staff operations.
- [x] Runbook lists monitoring secrets and report artifacts.
- [x] README and readiness checklist link to the runbook.

**Files Changed:**
| File | Description |
|---|---|
| `docs/production-release-runbook.md` | Added production release runbook |
| `README.md` | Linked the production release runbook |
| `docs/production-readiness-checklist.md` | Linked the release runbook |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline and next logical work |

**Follow-up Risks:**
1. **Live operator execution** - The runbook is ready, but still needs a real production deployment and configured provider secrets to execute fully.

---

### Task 67 - Portable NPM Wrapper Argument Fix
**Status:** Complete  
**Description:** Make the portable npm PowerShell wrapper accept direct npm arguments reliably.

**Acceptance Criteria:**
- [x] Wrapper accepts direct arguments such as `--version`.
- [x] Wrapper still activates the portable Node path and npm cache.
- [x] Production tooling tests cover the wrapper on Windows.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/npm-portable.ps1` | Simplified npm argument forwarding |
| `scripts/test-production-tooling.mjs` | Added wrapper invocation coverage |

**Follow-up Risks:**
1. **Shell variance** - The `.cmd` wrapper remains the most portable option for plain command-prompt style invocation.

---

### Task 68 - Production Report Summary Generator
**Status:** Complete  
**Description:** Add a small report formatter that turns readiness and smoke JSON reports into Markdown release summaries.

**Acceptance Criteria:**
- [x] Formatter accepts readiness JSON reports.
- [x] Formatter accepts smoke JSON reports.
- [x] Formatter summarizes pass, warning/skip, and failure counts.
- [x] Formatter lists blocking and caution items without secret values.
- [x] Tests cover combined env and smoke report rendering.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-report-summary.mjs` | Added Markdown report formatter |
| `package.json` | Added `npm run report:production` |
| `scripts/test-production-tooling.mjs` | Added report formatter coverage |
| `README.md` | Listed the production report command |
| `docs/production-release-runbook.md` | Documented local report summary usage |

**Follow-up Risks:**
1. **Report completeness** - The formatter summarizes tooling reports; it does not replace human release notes for manual staff validation.

---

### Task 69 - Workflow Markdown Summaries
**Status:** Complete  
**Description:** Render production readiness and smoke reports directly into GitHub Actions step summaries.

**Acceptance Criteria:**
- [x] Production readiness workflow appends a Markdown env readiness summary.
- [x] Production monitor workflow appends a Markdown smoke summary.
- [x] JSON artifacts remain available for detailed inspection.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-readiness.yml` | Added readiness report summary step |
| `.github/workflows/production-monitor.yml` | Added smoke report summary step |

**Follow-up Risks:**
1. **Workflow failure mode** - If report generation fails before the summary step, operators still need to inspect raw logs.

---

### Task 70 - Production Incident Response Runbook
**Status:** Complete  
**Description:** Document the first-response path for production smoke, OAuth, data health, backup retention, and staff export failures.

**Acceptance Criteria:**
- [x] Runbook starts with the latest monitor run and report artifact.
- [x] Runbook maps common failure signals to first actions.
- [x] Runbook includes data-safety steps before restore actions.
- [x] Runbook covers credential response and communication notes.
- [x] README and readiness docs link to the runbook.

**Files Changed:**
| File | Description |
|---|---|
| `docs/production-incident-response.md` | Added production incident response runbook |
| `README.md` | Linked incident response notes |
| `docs/production-readiness-checklist.md` | Linked incident response notes |
| `docs/production-release-runbook.md` | Linked incident response from post-release monitoring |

**Follow-up Risks:**
1. **Escalation policy** - Organization-specific paging or owner escalation details still need to be added when the ops team is known.

---

### Task 71 - Smoke Health Window Template
**Status:** Complete  
**Description:** Include the configurable smoke health freshness window in the production environment template.

**Acceptance Criteria:**
- [x] Template includes `SCHOLARSCOUT_SMOKE_MAX_HEALTH_AGE_MINUTES`.
- [x] Default value matches the smoke script default.

**Files Changed:**
| File | Description |
|---|---|
| `.env.production.example` | Added smoke health freshness window variable |

**Follow-up Risks:**
1. **Clock behavior** - The configured window may need adjustment if the deployment platform or workflow runner shows recurring clock skew.

---

### Task 72 - Smoke Network Failure Reporting
**Status:** Complete  
**Description:** Make production smoke checks report request failures and timeouts as structured failed checks instead of crashing.

**Acceptance Criteria:**
- [x] Smoke requests use a configurable per-request timeout.
- [x] Network failures are recorded in text and JSON reports.
- [x] JSON reports are still emitted when the target is unreachable.
- [x] Tests cover unreachable target behavior.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added request timeout and network error handling |
| `scripts/test-production-tooling.mjs` | Added unreachable-target smoke coverage |
| `.env.production.example` | Added `SCHOLARSCOUT_SMOKE_TIMEOUT_MS` |
| `README.md` | Documented smoke timeout tuning |
| `docs/production-release-runbook.md` | Documented timeout tuning guidance |
| `docs/production-secret-provider-notes.md` | Added smoke timeout monitoring note |
| `docs/production-incident-response.md` | Added timeout/network failure first action |

**Follow-up Risks:**
1. **Slow incidents** - Raising the timeout can hide degraded performance; check hosting health before tuning it upward.

---

### Task 73 - HTTPS Production URL Validation
**Status:** Complete  
**Description:** Tighten production environment readiness so non-local production URLs must use HTTPS.

**Acceptance Criteria:**
- [x] `NEXTAUTH_URL` must be HTTP(S).
- [x] Non-local `NEXTAUTH_URL` values must use HTTPS.
- [x] Localhost remains allowed for local readiness experiments.
- [x] Tests cover non-local HTTP rejection.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-env-check.mjs` | Added production URL validation |
| `scripts/test-production-tooling.mjs` | Added non-local HTTP rejection coverage |

**Follow-up Risks:**
1. **Preview environments** - Preview URLs should also use HTTPS in normal hosting setups.

---

### Task 74 - Production Workflow Permissions
**Status:** Complete  
**Description:** Set explicit minimal permissions on production readiness and monitor workflows.

**Acceptance Criteria:**
- [x] Readiness workflow declares read-only repository permissions.
- [x] Monitor workflow declares read-only repository permissions.
- [x] Artifact upload still remains available through the workflow runtime.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-readiness.yml` | Added explicit workflow permissions |
| `.github/workflows/production-monitor.yml` | Added explicit workflow permissions |

**Follow-up Risks:**
1. **Repository policy** - Organization-level GitHub settings may further restrict artifact behavior.

---

### Task 75 - Production Workflow Concurrency
**Status:** Complete  
**Description:** Prevent overlapping production readiness and monitoring runs from muddying release signals.

**Acceptance Criteria:**
- [x] Readiness workflow cancels older in-progress readiness checks for the same workflow.
- [x] Monitor workflow serializes scheduled/manual smoke checks without canceling an active run.
- [x] Concurrency groups are named for ScholarScout production operations.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-readiness.yml` | Added readiness concurrency group |
| `.github/workflows/production-monitor.yml` | Added monitor concurrency group |

**Follow-up Risks:**
1. **Long incidents** - A long-running monitor can delay the next scheduled check; use manual runs when active investigation needs a fresh signal.

---

### Task 76 - Smoke Timeout Template And Docs
**Status:** Complete  
**Description:** Surface smoke timeout tuning in the production template and operator docs.

**Acceptance Criteria:**
- [x] Production env template includes `SCHOLARSCOUT_SMOKE_TIMEOUT_MS`.
- [x] README documents the setting.
- [x] Release and incident runbooks explain when to tune it.

**Files Changed:**
| File | Description |
|---|---|
| `.env.production.example` | Added smoke timeout variable |
| `README.md` | Documented smoke timeout |
| `docs/production-release-runbook.md` | Added timeout guidance |
| `docs/production-incident-response.md` | Added timeout incident guidance |

**Follow-up Risks:**
1. **Performance monitoring** - This smoke timeout is a guardrail, not a full latency monitoring system.

---

### Task 77 - Smoke Transient Retry Support
**Status:** Complete  
**Description:** Let production smoke checks retry transient request failures before marking a check failed.

**Acceptance Criteria:**
- [x] Smoke requests retry failed fetch attempts.
- [x] Retry count is configurable with `SCHOLARSCOUT_SMOKE_RETRIES`.
- [x] Successful retried checks show attempt count in report details.
- [x] Tests cover a dropped first request that succeeds on retry.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added retry support and attempt details |
| `scripts/test-production-tooling.mjs` | Added transient retry coverage |
| `.env.production.example` | Added `SCHOLARSCOUT_SMOKE_RETRIES` |
| `README.md` | Documented smoke retries |
| `docs/production-release-runbook.md` | Added retry guidance |
| `docs/production-secret-provider-notes.md` | Added retry monitoring note |

**Follow-up Risks:**
1. **Masked flakiness** - Keep retries low so recurring network problems still fail loudly.

---

### Task 78 - Smoke Request Latency Details
**Status:** Complete  
**Description:** Include request duration in production smoke check details so reports show slow paths at a glance.

**Acceptance Criteria:**
- [x] Successful smoke checks include response duration.
- [x] Retried successful checks include attempt count.
- [x] JSON and text outputs use the same detail string.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added response duration details |

**Follow-up Risks:**
1. **Precision** - Durations are simple wall-clock timings from the smoke runner, not deep application tracing.

---

### Task 79 - Optional Smoke Latency Ceiling
**Status:** Complete  
**Description:** Allow production smoke checks to fail when successful requests are slower than an operator-defined ceiling.

**Acceptance Criteria:**
- [x] `SCHOLARSCOUT_SMOKE_MAX_LATENCY_MS` enables per-request latency failures.
- [x] The ceiling is disabled when unset or zero.
- [x] Latency failures are included in JSON reports.
- [x] Tests cover slow endpoint failure behavior.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-smoke.mjs` | Added optional latency ceiling checks |
| `scripts/test-production-tooling.mjs` | Added slow endpoint coverage |
| `.env.production.example` | Added latency ceiling variable |
| `README.md` | Documented latency ceiling |
| `docs/production-release-runbook.md` | Added latency ceiling guidance |
| `docs/production-secret-provider-notes.md` | Added latency ceiling monitoring note |
| `docs/production-incident-response.md` | Added latency failure guidance |

**Follow-up Risks:**
1. **Threshold tuning** - A single fixed ceiling is useful for smoke checks but not a replacement for percentile latency monitoring.

---

### Task 80 - Production Artifact Retention
**Status:** Complete  
**Description:** Set explicit retention for production readiness and smoke JSON artifacts.

**Acceptance Criteria:**
- [x] Readiness report artifact retention is set.
- [x] Smoke report artifact retention is set.
- [x] Retention keeps reports long enough for short incident review without retaining them indefinitely.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/production-readiness.yml` | Added readiness artifact retention |
| `.github/workflows/production-monitor.yml` | Added smoke artifact retention |

**Follow-up Risks:**
1. **Compliance policy** - Repository or organization policy may require a different retention period.

---

### Task 81 - Smoke Retry And Latency Operator Docs
**Status:** Complete  
**Description:** Document smoke retry and latency tuning in operator-facing production notes.

**Acceptance Criteria:**
- [x] README lists retry and latency variables.
- [x] Release runbook explains when to tune retries and latency.
- [x] Secret/provider notes include monitoring variables.
- [x] Incident response notes include latency failure guidance.

**Files Changed:**
| File | Description |
|---|---|
| `README.md` | Added smoke retry and latency docs |
| `docs/production-release-runbook.md` | Added retry and latency release guidance |
| `docs/production-secret-provider-notes.md` | Added retry and latency monitoring notes |
| `docs/production-incident-response.md` | Added latency incident guidance |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline |

**Follow-up Risks:**
1. **Operational ownership** - Final retry and latency thresholds should be chosen by whoever owns production monitoring.

---

### Task 82 - Prelaunch Rehearsal Command
**Status:** Complete  
**Description:** Add a single command that captures production readiness, tooling test, optional smoke, and Markdown summary artifacts for launch rehearsal.

**Acceptance Criteria:**
- [x] Command writes reports into a predictable output directory.
- [x] Command always captures production env readiness JSON.
- [x] Command can run production tooling tests.
- [x] Command runs smoke checks when a smoke target is configured.
- [x] Command supports skipping smoke and tooling tests for local dry runs.
- [x] Tests cover deterministic rehearsal artifact generation.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/prelaunch-rehearsal.mjs` | Added prelaunch rehearsal orchestrator |
| `package.json` | Added `npm run rehearse:prelaunch` |
| `scripts/test-production-tooling.mjs` | Added rehearsal artifact coverage |
| `README.md` | Listed the rehearsal command |
| `docs/production-release-runbook.md` | Added rehearsal usage |
| `docs/production-readiness-checklist.md` | Added rehearsal check |

**Follow-up Risks:**
1. **Live validation** - Local rehearsal can skip smoke, but launch rehearsal should run against the deployed URL before traffic.

---

### Task 83 - Prelaunch Rehearsal Workflow
**Status:** Complete  
**Description:** Add a manual GitHub Actions workflow for full prelaunch rehearsal against repository or environment secrets.

**Acceptance Criteria:**
- [x] Workflow can run manually with an optional base URL override.
- [x] Workflow maps production, data-store, health, and smoke variables.
- [x] Workflow installs dependencies without postinstall scripts.
- [x] Workflow uploads the rehearsal artifact folder.
- [x] Workflow appends the rehearsal summary to the GitHub step summary.

**Files Changed:**
| File | Description |
|---|---|
| `.github/workflows/prelaunch-rehearsal.yml` | Added manual prelaunch rehearsal workflow |
| `docs/production-readiness-checklist.md` | Documented the rehearsal workflow |

**Follow-up Risks:**
1. **Secret availability** - The workflow depends on the production/preview secrets being configured for GitHub Actions.

---

### Task 84 - Prelaunch Evidence Template
**Status:** Complete  
**Description:** Add a concise launch-readiness evidence template for recording rehearsal outputs and decisions.

**Acceptance Criteria:**
- [x] Template records release candidate metadata.
- [x] Template references rehearsal artifacts.
- [x] Template captures launch decision, risks, and follow-up owner.
- [x] Template warns against pasting secrets or data snapshots.

**Files Changed:**
| File | Description |
|---|---|
| `docs/prelaunch-evidence-template.md` | Added prelaunch evidence template |
| `README.md` | Linked the evidence template |
| `docs/production-release-runbook.md` | Linked the evidence template |

**Follow-up Risks:**
1. **Ownership detail** - The template needs real owner names once the launch team is known.

---

### Task 85 - Rehearsal Summary Artifacts
**Status:** Complete  
**Description:** Generate a Markdown summary alongside prelaunch rehearsal JSON and test artifacts.

**Acceptance Criteria:**
- [x] Rehearsal summary lists step status and artifact paths.
- [x] Summary includes the production report formatter output.
- [x] Workflow publishes the summary into GitHub Actions step summary.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/prelaunch-rehearsal.mjs` | Added Markdown summary generation |
| `.github/workflows/prelaunch-rehearsal.yml` | Publishes the summary to GitHub Actions |

**Follow-up Risks:**
1. **Summary scope** - Staff manual validation still needs to be recorded separately in the evidence template.

---

### Task 86 - Prelaunch Readiness Documentation
**Status:** Complete  
**Description:** Tie prelaunch rehearsal into the README, production readiness checklist, release runbook, and rubric.

**Acceptance Criteria:**
- [x] README lists the rehearsal command and evidence template.
- [x] Production readiness checklist includes the rehearsal command and workflow.
- [x] Release runbook explains where rehearsal artifacts are written.
- [x] Rubric production readiness baseline includes prelaunch rehearsal artifacts.

**Files Changed:**
| File | Description |
|---|---|
| `README.md` | Added prelaunch rehearsal docs |
| `docs/production-readiness-checklist.md` | Added rehearsal checklist docs |
| `docs/production-release-runbook.md` | Added rehearsal workflow and artifact docs |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline |

**Follow-up Risks:**
1. **Real launch execution** - Documentation is ready; the actual rehearsal still needs production or preview secrets and a deployed URL.

---

### Task 87 - Env-File Loading For Production Tooling
**Status:** Complete  
**Description:** Let production readiness, smoke, and prelaunch rehearsal commands load local environment values from an explicit env file.

**Acceptance Criteria:**
- [x] Readiness checker accepts `--env-file`.
- [x] Smoke checker accepts `--env-file`.
- [x] Prelaunch rehearsal accepts `--env-file` and passes it to child checks.
- [x] Env-file parser ignores comments and blank lines.
- [x] Tests cover env-file readiness loading.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/env-file.mjs` | Added shared env-file parser |
| `scripts/production-env-check.mjs` | Loads explicit env files |
| `scripts/production-smoke.mjs` | Loads explicit env files |
| `scripts/prelaunch-rehearsal.mjs` | Loads and forwards explicit env files |
| `scripts/test-production-tooling.mjs` | Added env-file coverage |

**Follow-up Risks:**
1. **Secret handling** - Env files with real secrets must remain uncommitted and access-controlled.

---

### Task 88 - Local Prelaunch Workaround Template
**Status:** Complete  
**Description:** Add a local-only prelaunch env template for rehearsing tooling before real provider secrets exist.

**Acceptance Criteria:**
- [x] Template uses localhost URLs.
- [x] Template uses credentials-only auth as an explicit local workaround.
- [x] Template points at the local HTTP data service fixture.
- [x] Local env filename is ignored by git.

**Files Changed:**
| File | Description |
|---|---|
| `.env.prelaunch.local.example` | Added local rehearsal workaround template |
| `.gitignore` | Ensures `.env.prelaunch.local` stays untracked |

**Follow-up Risks:**
1. **Production misuse** - This template must not be used for public production traffic.

---

### Task 89 - Env-File Rehearsal Coverage
**Status:** Complete  
**Description:** Cover prelaunch rehearsal with explicit env-file loading so local workaround behavior remains stable.

**Acceptance Criteria:**
- [x] Tests run prelaunch rehearsal with `--env-file`.
- [x] Tests verify readiness failures clear when local workaround values are provided.
- [x] Smoke can still be skipped for deterministic local tests.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/test-production-tooling.mjs` | Added prelaunch env-file rehearsal test |

**Follow-up Risks:**
1. **Live smoke** - Local test coverage does not replace live smoke checks against a deployed URL.

---

### Task 90 - Prelaunch Workaround Documentation
**Status:** Complete  
**Description:** Document the boundary between local rehearsal workarounds and real production launch configuration.

**Acceptance Criteria:**
- [x] README documents `--env-file` usage.
- [x] Release runbook includes local workaround commands.
- [x] Readiness checklist explains local env-file rehearsal.
- [x] Provider notes and incident docs warn against production misuse.
- [x] Evidence template marks local workaround evidence as non-production.

**Files Changed:**
| File | Description |
|---|---|
| `README.md` | Added local prelaunch template and env-file docs |
| `docs/production-release-runbook.md` | Added local workaround commands |
| `docs/production-readiness-checklist.md` | Added env-file rehearsal note |
| `docs/production-secret-provider-notes.md` | Added workaround boundary note |
| `docs/production-incident-response.md` | Added local workaround boundary |
| `docs/prelaunch-evidence-template.md` | Added local workaround evidence note |

**Follow-up Risks:**
1. **Operator discipline** - Operators still need to replace workaround values with real OAuth and durable data credentials before launch.

---

### Task 91 - Blocking Item Refinement
**Status:** Complete  
**Description:** Turn the current missing-secret blocker into a repeatable local workaround and real-launch handoff path.

**Acceptance Criteria:**
- [x] Missing local shell env can be bypassed with an explicit env file.
- [x] Local rehearsal can pass readiness without real OAuth only when explicitly allowed.
- [x] Docs clearly state that real production still requires real provider secrets and hosted durable data.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/production-env-check.mjs` | Supports explicit env-file inputs |
| `.env.prelaunch.local.example` | Provides local workaround values |
| `docs/scholarscout-rubric.md` | Updated production readiness baseline |

**Follow-up Risks:**
1. **Remaining blocker** - Real production provisioning remains external: OAuth app credentials, hosting env vars, durable data credentials, and deployed URL.

---

### Task 92 - Shortlist Decision Guide
**Status:** Complete  
**Description:** Turn the saved-programme shortlist into a more practical student decision surface with ranked fit signals and next actions.

**Acceptance Criteria:**
- [x] Shortlist helpers summarize each saved programme by cost, access, support, and readiness signals.
- [x] Decision summaries sort saved programmes by practical signal strength with match score as a tie-breaker.
- [x] Shortlist page shows a decision guide before the comparison table.
- [x] Each saved programme includes strengths/cautions and a concrete next action.
- [x] Helper tests cover decision signals, sorting, and headline copy.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/shortlist.ts` | Added shortlist decision summary helpers |
| `apps/web/components/shortlist/ShortlistComparison.tsx` | Added student-facing decision guide cards |
| `apps/web/__tests__/lib/shortlist.test.ts` | Added decision guide helper coverage |
| `docs/scholarscout-rubric.md` | Updated shortlist baseline and next logical product work |

**Follow-up Risks:**
1. **Personal notes** - Students can see decision signals, but still need saved notes and planning status to track outreach, visits, and application steps.

---

### Task 93 - Shortlist Planning Notes
**Status:** Complete  
**Description:** Let students track lightweight planning status and notes for each saved programme directly from the shortlist decision guide.

**Acceptance Criteria:**
- [x] Shortlist planning state supports status and notes per saved programme.
- [x] Planning state persists locally with the existing shortlist fallback pattern.
- [x] Removed programmes prune their saved planning state.
- [x] Decision guide cards include a status selector and notes field.
- [x] Helper tests cover parsing, updating, pruning, and status labels.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/shortlist.ts` | Added shortlist planning state helpers and status labels |
| `apps/web/components/shortlist/ShortlistComparison.tsx` | Added planning status and notes controls to decision cards |
| `apps/web/__tests__/lib/shortlist.test.ts` | Added planning helper coverage |
| `docs/scholarscout-rubric.md` | Updated shortlist baseline and next logical product work |

**Follow-up Risks:**
1. **Account sync** - Planning notes are local-only for now; account-backed persistence should be added once the student planning shape settles.

---

### Task 94 - Account-Backed Shortlist Planning Sync
**Status:** Complete  
**Description:** Persist student shortlist planning status and notes through the account shortlist API when a student is signed in.

**Acceptance Criteria:**
- [x] Data store supports per-user shortlist planning state.
- [x] Shortlist planning state is preserved in data exports/restores.
- [x] Account shortlist `GET` returns programme ids and saved planning state.
- [x] Account shortlist `POST` saves programme ids and planning state.
- [x] Signed-in shortlist UI loads server planning state and posts planning updates.
- [x] Removed programmes prune their account-backed planning state.
- [x] Tests cover data-store save, prune, import validation, and shortlist helper behavior.

**Files Changed:**
| File | Description |
|---|---|
| `apps/web/lib/server/data-store.ts` | Added account-backed shortlist plan persistence and restore validation |
| `apps/web/app/api/account/shortlist/route.ts` | Returns and saves shortlist planning state |
| `apps/web/components/shortlist/ShortlistComparison.tsx` | Syncs planning status and notes for signed-in students |
| `apps/web/__tests__/lib/data-store.test.ts` | Added account-backed planning persistence coverage |
| `docs/scholarscout-rubric.md` | Updated shortlist baseline and next logical product work |

**Follow-up Risks:**
1. **Write frequency** - Planning notes save on each edit; future UX can add debouncing or explicit saved-state feedback if needed.

---

### Task 95 - Environment Provisioning Starter
**Status:** Complete  
**Description:** Begin environment provisioning by generating local rehearsal credentials and a production provisioning checklist.

**Acceptance Criteria:**
- [x] Command generates an ignored `.env.prelaunch.local` file with local-only random secrets.
- [x] Command generates a production provisioning report listing external values still needed.
- [x] Command refuses to overwrite local env files unless `--force` is provided.
- [x] README documents the provisioning command.
- [x] Tests cover local env and checklist generation.
- [x] Generated local env passes prelaunch readiness with smoke/tooling skipped.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/provision-environment.mjs` | Added local environment provisioning helper |
| `package.json` | Added `npm run provision:env` |
| `scripts/test-production-tooling.mjs` | Added provisioning helper coverage |
| `README.md` | Documented local env provisioning |
| `docs/production-release-runbook.md` | Uses provisioning helper for local workaround |
| `.env.prelaunch.local` | Generated ignored local prelaunch env file |
| `reports/environment-provisioning.md` | Generated external production provisioning checklist |

**Follow-up Risks:**
1. **External provisioning** - Real production still needs provider-console setup: deployed URL, OAuth credentials, staff allowlist, health token, durable data credentials, and GitHub Actions secrets.

---

### Task 96 - Production Provider Handoff Values
**Status:** Complete  
**Description:** Generate a private production values handoff file for hosting, OAuth, durable data, health checks, and GitHub Actions secrets.

**Acceptance Criteria:**
- [x] Command generates an ignored `.env.production.local` file, with `--local-file` available for alternate output paths.
- [x] Command creates random `NEXTAUTH_SECRET` and `SCHOLARSCOUT_HEALTH_TOKEN` values.
- [x] Handoff file includes placeholders for OAuth credentials and Vercel Blob durable data credentials.
- [x] Command generates a non-secret provider setup report.
- [x] README and production docs describe how to use the handoff file.
- [x] Production tooling tests cover the generated env and provider checklist.

**Files Changed:**
| File | Description |
|---|---|
| `scripts/provision-production-values.mjs` | Added production values handoff generator |
| `package.json` | Added `npm run provision:production-values` |
| `scripts/test-production-tooling.mjs` | Added provider handoff generation coverage |
| `README.md` | Documented the production value handoff command |
| `docs/production-release-runbook.md` | Added the handoff command to the release sequence |
| `docs/production-secret-provider-notes.md` | Added production handoff file guidance |

**Follow-up Risks:**
1. **Provider-console dependency** - The command prepares local values, but provider admins still need to create the deployed URL, OAuth apps, Blob token, and GitHub Actions secrets.

---

### Task 97 - Vercel Workaround Permissions Handoff
**Status:** Complete  
**Description:** Link the Docker-free Vercel workaround to an explicit permissions handoff for project creation, GitHub integration, environment variables, Blob storage, deployment, and logs.

**Acceptance Criteria:**
- [x] `vercel.json` uses the Docker-free install command.
- [x] README links the Vercel permissions handoff.
- [x] Vercel deployment docs link the permissions handoff.
- [x] Vercel Docker workaround docs link the permissions handoff.
- [x] Production provider setup report points operators to the permissions handoff.

**Files Changed:**
| File | Description |
|---|---|
| `vercel.json` | Aligns cloud install command with the Docker-free workaround |
| `docs/vercel-permissions-handoff.md` | Adds exact Vercel role and integration access request |
| `README.md` | Links the Vercel permissions handoff |
| `docs/vercel-deployment.md` | Links access requirements from deployment docs |
| `docs/vercel-docker-workaround.md` | Links permissions from the workaround |
| `scripts/provision-production-values.mjs` | Adds permissions handoff to generated provider setup report |

**Follow-up Risks:**
1. **External admin action** - Only a Vercel owner/admin can grant Vercel team, project, and GitHub integration permissions.
