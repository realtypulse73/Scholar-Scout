import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StepLocation from '@/components/onboarding/StepLocation';

describe('StepLocation', () => {
  it('keeps location choices selected with explicit radio state and a red action surface', () => {
    const onChange = jest.fn();
    render(<StepLocation value="in-state" onChange={onChange} error="Choose a location." />);

    const selected = screen.getByText('In-State').closest('label');
    expect(selected).toHaveClass('bg-brand-50');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a location.');
    fireEvent.click(screen.getByText('Online Only'));
    expect(onChange).toHaveBeenCalledWith('online-only');
  });
});
