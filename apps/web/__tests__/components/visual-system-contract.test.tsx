import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import CatalogueVisualWelcome from '@/components/catalogue/CatalogueVisualWelcome';

describe('media-free catalogue visual contract', () => {
  it('keeps the dedicated welcome semantic, static, and free of renderer output', () => {
    const play = jest.spyOn(HTMLMediaElement.prototype, 'play');
    const { container } = render(<CatalogueVisualWelcome regionLabel="Greater Houston" />);

    const decoration = screen.getByTestId('catalogue-visual-welcome-decoration');

    expect(screen.getByRole('heading', { name: /start with reviewed opportunities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse reviewed opportunities/i })).toHaveAttribute(
      'href',
      '#catalogue-results-heading',
    );
    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    expect(decoration).toHaveClass('pointer-events-none');
    expect(container.querySelectorAll('img, video, audio, source, iframe, embed, object')).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
  });

  it('keeps the dedicated welcome source free of media, request, collection, and Phase 13 responsibilities', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/catalogue/CatalogueVisualWelcome.tsx'),
      'utf8',
    );

    expect(source).not.toMatch(/DiscoveryPreviewSlot|renderableMedia|<img|<video|<audio|<source|<iframe|<embed|<object/i);
    expect(source).not.toMatch(/['"](?:https?:)?\/\/|['"]\/+(?:media|images)\//i);
    expect(source).not.toMatch(/useEffect|setInterval|setTimeout|IntersectionObserver|\.play\(/);
    expect(source).not.toMatch(/fetch\(|localStorage|sessionStorage|analytics|profile|store|\/api\//i);
    expect(source).not.toMatch(/phase\s*13|verification conclusion|uat complete/i);
  });
});
