import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscoveryPreviewSlot from '@/components/catalogue/DiscoveryPreviewSlot';
import type { CatalogueRenderableMedia } from '@/lib/catalogue-publication';

const localPreview: CatalogueRenderableMedia = {
  kind: 'local-preview',
  assetPath: '/media/workshop-preview.mp4',
  alt: 'A supervised technical workshop learning environment.',
  label: 'Provider-approved media',
  sourceLabel: 'Workshop media approval',
  sourceUrl: 'https://example.edu/media-approval',
  rightsBasis: 'provider-approved',
  reviewedAt: '2026-09-20',
};

describe('DiscoveryPreviewSlot', () => {
  it('uses a local preview only when overview playback permits it and catches rejected playback', async () => {
    const play = jest.fn(() => Promise.reject(new Error('blocked')));
    const pause = jest.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause });

    render(<DiscoveryPreviewSlot media={localPreview} playback={{ shouldPlay: true, reducedMotion: false, onToggle: jest.fn() }} />);

    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeInTheDocument();
    expect(await screen.findByText(/preview could not start automatically/i)).toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('shows a labelled Scholar Scout illustration or complete factual fallback without an embed surface', () => {
    const illustration: CatalogueRenderableMedia = {
      ...localPreview,
      kind: 'illustration',
      assetPath: '/images/scholarscout-workshop.png',
      alt: 'A clearly illustrative workshop learning environment.',
      label: 'Scholar Scout illustration',
      disclosure: 'AI-generated illustration — not an official campus photograph',
    };
    const { rerender } = render(<DiscoveryPreviewSlot media={illustration} />);

    expect(screen.getByRole('img', { name: /clearly illustrative workshop/i })).toBeInTheDocument();
    expect(screen.getByText('Scholar Scout illustration')).toBeInTheDocument();
    expect(screen.getByText('AI-generated illustration — not an official campus photograph')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'About this media' })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();

    rerender(<DiscoveryPreviewSlot />);

    expect(screen.getByRole('region', { name: /media preview/i })).toHaveTextContent(/does not display provider or learner media yet/i);
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('discloses the reviewed source, permission, attribution, and review date without adding an embed renderer', async () => {
    const user = userEvent.setup();
    render(<DiscoveryPreviewSlot media={{ ...localPreview, attribution: 'Workshop media team' }} />);

    expect(document.querySelectorAll('video')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'About this media' }));

    const dialog = screen.getByRole('dialog', { name: 'About this media' });
    expect(dialog).toHaveTextContent(/workshop media approval/i);
    expect(dialog).toHaveTextContent(/permission basis: provider approved/i);
    expect(dialog).toHaveTextContent(/reviewed: september 2026/i);
    expect(dialog).toHaveTextContent(/attribution: workshop media team/i);
    expect(screen.getByText(/not affiliated with or endorsed by the provider/i)).toBeInTheDocument();
    expect(document.querySelector('iframe, embed, object')).not.toBeInTheDocument();
  });

  it('renders only the anonymous, non-endorsing contributor projection without browser storage or a provider source', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    render(<DiscoveryPreviewSlot contributorMedia={{
      publicId: 'media-12345678-1234-1234-1234-123456789abc',
      mediaRoute: '/api/catalogue-media/media-12345678-1234-1234-1234-123456789abc',
      label: 'Student-contributed perspective',
      nonEndorsement: 'This student-contributed perspective does not represent school endorsement.',
    }} />);

    expect(screen.getByLabelText('Student-contributed perspective')).toBeInTheDocument();
    expect(screen.getByText('Student-contributed perspective')).toBeInTheDocument();
    expect(screen.getByText(/does not represent school endorsement/i)).toBeInTheDocument();
    expect(document.querySelector('source')).toHaveAttribute('src', '/api/catalogue-media/media-12345678-1234-1234-1234-123456789abc');
    expect(screen.queryByRole('button', { name: 'About this media' })).not.toBeInTheDocument();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(document.querySelector('iframe, embed, object')).not.toBeInTheDocument();
  });
});
