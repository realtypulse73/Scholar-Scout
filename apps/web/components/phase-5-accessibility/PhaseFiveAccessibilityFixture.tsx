import { Badge, Card } from '@/components/ui';

const LONG_UNICODE_LABEL = 'École supérieure d’études technologiques — apprentissage 漢字かなカナ العربية';

export default function PhaseFiveAccessibilityFixture() {
  return (
    <main className="min-h-screen bg-ink-50 px-5 py-10 text-ink-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <Badge tone="brand">Preview-only UAT fixture</Badge>
          <h1 className="mt-4 text-3xl font-extrabold">Phase 5 accessibility review</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">
            This read-only page contains no student records, sign-in controls, API calls, or official-source links.
            It exists only to make the remaining accessibility states observable in Preview.
          </p>
        </header>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-brand-700">Western New York directory</p>
          <h2 className="mt-2 text-xl font-extrabold">No pathways match these priorities yet</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Try adjusting your access priorities, then use the official sources to compare options directly.
          </p>
        </Card>

        <section aria-labelledby="fixture-school-verification-heading" className="rounded-card border border-brand-200 bg-brand-50 p-6 text-sm leading-6 text-ink-700">
          <h2 id="fixture-school-verification-heading" className="font-extrabold text-brand-800">Verify programme details before you apply</h2>
          <p className="mt-2">Programme details can change. Open the official programme page to confirm requirements, delivery, cost, and deadlines.</p>
        </section>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-brand-700">School locker</p>
          <h2 className="mt-2 text-xl font-extrabold">No programme details are available for this school yet</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Explore the student perspectives below and check the school’s official website for current programme information.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-brand-700">Long-Unicode wrapping sample</p>
          <h2 className="mt-2 break-words text-xl font-extrabold">{LONG_UNICODE_LABEL}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-ink-600">
            Long Unicode text must wrap without clipping, overlap, or horizontal page scrolling, and be announced in a coherent order.
          </p>
          <p className="mt-3 break-words text-sm font-semibold text-brand-700">
            Official source label: Études, apprentissage, 漢字, العربية — verification example only
          </p>
        </Card>
      </div>
    </main>
  );
}
