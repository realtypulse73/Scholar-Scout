'use client';

import { useState } from 'react';
import {
  INITIAL_ONBOARDING_DATA,
  TOTAL_STEPS,
  type OnboardingData,
  type AffordabilitySensitivity,
  type GpaBand,
  type Interest,
  type LocationPreference,
  type PathwayPreference,
  type SupportNeed,
} from '@/lib/onboarding-types';
import { validateStep } from '@/lib/onboarding-validation';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  serializeOnboardingProfile,
} from '@/lib/preference-matching';
import ProgressIndicator from './ProgressIndicator';
import StepGpa from './StepGpa';
import StepInterests from './StepInterests';
import StepLocation from './StepLocation';
import StepPathway from './StepPathway';
import StepAffordability from './StepAffordability';
import StepSupportNeeds from './StepSupportNeeds';
import OnboardingSummary from './OnboardingSummary';

export default function OnboardingWizard() {
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const updateData = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleNext = () => {
    const validationError = validateStep(step, data);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step === TOTAL_STEPS) {
      window.localStorage.setItem(
        ONBOARDING_PROFILE_STORAGE_KEY,
        serializeOnboardingProfile(data),
      );
      if (typeof fetch === 'function') {
        void fetch('/api/account/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setCompleted(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleStartOver = () => {
    setData(INITIAL_ONBOARDING_DATA);
    setStep(1);
    setError(null);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <OnboardingSummary data={data} onStartOver={handleStartOver} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-blue-600 mb-1">
            ScholarScout
          </h1>
          <p className="text-sm text-gray-500">
            Let&apos;s find the right post-secondary path for you.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressIndicator currentStep={step} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {step === 1 && (
            <StepGpa
              value={data.gpaBand}
              onChange={(v: GpaBand) => updateData('gpaBand', v)}
              error={error}
            />
          )}
          {step === 2 && (
            <StepInterests
              value={data.interests}
              onChange={(v: Interest[]) => updateData('interests', v)}
              error={error}
            />
          )}
          {step === 3 && (
            <StepLocation
              value={data.locationPreference}
              onChange={(v: LocationPreference) =>
                updateData('locationPreference', v)
              }
              error={error}
            />
          )}
          {step === 4 && (
            <StepPathway
              value={data.pathwayPreference}
              onChange={(v: PathwayPreference) =>
                updateData('pathwayPreference', v)
              }
              error={error}
            />
          )}
          {step === 5 && (
            <StepAffordability
              value={data.affordabilitySensitivity}
              onChange={(v: AffordabilitySensitivity) =>
                updateData('affordabilitySensitivity', v)
              }
            />
          )}
          {step === 6 && (
            <StepSupportNeeds
              value={data.supportNeeds}
              onChange={(v: SupportNeed[]) => updateData('supportNeeds', v)}
            />
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
            >
              {step === TOTAL_STEPS ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
