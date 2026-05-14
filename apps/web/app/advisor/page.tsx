import Link from 'next/link';
import AdvisorChat from '@/components/advisor/AdvisorChat';
import { Badge } from '@/components/ui';

export const metadata = {
  title: 'AI Advisor | ScholarScout',
  description: 'Ask a context-aware ScholarScout advisor for next-step help.',
};

export default function AdvisorPage() {
  return (
    <main className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Link href="/" className="text-sm font-semibold text-brand-700">
            ScholarScout
          </Link>
          <div className="mt-5 max-w-2xl">
            <Badge tone="brand">AI advisor</Badge>
            <h1 className="mt-4 text-3xl font-extrabold text-ink-900">
              Ask for help choosing the next move.
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              The advisor uses saved memory, simulation results, and programme
              context through a server route.
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <AdvisorChat />
      </div>
    </main>
  );
}
