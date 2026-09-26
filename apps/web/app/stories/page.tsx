import TransitionStoryList from '@/components/stories/TransitionStoryList';
import { TRANSITION_STORIES } from '@/lib/transition-stories';

export const metadata = {
  title: 'Explore possibilities | Scholar Scout',
  description: 'Finite Scholar Scout context that leads back to reviewed factual opportunities.',
};

/** A public, local-only orientation route with no account, profile, or provider reads. */
export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-ink-50 text-ink-900">
      <TransitionStoryList stories={TRANSITION_STORIES} />
    </main>
  );
}
