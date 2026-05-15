'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import {
  evaluateSimulation,
  type Simulation,
  type SimulationAnswerMap,
  type SimulationRunResult,
} from '@/lib/simulations';
import {
  SIMULATION_RESULTS_STORAGE_KEY,
  parseSimulationResults,
  serializeSimulationResult,
} from '@/lib/simulation-recommendation-signals';

interface SimulationPlayerProps {
  simulation: Simulation;
}

const latestResultStorageKey = 'simulation-result';

export default function SimulationPlayer({ simulation }: SimulationPlayerProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SimulationAnswerMap>({});
  const [result, setResult] = useState<SimulationRunResult | null>(null);
  const [saving, setSaving] = useState(false);
  const step = simulation.steps[stepIndex];
  const selectedChoiceId = step ? answers[step.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === simulation.steps.length;
  const progress = Math.round(
    ((stepIndex + 1) / Math.max(simulation.steps.length, 1)) * 100,
  );
  const selectedChoice = useMemo(
    () => step?.choices.find((choice) => choice.id === selectedChoiceId),
    [selectedChoiceId, step],
  );

  function selectChoice(choiceId: string) {
    if (!step) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [step.id]: choiceId,
    }));
  }

  function goNext() {
    if (!selectedChoiceId) {
      return;
    }

    setStepIndex((current) =>
      Math.min(current + 1, simulation.steps.length - 1),
    );
  }

  function goPrevious() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function finishSimulation() {
    if (!complete) {
      return;
    }

    setResult(evaluateSimulation(simulation, answers));
  }

  function restart() {
    setStepIndex(0);
    setAnswers({});
    setResult(null);
  }

  function saveAndContinue() {
    if (!result) {
      return;
    }

    setSaving(true);
    window.localStorage.setItem(latestResultStorageKey, JSON.stringify(result));
    window.localStorage.setItem(
      SIMULATION_RESULTS_STORAGE_KEY,
      serializeSimulationResult(
        parseSimulationResults(
          window.localStorage.getItem(SIMULATION_RESULTS_STORAGE_KEY),
        ),
        result,
      ),
    );
    router.push('/recommendations');
  }

  if (!step) {
    return (
      <Card className="p-6">
        <Badge tone="danger">Simulation unavailable</Badge>
        <p className="mt-3 text-sm text-ink-600">
          This simulation has no steps yet.
        </p>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="p-6">
        <Badge tone="success">Simulation complete</Badge>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-500">
              Score
            </p>
            <p className="mt-1 text-5xl font-extrabold text-ink-900">
              {result.score}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink-500">
              Clarity score
            </p>
            <p className="mt-1 text-5xl font-extrabold text-success-700">
              {result.clarityScore}%
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {result.insights.map((insight) => (
            <p
              key={insight}
              className="rounded-card border border-ink-200 bg-ink-50 p-3 text-sm leading-6 text-ink-700"
            >
              {insight}
            </p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={saveAndContinue} disabled={saving}>
            {saving ? 'Saving...' : 'Save and see recommendations'}
          </Button>
          <Button variant="secondary" onClick={restart}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-200 bg-ink-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone="brand">{simulation.careerTitle}</Badge>
          <p className="text-xs font-semibold uppercase text-ink-500">
            Step {stepIndex + 1} of {simulation.steps.length}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-ink-200">
          <div
            className="h-full bg-brand-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="border-b border-ink-200 bg-ink-900 p-6 text-white lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase text-brand-100">
            Scenario
          </p>
          <h2 className="mt-3 text-2xl font-extrabold">{step.title}</h2>
          <p className="mt-4 text-sm leading-6 text-white/80">{step.scene}</p>
          <p className="mt-6 text-base font-semibold leading-7">
            {step.prompt}
          </p>
        </section>

        <section className="p-5">
          <div className="grid gap-3">
            {step.choices.map((choice) => {
              const selected = selectedChoiceId === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => selectChoice(choice.id)}
                  className={`rounded-card border p-4 text-left transition-colors ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-900'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400'
                  }`}
                >
                  <span className="text-sm font-bold">{choice.label}</span>
                  {selected ? (
                    <span className="mt-2 block text-sm leading-6 text-ink-600">
                      {choice.outcome}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedChoice ? (
            <p className="mt-4 text-sm font-semibold text-success-700">
              Choice saved for this step.
            </p>
          ) : (
            <p className="mt-4 text-sm text-ink-500">
              Select one choice to continue.
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button
              variant="secondary"
              onClick={goPrevious}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            {stepIndex === simulation.steps.length - 1 ? (
              <Button onClick={finishSimulation} disabled={!complete}>
                Finish simulation
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!selectedChoiceId}>
                Next
              </Button>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}
