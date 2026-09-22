import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

const clickNext = () =>
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
const clickBack = () =>
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
const clickSave = () =>
  fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

describe('OnboardingWizard 4-step flow', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    global.fetch = fetchMock as typeof fetch;
  });

  it('starts with interests and pathway choices', () => {
    render(<OnboardingWizard />);

    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByText(/What are you curious about/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('shows validation if step 1 is incomplete', () => {
    render(<OnboardingWizard />);

    clickNext();

    expect(screen.getByRole('alert')).toHaveTextContent(/select at least one interest/i);
  });

  it('advances through the 4-step flow and saves profile', async () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole('button', { name: 'STEM' }));
    fireEvent.click(screen.getByRole('button', { name: '4-Year University' }));
    clickNext();

    expect(screen.getByText('Fit basics')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /3.0/i }));
    fireEvent.click(screen.getByRole('button', { name: 'In-State' }));
    clickNext();

    expect(screen.getByText('Support')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Very cost-conscious/i }));
    fireEvent.click(screen.getByRole('button', { name: /Financial Aid/i }));
    clickNext();

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText(/Your profile is ready to save/i)).toBeInTheDocument();
    clickSave();

    await waitFor(() => {
      expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    });
    expect(window.localStorage.getItem('scholarscout.onboarding-profile')).toContain('stem');
    expect(window.localStorage.getItem('scholarscout.onboarding-draft')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/account/onboarding', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('can go back and persists draft data', () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole('button', { name: 'STEM' }));
    fireEvent.click(screen.getByRole('button', { name: '4-Year University' }));
    clickNext();
    clickBack();

    expect(screen.getByRole('button', { name: 'STEM' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(window.localStorage.getItem('scholarscout.onboarding-draft')).toContain('stem');
  });

  it('shows 4-step progress text for screen readers', () => {
    render(<OnboardingWizard />);

    expect(screen.getAllByText(/step 1 of 4/i)).toHaveLength(2);
  });

  it('uses the staged visual system for the active step and choice controls', () => {
    render(<OnboardingWizard />);

    expect(screen.getByRole('main')).toHaveClass('bg-canvas');
    expect(screen.getByRole('button', { name: 'STEM' })).toHaveClass('rounded-control');
    expect(screen.getByRole('button', { name: 'STEM' })).toHaveClass('min-h-touch');
  });

  it('keeps only ordinary support preferences in the editable support step', () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole('button', { name: 'STEM' }));
    fireEvent.click(screen.getByRole('button', { name: '4-Year University' }));
    clickNext();
    fireEvent.click(screen.getByRole('button', { name: /3.0/i }));
    fireEvent.click(screen.getByRole('button', { name: 'In-State' }));
    clickNext();

    expect(screen.getByRole('button', { name: /Financial Aid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Career Counseling/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Housing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Disability Services/i })).not.toBeInTheDocument();
  });
});
