import React from 'react';
import { render, screen } from '@testing-library/react';
import UploaderContactPanel from '@/components/campus-community/UploaderContactPanel';

describe('UploaderContactPanel', () => {
  it('keeps privacy and eligibility wording beside an accessible inbox request', () => {
    render(
      <UploaderContactPanel
        username="student-uploader"
        programId="program-1"
        inboxEnabled
      />,
    );

    expect(screen.getByText(/accepts private inbox requests/i)).toBeInTheDocument();
    expect(screen.getByText(/do not include phone numbers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your inbox request/i)).toHaveClass('rounded-control');
    expect(screen.getByLabelText(/your inbox request/i)).toHaveClass('border-border');
    expect(screen.getByRole('button', { name: /send inbox request/i })).toHaveClass('min-h-touch');
  });
});
