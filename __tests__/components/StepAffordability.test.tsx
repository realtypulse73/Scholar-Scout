import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepAffordability from '@/components/onboarding/StepAffordability';
import { AFFORDABILITY_LABELS, type AffordabilitySensitivity } from '@/lib/onboarding-types';

describe('StepAffordability', () => {
  it('renders the slider', () => {
    render(<StepAffordability value={3} onChange={jest.fn()} />);
    expect(screen.getByRole('slider', { name: /affordability sensitivity/i })).toBeInTheDocument();
  });

  it('displays the label for the current value', () => {
    render(<StepAffordability value={3} onChange={jest.fn()} />);
    expect(screen.getByText(AFFORDABILITY_LABELS[3])).toBeInTheDocument();
  });

  it('calls onChange when a numbered button is clicked', () => {
    const onChange = jest.fn();
    render(<StepAffordability value={3} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent === '1')!);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('highlights the currently selected value button', () => {
    render(<StepAffordability value={4} onChange={jest.fn()} />);
    const btn = screen.getAllByRole('button').find((b) => b.textContent === '4');
    expect(btn).toHaveClass('bg-blue-600');
  });

  it('renders all 5 numbered buttons', () => {
    render(<StepAffordability value={3} onChange={jest.fn()} />);
    const buttons = screen.getAllByRole('button');
    const numericBtns = buttons.filter((b) => /^[1-5]$/.test(b.textContent ?? ''));
    expect(numericBtns).toHaveLength(5);
  });
});
