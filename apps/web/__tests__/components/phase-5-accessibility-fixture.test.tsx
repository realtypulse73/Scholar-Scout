import { render, screen } from '@testing-library/react';
import PhaseFiveAccessibilityFixture from '@/components/phase-5-accessibility/PhaseFiveAccessibilityFixture';

describe('PhaseFiveAccessibilityFixture', () => {
  it('renders all missing Phase 5 accessibility states without an interactive submission flow', () => {
    render(<PhaseFiveAccessibilityFixture />);

    expect(screen.getByRole('heading', { name: 'No pathways match these priorities yet' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verify programme details before you apply' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No programme details are available for this school yet' })).toBeInTheDocument();
    expect(screen.getByText(/École supérieure d’études technologiques/)).toBeInTheDocument();
    expect(screen.getByText(/漢字かなカナ/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
