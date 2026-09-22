import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepSupportNeeds from '@/components/onboarding/StepSupportNeeds';
import {
  ORDINARY_SUPPORT_CATEGORIES,
  SUPPORT_NEED_LABELS,
} from '@/lib/onboarding-types';

const ORDINARY_SUPPORT_OPTIONS = [
  ...ORDINARY_SUPPORT_CATEGORIES,
  'none',
] as const;

describe('StepSupportNeeds', () => {
  it('renders ordinary support preference options', () => {
    render(<StepSupportNeeds value={[]} onChange={jest.fn()} />);
    ORDINARY_SUPPORT_OPTIONS.forEach((support) => {
      expect(screen.getByText(SUPPORT_NEED_LABELS[support])).toBeInTheDocument();
    });
  });

  it('does not present referral-only choices as ordinary profile preferences', () => {
    render(<StepSupportNeeds value={[]} onChange={jest.fn()} />);

    expect(screen.queryByText(SUPPORT_NEED_LABELS.housing)).not.toBeInTheDocument();
    expect(screen.queryByText(SUPPORT_NEED_LABELS['mental-health'])).not.toBeInTheDocument();
  });

  it('adds a support need when unselected item is clicked', () => {
    const onChange = jest.fn();
    render(<StepSupportNeeds value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['financial-aid']));
    expect(onChange).toHaveBeenCalledWith(['financial-aid']);
  });

  it('keeps the safety disclosure and an explicit selected control visible', () => {
    render(<StepSupportNeeds value={['financial-aid']} onChange={jest.fn()} />);

    expect(screen.getByText(/optional and never used to exclude you/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SUPPORT_NEED_LABELS['financial-aid'] })).toHaveClass('border-brand-600');
    expect(screen.getByRole('button', { name: SUPPORT_NEED_LABELS['financial-aid'] })).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes a support need when already selected item is clicked', () => {
    const onChange = jest.fn();
    render(
      <StepSupportNeeds value={['financial-aid', 'tutoring']} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['financial-aid']));
    expect(onChange).toHaveBeenCalledWith(['tutoring']);
  });

  it('selecting "none" clears all other selections', () => {
    const onChange = jest.fn();
    render(
      <StepSupportNeeds value={['financial-aid', 'tutoring']} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['none']));
    expect(onChange).toHaveBeenCalledWith(['none']);
  });

  it('selecting any specific need after "none" removes "none"', () => {
    const onChange = jest.fn();
    render(<StepSupportNeeds value={['none']} onChange={onChange} />);
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['tutoring']));
    expect(onChange).toHaveBeenCalledWith(['tutoring']);
  });

  it('deselecting "none" when already selected results in empty array', () => {
    const onChange = jest.fn();
    render(<StepSupportNeeds value={['none']} onChange={onChange} />);
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['none']));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
