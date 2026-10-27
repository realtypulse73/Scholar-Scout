import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import LearnerVisualShell from '@/components/layout/LearnerVisualShell';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('LearnerVisualShell', () => {
  const usePathnameMock = jest.mocked(usePathname);

  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  it('uses a decorative paired urban-to-learning scene for catalogue-facing learner routes', () => {
    usePathnameMock.mockReturnValue('/programmes');

    const { container } = render(
      <LearnerVisualShell>
        <main>Reviewed opportunities</main>
      </LearnerVisualShell>,
    );

    const backdrop = container.querySelector('.journey-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    expect(backdrop).toHaveClass('journey-backdrop--urban');
    expect(container.querySelector('.journey-backdrop__destination-motion')).toBeInTheDocument();
    expect(screen.getByText('Reviewed opportunities')).toBeInTheDocument();
  });

  it('keeps staff and contributor workspace routes visually quiet', () => {
    usePathnameMock.mockReturnValue('/admin/programmes');

    const { container } = render(
      <LearnerVisualShell>
        <main>Programme governance</main>
      </LearnerVisualShell>,
    );

    expect(container.querySelector('.journey-backdrop')).not.toBeInTheDocument();
    expect(screen.getByText('Programme governance')).toBeInTheDocument();
  });

  it('uses the dignity-first story scene only for generic stories context', () => {
    usePathnameMock.mockReturnValue('/stories');

    const { container } = render(<LearnerVisualShell>Stories</LearnerVisualShell>);

    expect(container.querySelector('.journey-backdrop')).toHaveClass('journey-backdrop--reentry');
  });

  it('keeps authentication surfaces static without assigning the re-entry scene', () => {
    usePathnameMock.mockReturnValue('/auth/sign-in');

    const { container } = render(<LearnerVisualShell>Sign in</LearnerVisualShell>);

    expect(container.querySelector('.journey-backdrop')).toHaveClass(
      'journey-backdrop--urban',
      'journey-backdrop--quiet',
    );
  });

  it('removes the decorative animation and transform for reduced motion', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toMatch(/\.journey-backdrop__destination-motion\s*\{\s*animation:\s*none;\s*transform:\s*none;\s*opacity:\s*0\.14;/);
  });
});
