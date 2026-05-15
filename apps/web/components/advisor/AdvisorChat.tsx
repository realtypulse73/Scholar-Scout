'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface ChatMessage {
  role: 'student' | 'advisor';
  text: string;
}

interface SimulationAdvisorContext {
  simulationId: string;
  score: number;
  clarityScore: number;
  dominantTraits: string[];
  insights: string[];
  recommendedInterests: string[];
  recommendedPathways: string[];
  nextActions: string[];
}

const suggestedWithoutSimulation = [
  'Which path should I explore first?',
  'What should I verify before I apply?',
  'How should I compare cost and support?',
];

export default function AdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'advisor',
      text: 'Tell me what you are considering, and I will help narrow the next step.',
    },
  ]);
  const [simulationContext, setSimulationContext] =
    useState<SimulationAdvisorContext | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function loadSimulationContext() {
      setSimulationContext(parseSimulationContext(
        window.localStorage.getItem('simulation-result'),
      ));
    }

    loadSimulationContext();
    window.addEventListener('storage', loadSimulationContext);
    window.addEventListener('focus', loadSimulationContext);

    return () => {
      window.removeEventListener('storage', loadSimulationContext);
      window.removeEventListener('focus', loadSimulationContext);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isSending]);

  const advisorSummary = useMemo(
    () => getAdvisorSummary(simulationContext),
    [simulationContext],
  );
  const suggestedQuestions = useMemo(
    () => getSuggestedQuestions(simulationContext),
    [simulationContext],
  );

  async function sendMessage(messageText = input) {
    const trimmed = messageText.trim();

    if (!trimmed || isSending) {
      return;
    }

    const nextMessages = [
      ...messages,
      { role: 'student' as const, text: trimmed },
    ];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userKey: 'local-student',
          message: trimmed,
          context: simulationContext ?? undefined,
        }),
      });
      const body = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !body.reply) {
        throw new Error(body.error ?? 'Advisor reply was unavailable.');
      }

      setMessages([
        ...nextMessages,
        { role: 'advisor', text: body.reply },
      ]);
    } catch {
      setError('The advisor could not answer just now. Try again in a moment.');
      setMessages([
        ...nextMessages,
        {
          role: 'advisor',
          text: 'I could not reach the advisor service. Your safest next step is to compare one top programme, one backup, and one cost detail before deciding.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5">
        <p className="text-xs font-bold uppercase text-ink-500">
          Advisor summary
        </p>
        <h2 className="mt-3 text-xl font-extrabold text-ink-900">
          {advisorSummary.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          {advisorSummary.body}
        </p>

        <div className="mt-5 grid gap-3">
          {advisorSummary.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-card border border-ink-200 bg-ink-50 p-3"
            >
              <p className="text-xs font-bold uppercase text-ink-500">
                {metric.label}
              </p>
              <p className="mt-1 text-lg font-extrabold text-ink-900">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase text-ink-500">
            Suggested questions
          </p>
          <div className="mt-3 grid gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void sendMessage(question)}
                disabled={isSending}
                className="rounded-card border border-ink-200 bg-white p-3 text-left text-sm font-semibold leading-6 text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="h-[28rem] space-y-3 overflow-y-auto rounded-card border border-ink-200 bg-ink-50 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-card border p-3 text-sm leading-6 ${
                message.role === 'student'
                  ? 'ml-auto border-brand-200 bg-brand-600 text-white'
                  : 'border-ink-200 bg-white text-ink-700'
              }`}
            >
              {message.text}
            </div>
          ))}
          {isSending ? (
            <div className="max-w-[85%] rounded-card border border-ink-200 bg-white p-3 text-sm font-semibold text-ink-500">
              Thinking...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="mt-3 text-sm font-semibold text-danger-700">{error}</p>
        ) : null}

        <div className="mt-4 flex gap-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about fit, risk, cost, or next steps"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void sendMessage();
              }
            }}
          />
          <Button disabled={isSending} onClick={() => void sendMessage()}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

function parseSimulationContext(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SimulationAdvisorContext>;

    if (
      typeof parsed.simulationId !== 'string' ||
      typeof parsed.score !== 'number' ||
      typeof parsed.clarityScore !== 'number'
    ) {
      return null;
    }

    return {
      simulationId: parsed.simulationId,
      score: parsed.score,
      clarityScore: parsed.clarityScore,
      dominantTraits: asStringArray(parsed.dominantTraits),
      insights: asStringArray(parsed.insights),
      recommendedInterests: asStringArray(parsed.recommendedInterests),
      recommendedPathways: asStringArray(parsed.recommendedPathways),
      nextActions: asStringArray(parsed.nextActions),
    };
  } catch {
    return null;
  }
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getAdvisorSummary(context: SimulationAdvisorContext | null) {
  if (!context) {
    return {
      title: 'No simulation result yet',
      body: 'Run a simulation first to give the advisor stronger context. You can still ask general questions about comparing cost, fit, support, and next steps.',
      metrics: [
        { label: 'Context', value: 'General' },
        { label: 'Best next move', value: 'Run simulation' },
      ],
    };
  }

  return {
    title: `Simulation clarity is ${context.clarityScore}%`,
    body:
      context.insights[0] ??
      'Your simulation result is ready. The advisor will use your score, traits, interests, pathways, and next actions.',
    metrics: [
      { label: 'Score', value: `${context.score}%` },
      { label: 'Clarity', value: `${context.clarityScore}%` },
      {
        label: 'Traits',
        value: context.dominantTraits
          .map((trait) => trait.replace('-', ' '))
          .join(', ') || 'None yet',
      },
    ],
  };
}

function getSuggestedQuestions(context: SimulationAdvisorContext | null) {
  if (!context) {
    return suggestedWithoutSimulation;
  }

  return [
    'What does my simulation result say I should do next?',
    'Which pathway fits my traits best?',
    'What should I verify before applying?',
    context.nextActions[0]
      ? `How do I start: ${context.nextActions[0]}`
      : 'How should I compare my top options?',
  ];
}
