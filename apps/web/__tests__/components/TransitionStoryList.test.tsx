import { render, screen } from '@testing-library/react';
import TransitionStoryList from '@/components/stories/TransitionStoryList';
import { TRANSITION_STORIES } from '@/lib/transition-stories';

describe('TransitionStoryList', () => {
  it('keeps the skip action and factual links in ordinary keyboard order', () => {
    render(<TransitionStoryList stories={TRANSITION_STORIES.slice(0, 2)} />);

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Skip to factual opportunities',
      'Browse Greater Houston university options',
      'Browse Greater Chicago community college options',
    ]);
    expect(links.every((link) => link.getAttribute('href')?.startsWith('/programmes?metro='))).toBe(true);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('input, textarea, select, video, audio')).not.toBeInTheDocument();
  });

  it('keeps optional decoration hidden and non-interactive so text and actions remain primary', () => {
    render(<TransitionStoryList stories={TRANSITION_STORIES.slice(0, 1)} />);

    const decoration = screen.getByTestId('transition-story-decoration');
    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    expect(decoration).toHaveClass('pointer-events-none', 'transition-story-decoration');
    expect(decoration).not.toHaveAttribute('tabindex');
  });
});
