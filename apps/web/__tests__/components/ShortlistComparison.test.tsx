import React from 'react';
import { render, screen } from '@testing-library/react';
import ShortlistComparison from '@/components/shortlist/ShortlistComparison';
import { programmes } from '@/lib/programmes';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

describe('ShortlistComparison', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the empty state readable with a full-size browse action', () => {
    render(<ShortlistComparison programmes={programmes} />);

    expect(screen.getByRole('heading', { name: /no saved programmes yet/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse programmes/i })).toHaveClass('rounded-control');
  });
});
