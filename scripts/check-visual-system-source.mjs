import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const required = [
  ['apps/web/app/layout.tsx', '--font-space-grotesk'],
  ['apps/web/app/globals.css', 'font-family: var(--font-space-grotesk)'],
  ['apps/web/components/branding/ScholarScoutBrandMark.tsx', 'Scholar Scout'],
];
const identityConsumers = [
  'apps/web/app/page.tsx',
  'apps/web/app/schools/[slug]/page.tsx',
  'apps/web/app/peer-community/page.tsx',
  'apps/web/app/western-new-york/page.tsx',
  'apps/web/app/auth/sign-in/page.tsx',
  'apps/web/components/onboarding/OnboardingWizard.tsx',
  'apps/web/app/simulate/page.tsx',
  'apps/web/app/shortlist/page.tsx',
  'apps/web/app/recommendations/page.tsx',
  'apps/web/app/programmes/[id]/page.tsx',
  'apps/web/app/programmes/page.tsx',
  'apps/web/app/advisor/page.tsx',
];

for (const [file, expected] of required) {
  const source = await readFile(resolve(root, file), 'utf8');
  if (!source.includes(expected)) throw new Error(`${file} is missing ${expected}`);
}

for (const file of identityConsumers) {
  const source = await readFile(resolve(root, file), 'utf8');
  if (!source.includes('ScholarScoutBrandMark')) throw new Error(`${file} does not use the shared brand mark`);
  if (/bg-(black|gray-9|slate-9|neutral-9)/.test(source)) throw new Error(`${file} contains a disallowed dark visual shell token`);
}

const responsiveGuards = [
  ['apps/web/app/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/shortlist/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/peer-community/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/programmes/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/recommendations/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/programmes/[id]/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/schools/[slug]/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/profile/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/western-new-york/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/app/admin/programmes/page.tsx', ['flex-col', 'sm:flex-row']],
  ['apps/web/components/advisor/AdvisorChat.tsx', ['flex flex-col', 'sm:flex-row']],
];

for (const [file, expectedTokens] of responsiveGuards) {
  const source = await readFile(resolve(root, file), 'utf8');
  if (!expectedTokens.every((token) => source.includes(token))) throw new Error(`${file} is missing its narrow-screen overflow guard`);
}

console.log(`Visual system source audit passed for ${identityConsumers.length} identity consumers.`);
