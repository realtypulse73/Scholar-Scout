import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.PRODUCT_OPS_OUTPUT_DIR ?? 'reports/product-ops';
const now = new Date();
const dateSlug = now.toISOString().slice(0, 10);

const issuePrioritizationRules = [
  ['P0', 'Production outage, auth failure, data loss, secret exposure, or broken deploy'],
  ['P1', 'Core student journey blocked: onboarding, recommendations, shortlist, sign-in, or programme browsing'],
  ['P2', 'Important platform feature: predictive, adaptive, institutional, marketplace, dashboard, analytics'],
  ['P3', 'Polish, copy, nonblocking UI, documentation, refactor, backlog grooming'],
];

const bugTriageRules = [
  'Reproduce the bug and capture route, browser, user role, and environment.',
  'Classify severity using P0/P1/P2/P3.',
  'Identify likely layer: auth, onboarding, matching, dashboard, data-store, deployment, or UI.',
  'Add acceptance criteria for the fix and regression test expectation.',
];

const roadmapThemes = [
  'Student decision dashboard',
  'Adaptive and predictive recommendations',
  'Institutional intelligence dashboard',
  'Marketplace and monetization safeguards',
  'Codex/GitHub automated build pipeline',
];

const report = `# ScholarScout Product Ops Report — ${dateSlug}

## Issue Prioritization Rules

${issuePrioritizationRules.map(([priority, description]) => `- **${priority}** — ${description}`).join('\n')}

## Bug Triage Checklist

${bugTriageRules.map((rule) => `- ${rule}`).join('\n')}

## Roadmap Themes

${roadmapThemes.map((theme, index) => `${index + 1}. ${theme}`).join('\n')}

## Nightly Intelligence Notes

- Review new issues labeled \`codex\`, \`automation\`, \`bug\`, and \`marketplace\`.
- Confirm CI status on open PRs before merge.
- Verify no secrets were committed.
- Track whether recommendations remain explainable and user-aligned.

## Institutional Analytics Export Checklist

- Demand signals
- Support needs
- Programme demand score
- Predicted choice share
- Support fit score
- Affordability and access flags
- Opportunity alerts

`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, `${dateSlug}.md`), report);
await writeFile(path.join(outputDir, 'latest.md'), report);

console.log(`Wrote product ops report to ${outputDir}`);
