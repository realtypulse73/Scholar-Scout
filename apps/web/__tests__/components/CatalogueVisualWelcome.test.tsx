import { render, screen } from '@testing-library/react';
import CatalogueVisualWelcome from '@/components/catalogue/CatalogueVisualWelcome';

describe('CatalogueVisualWelcome', () => {
  it('renders a semantic, media-free welcome that leads to factual discovery', () => {
    render(<CatalogueVisualWelcome regionLabel="Greater Houston" />);

    expect(screen.getByRole('heading', { name: /start with reviewed opportunities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse reviewed opportunities/i })).toHaveAttribute(
      'href',
      '#catalogue-results-heading',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
    expect(document.querySelector('iframe, embed, object')).not.toBeInTheDocument();
  });

  it('keeps decorative shapes out of the accessibility tree and pointer interactions', () => {
    const { container } = render(<CatalogueVisualWelcome regionLabel="A very long reviewed regional opportunity label that still needs to wrap inside the factual catalogue welcome content plane" />);

    const decoration = container.querySelector('[data-testid="catalogue-visual-welcome-decoration"]');
    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    expect(decoration).toHaveClass('pointer-events-none');
    expect(container.querySelector('.catalogue-visual-welcome > div:last-child')).toHaveClass('min-w-0');
  });

  it('stays static when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });

    const { container } = render(<CatalogueVisualWelcome regionLabel="Greater Houston" />);
    const decoration = screen.getByTestId('catalogue-visual-welcome-decoration');

    expect(decoration).toHaveClass('pointer-events-none');
    expect(decoration.className).not.toMatch(/animate|motion/i);
    expect(container.querySelectorAll('button, video, audio, source')).toHaveLength(0);
  });
});
