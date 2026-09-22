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

  it('keeps primary, secondary, and destructive controls visually distinct with a strong focus ring', () => {
    render(
      <>
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Button variant="danger">Delete</Button>
        <Card data-testid="surface">Surface</Card>
        <Input aria-label="Student email" />
        <Badge tone="success">Ready</Badge>
        <Badge tone="warning">Review</Badge>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Primary action' })).toHaveClass(
      'bg-brand-600',
      'text-white',
      'focus-visible:ring-focus',
    );
    expect(screen.getByRole('button', { name: 'Secondary action' })).toHaveClass(
      'bg-white',
      'border-border',
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-danger-600',
      'border-danger-600',
    );
    expect(screen.getByTestId('surface')).toHaveClass('bg-white', 'border-border');
    expect(screen.getByLabelText('Student email')).toHaveClass(
      'focus-visible:ring-focus',
      'focus-visible:ring-offset-2',
    );
    expect(screen.getByText('Ready')).toHaveClass('bg-success-50', 'text-success-700');
    expect(screen.getByText('Review')).toHaveClass('bg-warning-50', 'text-warning-700');
  });
});
