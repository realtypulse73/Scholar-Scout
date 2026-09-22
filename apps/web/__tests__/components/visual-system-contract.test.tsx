import { render, screen } from '@testing-library/react';
import PhaseFiveAccessibilityFixture from '@/components/phase-5-accessibility/PhaseFiveAccessibilityFixture';

describe('visual system count-state contract', () => {
  it.each([
    ['zero', 'No pathways match these priorities yet'],
    ['one', '1 pathway matches these priorities'],
    ['many', '3 pathways match these priorities'],
  ] as const)('keeps the %s state readable', (countState, label) => {
    render(<PhaseFiveAccessibilityFixture countState={countState} />);

    expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    expect(screen.getByText('Preview-only UAT fixture')).toHaveClass('text-brand-800');
  });
});
