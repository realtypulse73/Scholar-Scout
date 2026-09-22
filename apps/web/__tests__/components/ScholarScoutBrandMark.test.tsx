import React from 'react';
import { render, screen } from '@testing-library/react';
import ScholarScoutBrandMark from '@/components/branding/ScholarScoutBrandMark';

describe('ScholarScoutBrandMark', () => {
  it('renders a decorative scalable mark and visible Scholar Scout wordmark', () => {
    render(<a href="/"><ScholarScoutBrandMark size="compact" /></a>);
    expect(screen.getByText('Scholar Scout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scholar Scout' })).toBeInTheDocument();
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });
});
