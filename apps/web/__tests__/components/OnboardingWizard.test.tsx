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
  beforeEach(() => {
    window.localStorage.clear();
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
});
