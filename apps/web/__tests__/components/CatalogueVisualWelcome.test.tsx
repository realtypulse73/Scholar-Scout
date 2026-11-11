import { render, screen, within } from '@testing-library/react';
import CatalogueVisualWelcome from '@/components/catalogue/CatalogueVisualWelcome';

describe('CatalogueVisualWelcome', () => {
  it('renders a semantic, CSS-only route to factual discovery', () => {
    render(<CatalogueVisualWelcome regionLabel="Greater Houston" />);

    const welcome = screen.getByRole('region', { name: /visual welcome/i });

    expect(within(welcome).getByRole('heading', { name: /begin with what you can verify/i })).toBeInTheDocument();
    expect(within(welcome).getByText(/greater houston/i)).toBeInTheDocument();
    expect(within(welcome).getByRole('link', { name: /browse reviewed opportunities/i }))
      .toHaveAttribute('href', '#catalogue-results-heading');
    expect(welcome.querySelectorAll('[aria-hidden="true"]')).not.toHaveLength(0);
    expect(welcome.querySelector('img, video, iframe, embed, object')).toBeNull();
  });

  it('keeps long display text inside the welcome content plane', () => {
    render(<CatalogueVisualWelcome regionLabel="Greater Kingston, Jamaica — reviewed opportunity catalogue" />);

    expect(screen.getByText(/greater kingston, jamaica/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /visual welcome/i })).toHaveClass('min-w-0');
  });
});
