/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const approvedTokens = [
  '#FFFFFF',
  '#F3F5F7',
  '#C8102E',
  '#A30E26',
  '#FFF1F3',
  '#D7DEE6',
  '#26364A',
  '#516173',
];

describe('visual-system Tailwind contract', () => {
  it('keeps runtime and typed Tailwind sources aligned on approved fonts and semantic tokens', () => {
    const runtimeConfig = readFileSync(
      join(process.cwd(), 'tailwind.config.js'),
      'utf8',
    );
    const typedConfig = readFileSync(
      join(process.cwd(), 'tailwind.config.ts'),
      'utf8',
    );

    for (const source of [runtimeConfig, typedConfig]) {
      expect(source).toContain('--font-space-grotesk');
      approvedTokens.forEach((token) => expect(source).toContain(token));
      expect(source).toContain('success:');
      expect(source).toContain('warning:');
      expect(source).toContain('danger:');
    }
  });
});
