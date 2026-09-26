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
});
