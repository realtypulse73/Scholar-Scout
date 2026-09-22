import { render, screen } from '@testing-library/react';
import PeerCommunity from '@/components/peer-community/PeerCommunity';

describe('lifestyle scene consumers', () => {
  it('keeps peer community content above the shared student journey scene', () => {
    render(<PeerCommunity matches={[]} signedIn={false} />);

    const scene = screen.getByTestId('student-journey-scene');

    expect(scene).toContainElement(
      screen.getByRole('heading', {
        name: 'Hear what campus is really like—from the students posting about it.',
      }),
    );
    expect(scene.querySelector('[data-scene-content]')).toContainElement(
      screen.getByText('Campus conversations'),
    );
  });
});
