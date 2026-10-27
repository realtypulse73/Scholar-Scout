import React from 'react';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';

describe('ScholarScoutBrandMark', () => {
  it('renders a decorative scalable mark and visible Scholar Scout wordmark', () => {
    render(<Link href="/"><ScholarScoutBrandMark size="compact" /></Link>);
    expect(screen.getByText('Scholar Scout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scholar Scout' })).toBeInTheDocument();
    expect(screen.getByText('Scholar Scout')).toHaveClass('brand-wordmark');
    expect(screen.getByText('Scholar Scout')).toHaveClass('font-bold', 'uppercase');
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });

  it('uses an original dense wide wordmark treatment rather than an image logo', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

    expect(css).toMatch(/\.brand-wordmark\s*\{[\s\S]*font-weight:\s*900;/);
    expect(css).toContain('.brand-wordmark::after');
    expect(css).toContain('scaleX(1.16)');
  });
});
