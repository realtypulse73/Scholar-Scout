'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  AFFORDABILITY_LABELS,
  GPA_BAND_LABELS,
  INITIAL_ONBOARDING_DATA,
  INTEREST_LABELS,
  LOCATION_LABELS,
  PATHWAY_LABELS,
  SUPPORT_NEED_LABELS,
  TOTAL_STEPS,
  type AffordabilitySensitivity,
  type GpaBand,
  type Interest,
  type LocationPreference,
  type OnboardingData,
  type PathwayPreference,
  type SupportNeed,
} from '@/lib/onboarding-types';
import { validateStep } from '@/lib/onboarding-validation';
import {
  ONBOARDING_PROFILE_STORAGE_KEY,
  serializeOnboardingProfile,
} from '@/lib/preference-matching';
import OnboardingSummary from './OnboardingSummary';

const ONBOARDING_DRAFT_STORAGE_KEY = 'scholarscout.onboarding-draft';

const steps = [
  {
    title: 'Interests',
    helper: 'Start with what feels even a little interesting.',
  },
  {
    title: 'Fit basics',
    helper: 'GPA and location help us tune reality, not limit you.',
  },
  {
    title: 'Support',
    helper: 'Cost and support needs make the recommendations more useful.',
  },
  {
    title: 'Preview',
    helper: 'See the first read before we build your recommendations.',
  },
];

const interests = Object.keys(INTEREST_LABELS) as Interest[];
const pathways = Object.keys(PATHWAY_LABELS) as PathwayPreference[];
const gpaBands = Object.keys(GPA_BAND_LABELS) as GpaBand[];
const locations = Object.keys(LOCATION_LABELS) as LocationPreference[];
const supportNeeds = Object.keys(SUPPORT_NEED_LABELS) as SupportNeed[];
const affordabilityValues = [1, 2, 3, 4, 5] as AffordabilitySensitivity[];

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const insight = useMemo(() => getInsightPreview(data), [data]);

  useEffect(() => {
    const stored =
      window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY) ??
      window.localStorage.getItem(ONBOARDING_PROFILE_STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<OnboardingData>;
      setData({
        ...INITIAL_ONBOARDING_DATA,
        ...parsed,
        interests: Array.isArray(parsed.interests) ? parsed.interests : [],
        supportNeeds: Array.isArray(parsed.supportNeeds)
          ? parsed.supportNeeds
          : [],
        affordabilitySensitivity: isAffordabilitySensitivity(
          parsed.affordabilitySensitivity,
        )
          ? parsed.affordabilitySensitivity
          : INITIAL_ONBOARDING_DATA.affordabilitySensitivity,
      });
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      ONBOARDING_DRAFT_STORAGE_KEY,
      serializeOnboardingProfile(data),
    );
  }, [data]);

  const updateData = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) => {
    setData((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  function toggleInterest(interest: Interest) {
    updateData(
      'interests',
      data.interests.includes(interest)
        ? data.interests.filter((item) => item !== interest)
        : [...data.interests, interest],
    );
  }

  function toggleSupport(need: SupportNeed) {
    if (need === 'none') {
      updateData('supportNeeds', data.supportNeeds.includes('none') ? [] : ['none']);
      return;
    }

    const withoutNone = data.supportNeeds.filter((item) => item !== 'none');
    updateData(
      'supportNeeds',
      withoutNone.includes(need)
        ? withoutNone.filter((item) => item !== need)
        : [...withoutNone, need],
    );
  }

  function handleNext() {
    const validationError = validateStep(step, data);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    window.localStorage.setItem(
      ONBOARDING_PROFILE_STORAGE_KEY,
      serializeOnboardingProfile(data),
    );
    window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);

    if (typeof fetch === 'function') {
      void fetch('/api/account/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    setCompleted(true);
  }

  function handleBack() {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  function handleStartOver() {
    window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    window.localStorage.removeItem(ONBOARDING_PROFILE_STORAGE_KEY);
    setData(INITIAL_ONBOARDING_DATA);
    setStep(1);
    setError(null);
    setCompleted(false);
  }

  if (completed) {
    return (
      <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
        <div className="mx-auto w-full max-w-2xl">
          <OnboardingSummary data={data} onStartOver={handleStartOver} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-900">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
          <Link href="/" className="text-sm font-bold text-brand-700">
            ScholarScout
          </Link>
          <div className="mt-5">
            <p className="text-xs font-bold uppercase text-ink-500">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink-900">
              {steps[step - 1].title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              {steps[step - 1].helper}
            </p>
          </div>

          <ProgressBar step={step} />

          <div className="mt-6">
            {step === 1 ? (
              <StepOne
                data={data}
                onInterest={toggleInterest}
                onPathway={(value) => updateData('pathwayPreference', value)}
              />
            ) : null}
            {step === 2 ? (
              <StepTwo
                data={data}
                onGpa={(value) => updateData('gpaBand', value)}
                onLocation={(value) => updateData('locationPreference', value)}
              />
            ) : null}
            {step === 3 ? (
              <StepThree
                data={data}
                onAffordability={(value) =>
                  updateData('affordabilitySensitivity', value)
                }
                onSupport={toggleSupport}
              />
            ) : null}
            {step === 4 ? <StepFour data={data} insight={insight} /> : null}
          </div>

          {error ? (
            <p role="alert" className="mt-5 text-sm font-semibold text-danger-700">
              {error}
            </p>
          ) : null}

          <p className="mt-6 rounded-card border border-brand-100 bg-brand-50 p-3 text-sm leading-6 text-brand-800">
            You are not being screened out. These answers help ScholarScout rank
            practical next steps and show what to verify.
          </p>

          <div className="mt-6 flex gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="min-h-touch flex-1 rounded-card border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-brand-400 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleNext}
              className="min-h-touch flex-1 rounded-card border border-brand-600 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {step === TOTAL_STEPS ? 'Save profile' : 'Next'}
            </button>
          </div>
        </section>

        <aside className="rounded-card border border-ink-200 bg-white p-5 shadow-card lg:sticky lg:top-5 lg:self-start">
          <p className="text-xs font-bold uppercase text-ink-500">
            Early insight preview
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-ink-900">
            {insight.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-600">{insight.body}</p>
          <div className="mt-5 grid gap-3">
            {insight.signals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-card border border-ink-200 bg-ink-50 p-3"
              >
                <p className="text-xs font-bold uppercase text-ink-500">
                  {signal.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-800">
                  {signal.value}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ProgressBar({ step }: { step: number }) {
  const percent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="mt-6">
      <div className="flex justify-between text-xs font-bold uppercase text-ink-500">
        <span>Progress</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded bg-ink-200">
        <div
          className="h-full bg-brand-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="sr-only">
        Step {step} of {TOTAL_STEPS}
      </p>
    </div>
  );
}

function StepOne({
  data,
  onInterest,
  onPathway,
}: {
  data: OnboardingData;
  onInterest: (value: Interest) => void;
  onPathway: (value: PathwayPreference) => void;
}) {
  return (
    <div className="space-y-6">
      <ChoiceSection title="What are you curious about?">
        {interests.map((interest) => (
          <ChoiceButton
            key={interest}
            selected={data.interests.includes(interest)}
            onClick={() => onInterest(interest)}
          >
            {INTEREST_LABELS[interest]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
      <ChoiceSection title="What kind of path should we test first?">
        {pathways.map((pathway) => (
          <ChoiceButton
            key={pathway}
            selected={data.pathwayPreference === pathway}
            onClick={() => onPathway(pathway)}
          >
            {PATHWAY_LABELS[pathway]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
    </div>
  );
}

function StepTwo({
  data,
  onGpa,
  onLocation,
}: {
  data: OnboardingData;
  onGpa: (value: GpaBand) => void;
  onLocation: (value: LocationPreference) => void;
}) {
  return (
    <div className="space-y-6">
      <ChoiceSection title="Which GPA band is closest?">
        {gpaBands.map((band) => (
          <ChoiceButton
            key={band}
            selected={data.gpaBand === band}
            onClick={() => onGpa(band)}
          >
            {GPA_BAND_LABELS[band]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
      <ChoiceSection title="Where would you prefer to study?">
        {locations.map((location) => (
          <ChoiceButton
            key={location}
            selected={data.locationPreference === location}
            onClick={() => onLocation(location)}
          >
            {LOCATION_LABELS[location]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
    </div>
  );
}

function StepThree({
  data,
  onAffordability,
  onSupport,
}: {
  data: OnboardingData;
  onAffordability: (value: AffordabilitySensitivity) => void;
  onSupport: (value: SupportNeed) => void;
}) {
  return (
    <div className="space-y-6">
      <ChoiceSection title="How much should cost shape the match?">
        {affordabilityValues.map((value) => (
          <ChoiceButton
            key={value}
            selected={data.affordabilitySensitivity === value}
            onClick={() => onAffordability(value)}
          >
            {AFFORDABILITY_LABELS[value]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
      <ChoiceSection title="Which support would make a path easier?">
        {supportNeeds.map((need) => (
          <ChoiceButton
            key={need}
            selected={data.supportNeeds.includes(need)}
            onClick={() => onSupport(need)}
          >
            {SUPPORT_NEED_LABELS[need]}
          </ChoiceButton>
        ))}
      </ChoiceSection>
    </div>
  );
}

function StepFour({
  data,
  insight,
}: {
  data: OnboardingData;
  insight: ReturnType<typeof getInsightPreview>;
}) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-ink-900">
        Your profile is ready to save.
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">
        ScholarScout will use this profile to rank recommendations, explain why
        they fit, and show what you should verify next.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SummaryPill label="Interests" value={formatCount(data.interests.length)} />
        <SummaryPill
          label="Pathway"
          value={data.pathwayPreference ? PATHWAY_LABELS[data.pathwayPreference] : 'Not set'}
        />
        <SummaryPill
          label="Location"
          value={data.locationPreference ? LOCATION_LABELS[data.locationPreference] : 'Not set'}
        />
        <SummaryPill
          label="Support"
          value={data.supportNeeds.length ? formatCount(data.supportNeeds.length) : 'Optional'}
        />
      </div>
      <div className="mt-5 rounded-card border border-success-100 bg-success-50 p-4">
        <h3 className="text-sm font-bold text-success-700">{insight.title}</h3>
        <p className="mt-2 text-sm leading-6 text-success-700">{insight.body}</p>
      </div>
    </div>
  );
}

function ChoiceSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-extrabold text-ink-900">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-10 rounded-card border px-3 py-2 text-left text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-ink-200 bg-ink-50 p-3">
      <p className="text-xs font-bold uppercase text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function getInsightPreview(data: OnboardingData) {
  const primaryInterest = data.interests[0]
    ? INTEREST_LABELS[data.interests[0]]
    : 'your interests';
  const pathway = data.pathwayPreference
    ? PATHWAY_LABELS[data.pathwayPreference]
    : 'an open pathway';
  const cost =
    data.affordabilitySensitivity <= 2
      ? 'cost-sensitive options'
      : data.affordabilitySensitivity >= 4
        ? 'broader-fit options'
        : 'balanced value options';

  return {
    title: data.interests.length
      ? `${primaryInterest} plus ${pathway}`
      : 'A clearer path is starting to form',
    body: data.interests.length
      ? `We will look for ${cost} connected to ${primaryInterest.toLowerCase()} and compare them against ${pathway.toLowerCase()}.`
      : 'Pick a few signals and ScholarScout will start shaping recommendations before you finish.',
    signals: [
      {
        label: 'Match focus',
        value: data.interests.length
          ? data.interests.map((item) => INTEREST_LABELS[item]).join(', ')
          : 'Waiting for interests',
      },
      {
        label: 'Reality check',
        value: data.gpaBand
          ? `${GPA_BAND_LABELS[data.gpaBand]} with ${data.locationPreference ? LOCATION_LABELS[data.locationPreference] : 'location pending'}`
          : 'GPA and location pending',
      },
      {
        label: 'Support lens',
        value: data.supportNeeds.length
          ? data.supportNeeds.map((item) => SUPPORT_NEED_LABELS[item]).join(', ')
          : 'No extra support selected yet',
      },
    ],
  };
}

function formatCount(count: number) {
  return `${count} selected`;
}

function isAffordabilitySensitivity(
  value: unknown,
): value is AffordabilitySensitivity {
  return typeof value === 'number' && affordabilityValues.includes(value as AffordabilitySensitivity);
}
