import { render, screen } from '@testing-library/react';
import StoriesPage from '@/app/stories/page';
import { TRANSITION_STORIES } from '@/lib/transition-stories';

describe('StoriesPage', () => {
  it('renders every local context record in semantic order with a first-class factual exit', () => {
    render(<StoriesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Explore possibilities at your pace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to factual opportunities' })).toHaveAttribute(
      'href',
      '/programmes?metro=greater-houston',
    );
    expect(screen.getAllByRole('article')).toHaveLength(TRANSITION_STORIES.length);
    expect(screen.getAllByText('Scholar Scout context')).toHaveLength(TRANSITION_STORIES.length);
  });

  it('keeps the non-affiliation boundary visible beside each context record', () => {
    render(<StoriesPage />);

    expect(screen.getAllByText(/not provider affiliation, attendance, placement, endorsement, or outcome evidence/i))
      .toHaveLength(TRANSITION_STORIES.length);
  });

  it('ships only the fixed local catalogue destinations, never a provider-specific or personal submission route', () => {
    render(<StoriesPage />);

    expect(TRANSITION_STORIES).toHaveLength(6);
    const destinations = screen.getAllByRole('article').map((article) => article.querySelector('a'));
    expect(destinations).toHaveLength(6);
    expect(destinations.map((link) => link?.getAttribute('href'))).toEqual(
      TRANSITION_STORIES.map((story) => story.href),
    );
    expect(destinations.every((link) => link?.getAttribute('href')?.startsWith('/programmes?metro='))).toBe(true);
    expect(document.querySelector('form, input, textarea, select, button, video, audio, iframe')).not.toBeInTheDocument();
    expect(screen.queryByText(/submit your story|provider testimony|student outcome/i)).not.toBeInTheDocument();
  });
});
