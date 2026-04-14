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
**Status:** 🔲 Pending  
**Description:** Define a consistent colour palette, typography scale, and spacing tokens in Tailwind config.

---

### Task 3 – Component Library Baseline
**Status:** 🔲 Pending  
**Description:** Build Button, Input, Card, and Badge primitives using Tailwind.

---

### Task 4 – Landing Page
**Status:** 🔲 Pending  
**Description:** Create a marketing landing page with hero, value-proposition section, and CTA.

---

### Task 5 – Authentication
**Status:** 🔲 Pending  
**Description:** Implement sign-up / sign-in with NextAuth.js (email + OAuth).

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
**Status:** 🔲 Pending  
**Description:** Display a filterable, paginated list of matched post-secondary programmes.

---

### Task 8 – Programme Detail Page
**Status:** 🔲 Pending  
**Description:** Show full programme details (tuition, acceptance rate, support services, location).

---

### Task 9 – Favourites / Shortlist
**Status:** 🔲 Pending  
**Description:** Allow students to save and compare shortlisted programmes.

---

### Task 10 – Admin CMS
**Status:** 🔲 Pending  
**Description:** Allow ScholarScout staff to add / edit programme records.
