import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import CatalogueVisualWelcome from '@/components/catalogue/CatalogueVisualWelcome';

const welcomeSourcePath = join(process.cwd(), 'components/catalogue/CatalogueVisualWelcome.tsx');
const globalStylesPath = join(process.cwd(), 'app/globals.css');

describe('media-free catalogue visual contract', () => {
  it('keeps the dedicated welcome static, code-native, and separate from media or student data', () => {
    const play = jest.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });

    render(<CatalogueVisualWelcome regionLabel="Greater Houston" />);

    const welcome = screen.getByTestId('catalogue-visual-welcome');
    const source = readFileSync(welcomeSourcePath, 'utf8');

    expect(welcome.querySelector('img, video, iframe, embed, object, source')).toBeNull();
    expect(play).not.toHaveBeenCalled();
    expect(source).not.toMatch(/DiscoveryPreviewSlot|renderableMedia|<img|<video|<iframe|<embed|https?:\/\/|useEffect|useState|setTimeout|IntersectionObserver|fetch\(|localStorage|sessionStorage|analytics|profile|play\(/);
    expect(source).not.toMatch(/Phase 13|UAT complete|verified complete/);
  });

  it('keeps the welcome styling static while inherited media safeguards remain separate', () => {
    const styles = readFileSync(globalStylesPath, 'utf8');
    const welcomeStyles = styles.slice(
      styles.indexOf('.catalogue-visual-shell'),
      styles.indexOf('.transition-story-decoration'),
    );

    expect(welcomeStyles).toContain('.catalogue-visual-welcome');
    expect(welcomeStyles).not.toMatch(/animation\s*:/);
    expect(welcomeStyles).not.toMatch(/@keyframes/);
  });
});
