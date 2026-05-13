'use client';

import { useState } from 'react';
import { Badge, Card, Button } from '@/components/ui';
import type { CareerSimulation, SimulationAnswerMap } from '@/lib/career-simulations';
import { evaluateSimulation } from '@/lib/career-simulations';

interface SimulationPlayerProps {
  simulation: CareerSimulation;
}

export default function SimulationPlayer({ simulation }: SimulationPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<SimulationAnswerMap>({});
  const [result, setResult] = useState<ReturnType<typeof evaluateSimulation> | null>(null);

  const step = simulation.steps[stepIndex];

  function handleChoice(choiceId: string) {
    const nextAnswers = {
      ...answers,
      [step.id]: choiceId,
    };

    setAnswers(nextAnswers);

    if (stepIndex === simulation.steps.length - 1) {
      setResult(evaluateSimulation(simulation, nextAnswers));
      return;
    }

    setStepIndex(stepIndex + 1);
  }

  function restart() {
    setStepIndex(0);
    setAnswers({});
    setResult(null);
  }

  if (result) {
    return (
      <Card className="p-6 space-y-4">
        <Badge tone="success">Simulation complete</Badge>
        <h2 className="text-2xl font-extrabold">Your fit score: {result.score}%</h2>
        <p className="text-sm text-ink-600">Clarity score: {result.clarityScore}%</p>

        <div className="space-y-2">
          {result.insights.map((insight) => (
            <p key={insight} className="text-sm">• {insight}</p>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={restart}>Try again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <Badge tone="brand">{simulation.careerTitle}</Badge>
      <h2 className="text-xl font-extrabold">{step.title}</h2>
      <p className="text-sm text-ink-600">{step.scene}</p>

      <p className="font-semibold">{step.prompt}</p>

      <div className="space-y-2">
        {step.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleChoice(choice.id)}
            className="w-full text-left border rounded p-3 hover:border-brand-500"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
