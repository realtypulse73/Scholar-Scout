import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ShortlistButton from '@/components/shortlist/ShortlistButton';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

describe('ShortlistButton', () => {
  it('uses an explicit selected action state without changing its accessible name', () => {
    render(<ShortlistButton programmeId="programme-1" />);

    const button = screen.getByRole('button', { name: /save to shortlist/i });
    expect(button).toHaveClass('rounded-control');
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: /saved to shortlist/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /saved to shortlist/i })).toHaveClass('bg-brand-600');
  });
});
