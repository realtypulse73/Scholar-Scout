import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StepPathway from '@/components/onboarding/StepPathway';

describe('StepPathway', () => {
  it('keeps pathway labels selectable with an explicit selected state', () => {
    const onChange = jest.fn();
    render(<StepPathway value="certificate-program" onChange={onChange} />);

    const selected = screen.getByText('Certificate Program').closest('label');
    expect(selected).toHaveClass('bg-brand-50');
    fireEvent.click(screen.getByText('4-Year University'));
    expect(onChange).toHaveBeenCalledWith('4-year-university');
  });
});
