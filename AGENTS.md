# AGENTS.md – ScholarScout Codex / Copilot Agent Instructions

This file is read automatically by AI coding agents (GitHub Copilot coding agent, OpenAI Codex, etc.) before they begin work in this repository. Follow every instruction here precisely.

---

## Project Overview

**ScholarScout** is a rejection-free post-secondary discovery platform. It matches students with programmes that fit their goals, budget, and life circumstances. The MVP is a Next.js web app with a multi-step onboarding wizard that collects six student-preference signals and (in future sprints) routes the student to matched programme listings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| Testing | Jest 30 + React Testing Library 16 |
| Linting | ESLint (eslint-config-next) |
| Runtime | Node.js 18+ |

---

## Repository Structure

```
app/
  page.tsx                         # Landing / home page
  layout.tsx                       # Root layout (fonts, metadata)
  globals.css                      # Global styles
  onboarding/
    page.tsx                       # Onboarding wizard page (/onboarding)
components/
  onboarding/
    OnboardingWizard.tsx           # Wizard root – state, validation, navigation
    ProgressIndicator.tsx          # Step progress indicator (dots + bar + sr-only)
    StepGpa.tsx                    # Step 1: GPA band chip selector
    StepInterests.tsx              # Step 2: Interests multi-select chips
    StepLocation.tsx               # Step 3: Location preference radio group
    StepPathway.tsx                # Step 4: Pathway preference radio group
    StepAffordability.tsx          # Step 5: Affordability labelled slider
    StepSupportNeeds.tsx           # Step 6: Support needs checklist
    OnboardingSummary.tsx          # Post-submit confirmation screen
lib/
  onboarding-types.ts              # TypeScript types, constants, and label maps
  onboarding-validation.ts         # Per-step and full-form validation functions
__tests__/
  lib/
    onboarding-validation.test.ts  # Unit tests for validation logic
  components/
    StepGpa.test.tsx
    StepInterests.test.tsx
    StepAffordability.test.tsx
    StepSupportNeeds.test.tsx
    OnboardingWizard.test.tsx      # Integration tests for the full wizard flow
docs/
  codex-backlog.md                 # Sprint backlog and task definitions
```

---

## Essential Commands

Always run these commands to validate your work. Never skip them.

```bash
# Install dependencies (run once, or after package.json changes)
npm install

# Lint – must pass with zero errors
npm run lint

# Build – must compile without TypeScript errors
npm run build

# Run all tests – all must pass
npm test

# Run tests in watch mode (for development iteration)
npm run test:watch
```

**Required passing state before marking any task done:**
1. `npm run lint` exits 0
2. `npm run build` exits 0
3. `npm test` exits 0 (all existing tests pass, new tests added where appropriate)

---

## Coding Conventions

### TypeScript
- Use strict TypeScript. Do **not** use `any`; prefer `unknown` and narrow with type guards.
- Place shared types and constants in `lib/onboarding-types.ts` (or a new `lib/` file for future domains).
- Export validation functions from `lib/` files, never inline them in components.

### React / Next.js
- Use the **App Router** (`app/` directory). Do not create `pages/` entries.
- Mark client-interactive components with `'use client'` at the top of the file. Server components are the default.
- Keep page files (`app/**/page.tsx`) thin — delegate all logic and UI to `components/`.
- Component files live in `components/<domain>/ComponentName.tsx`.

### Tailwind CSS
- Use Tailwind utility classes directly on JSX elements. Do not write custom CSS unless absolutely necessary.
- Follow a **mobile-first** approach (`sm:`, `md:`, `lg:` prefixes for larger breakpoints).
- Do not add a CSS-in-JS library.

### Accessibility
- All interactive elements must be keyboard-accessible.
- Use `role="alert"` for inline validation error messages.
- Include `aria-label` or `aria-describedby` on inputs that lack a visible `<label>`.
- Provide `sr-only` text for screen-reader-only context (e.g., progress indicator).

### Testing
- Test files live in `__tests__/<mirror-of-src-path>/`.
- Write **unit tests** for all `lib/` functions.
- Write **component tests** for every new component in `components/`.
- Write **integration tests** in `__tests__/components/OnboardingWizard.test.tsx` (or a new integration file) for user-facing flows.
- Use `@testing-library/user-event` for simulating user interactions, not `fireEvent`.
- Do **not** delete or modify existing tests unless you are directly changing the tested behaviour.

---

## Sprint Backlog Reference

The full task list is in [`docs/codex-backlog.md`](docs/codex-backlog.md). Before starting a task:

1. Read the task's **Description** and **Acceptance Criteria** (if any).
2. Mark the task **In Progress** (🔄) in `docs/codex-backlog.md` when you begin.
3. Implement the feature, including unit/component/integration tests.
4. Mark the task **Complete** (✅) and fill in the **Files Changed** table.
5. Note any **Follow-up Risks** you observe.

### Current Sprint 1 Status (as of last update)

| # | Task | Status |
|---|---|---|
| 1 | Project Scaffold | ✅ Complete |
| 2 | Design Tokens & Theme | 🔲 Pending |
| 3 | Component Library Baseline | 🔲 Pending |
| 4 | Landing Page | 🔲 Pending |
| 5 | Authentication | 🔲 Pending |
| 6 | Mobile-First Onboarding Wizard | ✅ Complete |
| 7 | Programme Listing Page | 🔲 Pending |
| 8 | Programme Detail Page | 🔲 Pending |
| 9 | Favourites / Shortlist | 🔲 Pending |
| 10 | Admin CMS | 🔲 Pending |

---

## Adding New Features

1. **Types first** – Define new TypeScript types/constants in `lib/`.
2. **Validation** – Add validation helpers in `lib/` and unit-test them.
3. **Components** – Build UI in `components/<domain>/`. Client components need `'use client'`.
4. **Pages** – Wire components into an App Router page under `app/`.
5. **Tests** – Unit → component → integration, in that order.
6. **Docs** – Update `docs/codex-backlog.md` with status, files changed, and risks.

---

## What NOT to Do

- Do **not** install new dependencies without checking whether an existing library already covers the need.
- Do **not** add a `pages/` directory — App Router only.
- Do **not** commit secrets, API keys, or credentials.
- Do **not** bypass TypeScript with `// @ts-ignore` or `as any`.
- Do **not** remove or skip existing tests.
- Do **not** push directly to `main`; all changes go through a pull request.
