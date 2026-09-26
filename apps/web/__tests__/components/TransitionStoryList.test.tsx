import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('keeps six fixed general contexts, keyboard-first factual exits, and no testimony or submission surface', async () => {
    const user = userEvent.setup();
    render(<TransitionStoryList stories={TRANSITION_STORIES} />);

    const skip = screen.getByRole('link', { name: 'Skip to factual opportunities' });
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(6);
    expect(screen.getAllByText('Scholar Scout context')).toHaveLength(6);
    expect(articles.map((article) => article.querySelector('h2')?.textContent)).toEqual(
      TRANSITION_STORIES.map((story) => story.title),
    );
    expect(articles.map((article) => article.querySelector('a')?.getAttribute('href'))).toEqual(
      TRANSITION_STORIES.map((story) => story.href),
    );
    expect(skip.compareDocumentPosition(articles[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.tab();
    expect(skip).toHaveFocus();
    expect(document.querySelector('form, input, textarea, select, button, video, audio, iframe')).not.toBeInTheDocument();
    TRANSITION_STORIES.forEach((story) => {
      expect(screen.getByText(story.context)).not.toHaveTextContent(/\b(i|my|we|our)\b|attended|graduated|placed|hired|enrolled/i);
    });
  });
});
