'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import type { Recommendation, Simulation, SimulationAnswer } from '@/lib/platform';

interface SimulationPlayerProps {
  simulation: Simulation;
  recommendations: Recommendation[];
}

export default function SimulationPlayer({
  simulation,
  recommendations,
}: SimulationPlayerProps) {
  const [answers, setAnswers] = useState<SimulationAnswer[]>([]);
  const [result, setResult] = useState<{
    clarityScore: number;
    feedback: string[];
    boosts: string[];
  } | null>(null);
  const complete = answers.length === simulation.scenarios.length;
  const answerMap = useMemo(
    () => new Map(answers.map((answer) => [answer.scenarioId, answer.choiceId])),
    [answers],
  );

  function selectAnswer(scenarioId: string, choiceId: string) {
    setAnswers((current) => [
      ...current.filter((answer) => answer.scenarioId !== scenarioId),
      { scenarioId, choiceId },
    ]);
  }

  async function submit() {
    const response = await fetch('/api/simulations/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey: 'local-student',
        simulationId: simulation.id,
        answers,
      }),
    });
    const body = (await response.json()) as {
      result: { clarityScore: number; feedback: string[]; boosts: string[] };
    };

    setResult(body.result);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="space-y-4">
        {simulation.scenarios.map((scenario, index) => (
          <Card key={scenario.id} className="p-5">
            <Badge tone="brand">Step {index + 1}</Badge>
            <h2 className="mt-3 text-xl font-extrabold text-ink-900">
              {scenario.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              {scenario.prompt}
            </p>
            <div className="mt-4 grid gap-3">
              {scenario.choices.map((choice) => {
                const selected = answerMap.get(scenario.id) === choice.id;

                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => selectAnswer(scenario.id, choice.id)}
                    className={`rounded-card border p-4 text-left text-sm font-semibold transition-colors ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400'
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
        <Button disabled={!complete} onClick={() => void submit()}>
          Save simulation result
        </Button>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-ink-500">
            Clarity score
          </p>
          <p className="mt-2 text-4xl font-extrabold text-ink-900">
            {result?.clarityScore ?? 0}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Results are saved server-side and used as a recommendation boost.
          </p>
          {result ? (
            <div className="mt-4 space-y-2">
              {result.feedback.map((line) => (
                <p key={line} className="text-sm leading-6 text-ink-700">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-ink-500">
            Recommended next
          </p>
          <div className="mt-3 space-y-3">
            {recommendations.slice(0, 3).map((recommendation) => (
              <Link
                key={recommendation.programme.id}
                href={`/programmes/${recommendation.programme.id}`}
                className="block rounded-card border border-ink-200 p-3"
              >
                <h3 className="text-sm font-bold text-ink-900">
                  {recommendation.programme.name}
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  {recommendation.explanation[0]}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
