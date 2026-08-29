# Role-language surface inventory

Audit date: 2026-08-29. Statuses are deliberately bounded: `revised-in-this-batch`, `confirmed-compliant`, and `follow-on-required`.

| Route | Rendered component(s) | Role/task language evidence | Status | Proof / rationale |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx`, landing sections | Student discovery navigation | confirmed-compliant | Manual page/source review; no role claim beyond exploration. |
| `/advisor` | `AdvisorChat` | `AdvisorChat.tsx` bounded guidance and recovery | revised-in-this-batch | `AdvisorChat.test.tsx`; task 2 accessibility assertion. |
| `/auth/sign-in` | `AuthForm` | `AuthForm.tsx` account action and alert recovery | revised-in-this-batch | `AuthForm.test.tsx`; task 2 assertion. |
| `/auth/sign-up` | `AuthForm` | `AuthForm.tsx` student account action | revised-in-this-batch | `AuthForm.test.tsx`; no browser role selection. |
| `/explore` | explore page | Student catalogue language | confirmed-compliant | Manual source review. |
| `/feed` | feed components | Public/student sharing language | follow-on-required | `app/feed/page.tsx`; audit exact visible labels and add focused rendered test. |
| `/onboarding` | `OnboardingWizard` | pathway-profile copy and no screening notice | revised-in-this-batch | `OnboardingWizard.test.tsx`; task 2 assertion. |
| `/peer-community` | `PeerCommunity` | contact-safe peer request copy | follow-on-required | `components/peer-community/PeerCommunity.tsx`; add role-label test without changing privacy helper. |
| `/profile` | `ProfileDashboard` | Account-owned profile language | confirmed-compliant | Manual source review; current session data only. |
| `/programmes` | programme catalogue | Student comparison language | confirmed-compliant | Manual source review. |
| `/programmes/[id]` | programme detail | Programme source/detail language | confirmed-compliant | Manual source review. |
| `/recommendations` | recommendations components | Student decision-support language | follow-on-required | `app/recommendations/page.tsx`; audit any outcome-like phrasing with focused test. |
| `/shortlist` | shortlist components | Student-owned saved options | confirmed-compliant | Manual source review. |
| `/simulate` | simulation components | Exploratory simulation language | follow-on-required | `app/simulate/page.tsx`; test that scores do not imply admissions outcomes. |
| `/u/[username]` | public profile | Public profile language | follow-on-required | `app/u/[username]/page.tsx`; test identity/data boundary and role labels. |
| `/schools/[slug]` | `CampusNoteBoard`, school locker | `app/schools/[slug]/page.tsx:23-30` official-source verification and empty recovery | confirmed-compliant | Manual rendered sampling required; focused static source/recovery contract retained. |
| `/western-new-york` | `WesternNewYorkDirectory` | `WesternNewYorkDirectory.tsx:41-55` official-source notice and empty recovery | confirmed-compliant | `role-language-surface.test.tsx` rendered assertion. |
| `/admin/programmes` | `StaffGate`, `ProgrammeAdminManager` | governed catalogue/staff operations | revised-in-this-batch | `ProgrammeAdminManager.test.tsx`; task 3 assertion. |
| `/admin/community-moderation` | `StaffGate`, `CommunityModerationQueue` | staff review; reporter/author non-disclosure | revised-in-this-batch | `community-release.test.tsx`; task 3 assertion. |
| `/admin/command-center` | `StaffGate`, command center | authorized staff operational work | confirmed-compliant | Manual source review; server page remains authoritative. |
| `/admin/feed` | `StaffGate`, feed admin | authorized staff feed stewardship | follow-on-required | `app/admin/feed/page.tsx`; add staff wording test. |
| `/admin/ops` | `StaffGate`, operations view | authorized operations access | follow-on-required | `app/admin/ops/page.tsx`; add non-disclosing client/server boundary test. |

## Delivery-template search evidence

Date: 2026-08-29. Command: `rg -n -i 'email|mail|notification|template|sendgrid|resend|postmark|nodemailer' apps/web docs .github package.json pnpm-workspace.yaml`.

Outcome: matches are account identifiers, contact-safety copy, analytics event names, and GitHub issue-template prose. No application-owned outbound email/notification delivery template or SendGrid, Resend, Postmark, or Nodemailer integration was found. This finding concerns delivery templates only; account email handling remains governed by the existing authentication code.

## Phase 5 protected-clause inventory

- **Discovery copywriting:** source links verify current institution facts; no admissions prediction.
- **Community copywriting:** quota/contact safety is visible before submission; reporting is non-destructive until confirmation.
- **Accessibility:** named controls, keyboard focus, status feedback, and accessible empty/error states remain required.
- **Staff moderation privacy/source:** server gate remains authoritative; queue never reveals reporter, author, contact, or student-private data.

Task 3 performs a terminology-only diff review against these clauses. Follow-on rows above remain unimplemented work, not completion claims.
