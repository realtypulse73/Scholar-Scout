import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepInterests from '@/components/onboarding/StepInterests';
import { INTEREST_LABELS, type Interest } from '@/lib/onboarding-types';

describe('StepInterests', () => {
  it('renders all interest options', () => {
    render(<StepInterests value={[]} onChange={jest.fn()} />);
    Object.values(INTEREST_LABELS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('calls onChange with added interest when unselected chip is clicked', () => {
    const onChange = jest.fn();
    render(<StepInterests value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(INTEREST_LABELS['stem']));
    expect(onChange).toHaveBeenCalledWith(['stem']);
  });

  it('calls onChange removing interest when already-selected chip is clicked', () => {
    const onChange = jest.fn();
    render(<StepInterests value={['stem', 'arts']} onChange={onChange} />);
    fireEvent.click(screen.getByText(INTEREST_LABELS['stem']));
    expect(onChange).toHaveBeenCalledWith(['arts']);
  });

  it('marks selected interests as aria-pressed=true', () => {
    render(<StepInterests value={['stem']} onChange={jest.fn()} />);
    const btn = screen.getByText(INTEREST_LABELS['stem']).closest('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks unselected interests as aria-pressed=false', () => {
    render(<StepInterests value={[]} onChange={jest.fn()} />);
    const btn = screen.getByText(INTEREST_LABELS['stem']).closest('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('displays an error message when error prop is provided', () => {
    render(
      <StepInterests
        value={[]}
        onChange={jest.fn()}
        error="Select at least one interest."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select at least one interest.',
    );
  });
});
