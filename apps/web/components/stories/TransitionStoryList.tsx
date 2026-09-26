import Link from 'next/link';
import {
  TRANSITION_STORY_SKIP_HREF,
  type TransitionStory,
} from '@/lib/transition-stories';

interface TransitionStoryListProps {
  stories: readonly TransitionStory[];
}

/** A finite, editorial orientation list that always returns visitors to reviewed facts. */
export default function TransitionStoryList({ stories }: TransitionStoryListProps) {
  return (
    <section aria-labelledby="transition-context-heading" className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
      <div className="transition-story-list relative overflow-hidden rounded-card border border-brand-200 bg-brand-50 p-5 shadow-panel sm:p-7">
        <div
          aria-hidden="true"
          data-testid="transition-story-decoration"
          className="transition-story-decoration pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[18px] border-white/70 bg-brand-100/60"
        />
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Scholar Scout orientation</p>
          <h1 id="transition-context-heading" className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">Explore possibilities at your pace</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-700">These short prompts are general context for choosing what to explore. The reviewed catalogue remains the place to check published facts and sources.</p>
          <Link href={TRANSITION_STORY_SKIP_HREF} className="mt-5 inline-flex min-h-touch items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
            Skip to factual opportunities
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {stories.map((story) => (
          <article key={story.id} aria-labelledby={`${story.id}-heading`} className="rounded-card border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Scholar Scout context</p>
            <h2 id={`${story.id}-heading`} className="mt-2 text-xl font-semibold text-ink-900">{story.title}</h2>
            <p className="mt-2 max-w-3xl leading-7 text-ink-700">{story.context}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">This is Scholar Scout context, not provider affiliation, attendance, placement, endorsement, or outcome evidence.</p>
            <Link href={story.href} className="mt-4 inline-flex min-h-touch items-center rounded-control border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
              {story.destinationLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
