import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepSupportNeeds from '@/components/onboarding/StepSupportNeeds';
import { SUPPORT_NEED_LABELS } from '@/lib/onboarding-types';

describe('StepSupportNeeds', () => {
  it('renders all support need options', () => {
    render(<StepSupportNeeds value={[]} onChange={jest.fn()} />);
    Object.values(SUPPORT_NEED_LABELS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('adds a support need when unselected item is clicked', () => {
    const onChange = jest.fn();
    render(<StepSupportNeeds value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText(SUPPORT_NEED_LABELS['financial-aid']));
    expect(onChange).toHaveBeenCalledWith(['financial-aid']);
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
