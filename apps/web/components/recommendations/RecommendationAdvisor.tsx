'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui';
import type { AdvisorMessage } from '@/lib/recommendation-advisor';

interface RecommendationAdvisorProps {
  messages: AdvisorMessage[];
}

export default function RecommendationAdvisor({ messages }: RecommendationAdvisorProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <section className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
      <Badge tone="brand" className="mb-4">
        Live advisor
      </Badge>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="border rounded p-4">
            <p className="text-xs uppercase text-ink-500">{message.tone}</p>
            <h3 className="text-lg font-extrabold">{message.title}</h3>
            <p className="text-sm text-ink-600 mt-1">{message.body}</p>

            {message.actionLabel && message.actionHref ? (
              <Link
                href={message.actionHref}
                className="inline-block mt-3 text-sm font-semibold text-brand-700 underline"
              >
                {message.actionLabel}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
