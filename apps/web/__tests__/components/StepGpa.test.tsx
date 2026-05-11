import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepGpa from '@/components/onboarding/StepGpa';
import { GPA_BAND_LABELS, type GpaBand } from '@/lib/onboarding-types';

const GPA_BANDS = Object.keys(GPA_BAND_LABELS) as GpaBand[];

describe('StepGpa', () => {
  it('renders all GPA band options', () => {
    render(<StepGpa value={null} onChange={jest.fn()} />);
    GPA_BANDS.forEach((band) => {
      expect(screen.getByText(GPA_BAND_LABELS[band])).toBeInTheDocument();
    });
  });

  it('calls onChange when a band is clicked', () => {
    const onChange = jest.fn();
    render(<StepGpa value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText(GPA_BAND_LABELS['3.0-3.4']));
    expect(onChange).toHaveBeenCalledWith('3.0-3.4');
  });

  it('marks the selected band as aria-checked', () => {
    render(<StepGpa value="3.0-3.4" onChange={jest.fn()} />);
    const selectedBtn = screen.getByText(GPA_BAND_LABELS['3.0-3.4']).closest('button');
    expect(selectedBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('marks unselected bands as aria-checked=false', () => {
    render(<StepGpa value="3.0-3.4" onChange={jest.fn()} />);
    const btn = screen.getByText(GPA_BAND_LABELS['2.0-2.4']).closest('button');
    expect(btn).toHaveAttribute('aria-checked', 'false');
  });

  it('displays an error message when error prop is provided', () => {
    render(<StepGpa value={null} onChange={jest.fn()} error="Please select a GPA." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Please select a GPA.');
  });

  it('does not render error when error prop is null', () => {
    render(<StepGpa value={null} onChange={jest.fn()} error={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
