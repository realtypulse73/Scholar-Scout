import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = process.env.PRODUCT_OPS_OUTPUT_DIR ?? 'reports/product-ops';
const dateSlug = new Date().toISOString().slice(0, 10);

const roadmap = [
  {
    title: 'Integrate adaptive recommendations into dashboard',
    priority: 'P1',
    labels: ['codex', 'automation', 'dashboard', 'P1'],
    goal: 'Use shortlist activity, plan status, and notes to adjust recommendation ranking.',
    files: [
      'apps/web/components/recommendations/RecommendationDashboard.tsx',
      'apps/web/lib/adaptive-recommendations.ts',
      'apps/web/lib/shortlist.ts',
    ],
    tasks: [
      'Load shortlist ids and plan statuses in the recommendation dashboard.',
      'Replace static top-match ranking with adaptive ranking.',
      'Display adaptive score and rank reason.',
    ],
  },
  {
    title: 'Integrate predictive decision UI',
    priority: 'P1',
    labels: ['codex', 'automation', 'predictive', 'dashboard', 'P1'],
    goal: 'Show most likely choice, decision stage, risk, confidence, and likely next action.',
    files: [
      'apps/web/components/recommendations/RecommendationDashboard.tsx',
      'apps/web/lib/predictive-decisions.ts',
    ],
    tasks: [
      'Compute predictions from current profile, shortlist, and plans.',
      'Display choice probability and decision stage.',
      'Show whyLikely and risks in the dashboard.',
    ],
  },
  {
    title: 'Build institutional intelligence dashboard UI',
    priority: 'P2',
    labels: ['codex', 'automation', 'institutional', 'dashboard', 'P2'],
    goal: 'Create staff-only institutional intelligence dashboard for demand, support gaps, and opportunities.',
    files: [
      'apps/web/lib/institutional-intelligence.ts',
      'apps/web/app/admin/intelligence/page.tsx',
      'apps/web/components/auth/StaffGate.tsx',
    ],
    tasks: [
      'Create staff-gated admin intelligence route.',
      'Render demand signals, support needs, programme insights, and opportunities.',
      'Use current programme data and stored onboarding data where available.',
    ],
  },
  {
    title: 'Build marketplace sponsored pathway scaffolding',
    priority: 'P2',
    labels: ['codex', 'automation', 'marketplace', 'P2'],
    goal: 'Add transparent sponsored pathway logic that only appears when fit and predicted intent thresholds are met.',
    files: [
      'apps/web/lib/marketplace.ts',
      'apps/web/components/recommendations/RecommendationDashboard.tsx',
      'docs/marketplace-monetization-model.md',
    ],
    tasks: [
      'Create marketplace eligibility engine.',
      'Add sponsored pathway badge and explanation.',
      'Document trust and monetization safeguards.',
    ],
  },
  {
    title: 'Generate investor pitch and institutional dashboard docs',
    priority: 'P3',
    labels: ['codex', 'automation', 'docs', 'P3'],
    goal: 'Create investor-ready deck narrative and institutional dashboard UI specification.',
    files: [
      'docs/investor-pitch-revenue-model.md',
      'docs/institutional-dashboard-ui-spec.md',
    ],
    tasks: [
      'Create pitch deck slide narrative.',
      'Document revenue model and marketplace mechanics.',
      'Create dashboard UI spec with data cards and opportunity alerts.',
    ],
  },
];

const issuePackets = roadmap.map((item) => ({
  ...item,
  body: buildIssueBody(item),
}));

await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, 'autonomous-issues.json'),
  JSON.stringify(issuePackets, null, 2),
);
await writeFile(
  path.join(outputDir, 'dynamic-roadmap.md'),
  buildRoadmapMarkdown(issuePackets),
);
await writeFile(
  path.join(outputDir, `${dateSlug}-dynamic-roadmap.md`),
  buildRoadmapMarkdown(issuePackets),
);

console.log(`Generated ${issuePackets.length} autonomous product manager issue packets.`);

function buildIssueBody(item) {
  return `## Goal\n${item.goal}\n\n## Priority\n${item.priority}\n\n## Files to Review\n${item.files.map((file) => `- ${file}`).join('\n')}\n\n## Tasks\n${item.tasks.map((task) => `- [ ] ${task}`).join('\n')}\n\n## Acceptance Criteria\n- [ ] Typecheck passes\n- [ ] Lint passes\n- [ ] Tests pass where applicable\n- [ ] Feature works in the relevant route\n- [ ] No secrets committed\n\n## Codex Instructions\nRepository: realtypulse73/Scholar-Scout\nBranch: feature/${slugify(item.title)}\nFollow docs/chatgpt-codex-github-sync.md and open a PR into main.\n`;
}

function buildRoadmapMarkdown(items) {
  return `# ScholarScout Dynamic Roadmap — ${dateSlug}\n\n${items
    .map(
      (item, index) =>
        `## ${index + 1}. ${item.title}\n\nPriority: **${item.priority}**\n\nLabels: ${item.labels.map((label) => `\`${label}\``).join(', ')}\n\n${item.goal}\n`,
    )
    .join('\n')}\n`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 56);
}
