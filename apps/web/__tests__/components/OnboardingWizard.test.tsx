import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

// Helper to click the Next button
const clickNext = () => fireEvent.click(screen.getByRole('button', { name: /next/i }));
const clickBack = () => fireEvent.click(screen.getByRole('button', { name: /back/i }));
const clickSubmit = () => fireEvent.click(screen.getByRole('button', { name: /submit/i }));

describe('OnboardingWizard – full flow', () => {
  it('starts on step 1 (GPA) and shows no Back button', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText("What's your current GPA?")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('shows validation error on step 1 if Next is clicked without selecting GPA', () => {
    render(<OnboardingWizard />);
    clickNext();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Still on step 1
    expect(screen.getByText("What's your current GPA?")).toBeInTheDocument();
  });

  it('advances to step 2 after selecting a GPA band', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();
    expect(screen.getByText('What are your interests?')).toBeInTheDocument();
  });

  it('shows Back button on step 2', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('can go back from step 2 to step 1', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();
    clickBack();
    expect(screen.getByText("What's your current GPA?")).toBeInTheDocument();
  });

  it('shows validation error on step 2 if no interests selected', () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();
    clickNext();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('clears the error when a valid selection is made then Next is clicked', () => {
    render(<OnboardingWizard />);
    // Trigger error on step 1
    clickNext();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Make a selection – error should clear immediately
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('completes all 6 steps and shows the summary screen', () => {
    render(<OnboardingWizard />);

    // Step 1 – GPA
    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();

    // Step 2 – Interests
    fireEvent.click(screen.getByText('STEM'));
    clickNext();

    // Step 3 – Location
    fireEvent.click(screen.getByText('In-State'));
    clickNext();

    // Step 4 – Pathway
    fireEvent.click(screen.getByText('4-Year University'));
    clickNext();

    // Step 5 – Affordability (default is 3, no selection needed)
    clickNext();

    // Step 6 – Support needs (optional)
    clickSubmit();

    // Should now show the summary / success screen
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
  });

  it('shows "Start Over" on summary and resets to step 1 when clicked', () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByText('3.0 – 3.4'));
    clickNext();
    fireEvent.click(screen.getByText('STEM'));
    clickNext();
    fireEvent.click(screen.getByText('In-State'));
    clickNext();
    fireEvent.click(screen.getByText('4-Year University'));
    clickNext();
    clickNext();
    clickSubmit();

    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByText("What's your current GPA?")).toBeInTheDocument();
  });
});

describe('OnboardingWizard – ProgressIndicator', () => {
  it('shows step 1 of 6 progress text for screen readers', () => {
    render(<OnboardingWizard />);
    // The sr-only paragraph is in the DOM
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
  });
});
