import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, Button, Card, Input } from '@/components/ui';

describe('UI primitives', () => {
  it('renders a button with a default button type', () => {
    render(<Button>Continue</Button>);
    expect(screen.getByRole('button', { name: /continue/i })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('marks invalid inputs with aria-invalid', () => {
    render(<Input aria-label="Email" isInvalid />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('renders card and badge content', () => {
    render(
      <Card>
        <Badge tone="brand">Match</Badge>
      </Card>,
    );

    expect(screen.getByText('Match')).toBeInTheDocument();
  });
});
