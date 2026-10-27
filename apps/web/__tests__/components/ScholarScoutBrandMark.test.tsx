import React from 'react';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';
import ScholarScoutWordmark from '@/components/branding/ScholarScoutWordmark';

describe('ScholarScoutBrandMark', () => {
  it('renders a decorative scalable mark and visible all-caps Scholar Scout wordmark', () => {
    render(<Link href="/"><ScholarScoutBrandMark size="compact" /></Link>);
    expect(screen.getByText('SCHOLAR SCOUT')).toBeInTheDocument();
    expect(screen.getByText('SCHOLAR SCOUT')).toHaveAttribute('aria-label', 'Scholar Scout');
    expect(screen.getByRole('link', { name: 'Scholar Scout' })).toBeInTheDocument();
    expect(screen.getByText('SCHOLAR SCOUT')).toHaveClass('brand-wordmark');
    expect(screen.getByText('SCHOLAR SCOUT')).toHaveClass(
      'brand-wordmark--compact',
      'brand-wordmark--metallic',
    );
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });

  it('uses an original dense wide wordmark treatment rather than an image logo', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

    expect(css).toMatch(/\.brand-wordmark\s*\{[\s\S]*font-weight:\s*900;/);
    expect(css).toContain('.brand-wordmark::after');
    expect(css).toContain('scaleX(1.16)');
    expect(css).toContain('.brand-wordmark--metallic');
    expect(css).toContain('color: #2f4357');
    expect(css).toContain('.brand-wordmark--metallic-inverse');
    expect(css).toContain('-webkit-text-stroke: 0.032em #3d79b8');
    expect(css).toContain('text-shadow: 0.05em 0 #c6596c');
    expect(css).toContain('background-clip: text');
    expect(css).toContain('.brand-wordmark--inline.brand-wordmark--metallic');
    expect(css).toContain('transform: none;');
    expect(css).toContain('.brand-wordmark--inline::after');
    expect(css).toContain('.journey-primary-nav-link:focus-visible');
    expect(css).toContain('background: rgba(255, 255, 255, 0.9)');
  });

  it('uses the shared semantic wordmark for inline product-name references', () => {
    render(<ScholarScoutWordmark />);

    expect(screen.getByText('SCHOLAR SCOUT')).toHaveClass(
      'brand-wordmark',
      'brand-wordmark--inline',
      'brand-wordmark--metallic',
    );
  });

  it('keeps inline references and the visual navigation inside stable layout and contrast boundaries', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');
    const home = readFileSync(join(process.cwd(), 'app', 'page.tsx'), 'utf8');

    expect(css).toContain('.brand-wordmark--inline {');
    expect(css).toContain('display: inline;');
    expect(css).toContain('vertical-align: baseline;');
    expect(css).toContain('white-space: nowrap;');
    expect(home).toContain('journey-primary-nav');
    expect(home).toContain('journey-primary-nav-link');
  });
});
