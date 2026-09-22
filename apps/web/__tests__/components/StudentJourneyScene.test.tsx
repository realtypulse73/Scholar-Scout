import { render, screen } from '@testing-library/react';
import StudentJourneyScene from '@/components/visual/StudentJourneyScene';

describe('StudentJourneyScene', () => {
  it('keeps caller content above two non-interactive decorative student-side layers', () => {
    render(
      <StudentJourneyScene>
        <a href="/onboarding">Find my path</a>
      </StudentJourneyScene>,
    );

    expect(screen.getByRole('link', { name: 'Find my path' })).toBeInTheDocument();
    const scene = screen.getByTestId('student-journey-scene');
    const decorations = scene.querySelectorAll('[data-student-decoration]');

    expect(decorations).toHaveLength(2);
    decorations.forEach((decoration) => {
      expect(decoration).toHaveAttribute('aria-hidden', 'true');
      expect(decoration).toHaveClass('pointer-events-none');
      expect(decoration).not.toHaveAttribute('tabindex');
    });
    expect(scene.querySelector('[data-scene-content]')).toHaveClass('relative', 'z-10');
  });

  it('exposes stable scene classes for CSS-only reduced-motion handling', () => {
    render(<StudentJourneyScene>Scene content</StudentJourneyScene>);

    expect(screen.getByTestId('student-journey-scene')).toHaveClass('student-journey-scene');
    expect(document.querySelector('.student-motion-layer')).toBeInTheDocument();
    expect(document.querySelector('.student-light-trail')).toBeInTheDocument();
  });
});
