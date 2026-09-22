import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import CampusNoteBoard from '@/components/campus-community/CampusNoteBoard';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockUseSession = useSession as jest.Mock;

describe('CampusNoteBoard', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: { user: { email: 'student@example.com' } } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notes: [] }),
    }) as typeof fetch;
  });

  it('keeps privacy guidance and a keyboard-reachable public note control visible', () => {
    render(<CampusNoteBoard schoolSlug="sample-school" />);

    expect(screen.getByText(/do not include phone numbers/i)).toBeInTheDocument();
    expect(screen.getByText(/notes and inbox requests share a limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your public note/i)).toHaveClass('rounded-control');
    expect(screen.getByLabelText(/your public note/i)).toHaveClass('border-border');
    expect(screen.getByRole('button', { name: /post note/i })).toHaveClass('min-h-touch');
  });
});
