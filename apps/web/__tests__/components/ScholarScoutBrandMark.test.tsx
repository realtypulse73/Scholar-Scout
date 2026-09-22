import React from 'react';
import { render, screen } from '@testing-library/react';
import Link from 'next/link';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';

describe('ScholarScoutBrandMark', () => {
  it('renders a decorative scalable mark and visible Scholar Scout wordmark', () => {
    render(<Link href="/"><ScholarScoutBrandMark size="compact" /></Link>);
    expect(screen.getByText('Scholar Scout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scholar Scout' })).toBeInTheDocument();
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });
});
