# Scholar-Scout

ScholarScout is a **rejection-free post-secondary discovery platform** that matches students with programmes that fit their goals, budget, and life circumstances.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Click **Get Started** to launch the onboarding wizard at [http://localhost:3000/onboarding](http://localhost:3000/onboarding).

### Build for production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

### Run tests

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

---

## Project Structure

```
app/
  page.tsx                         # Landing / home page
  onboarding/
    page.tsx                       # Onboarding wizard page (/onboarding)
components/
  onboarding/
    OnboardingWizard.tsx           # Wizard root – state, validation, navigation
    ProgressIndicator.tsx          # Step progress indicator
    StepGpa.tsx                    # Step 1: GPA band selection
    StepInterests.tsx              # Step 2: Interests multi-select
    StepLocation.tsx               # Step 3: Location preference
    StepPathway.tsx                # Step 4: Pathway preference
    StepAffordability.tsx          # Step 5: Affordability slider
    StepSupportNeeds.tsx           # Step 6: Support needs
    OnboardingSummary.tsx          # Post-submit summary screen
lib/
  onboarding-types.ts              # TypeScript types, enums, and label maps
  onboarding-validation.ts         # Per-step and full-form validation
__tests__/
  lib/
    onboarding-validation.test.ts  # Validation logic tests
  components/
    StepGpa.test.tsx
    StepInterests.test.tsx
    StepAffordability.test.tsx
    StepSupportNeeds.test.tsx
    OnboardingWizard.test.tsx      # Full wizard integration tests
docs/
  codex-backlog.md                 # Sprint backlog and task definitions
```

---

## Onboarding Wizard

The wizard collects six student-preference signals across six steps:

| Step | Field | Type |
|---|---|---|
| 1 | GPA Band | Single-select chip |
| 2 | Interests | Multi-select chips |
| 3 | Location Preference | Radio group |
| 4 | Pathway Preference | Radio group |
| 5 | Affordability Sensitivity | Labelled 1–5 slider |
| 6 | Support Needs | Multi-select checklist |

All required steps (1–4) include inline validation with accessible `role="alert"` error messages. Steps 5 and 6 are always valid (slider has a default; support needs are optional).

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Jest** + **React Testing Library**
