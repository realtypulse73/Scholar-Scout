import { render, screen } from '@testing-library/react';
import WesternNewYorkDirectory from '@/components/western-new-york/WesternNewYorkDirectory';

describe('role-language discovery surfaces', () => {
  it('keeps WNY verification and accessible empty-state recovery visible', () => {
    render(<WesternNewYorkDirectory institutions={[]} />);

    expect(screen.getByRole('heading', { name: 'Verify before applying' })).toBeInTheDocument();
    expect(screen.getByText(/Use the official links on each listing/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No pathways match these priorities yet' })).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your access priorities/)).toBeInTheDocument();
  });
});
