import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CatalogueDiscoveryOverview from '@/components/catalogue/CatalogueDiscoveryOverview';
import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { catalogueRegions } from '@/lib/catalogue-fixtures';
import { buildQualificationLensModel } from '@/lib/qualification-lens';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock('@/components/qualifications/QualificationRecordForm', () => ({
  __esModule: true,
  default: ({ onClose, onSuccess }: { onClose?: () => void; onSuccess?: () => void }) => (
    <button type="button" onClick={() => { onSuccess?.(); onClose?.(); }}>
      Complete qualification update
    </button>
  ),
}));

const evidence = { status: 'current' as const, authority: 'provider-official' as const, sourceLabel: 'Official programme source', sourceUrl: 'https://example.edu/programme', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-20', verificationAction: 'Verify on the official programme page.' };
const fact = <T,>(value: T) => ({ value, evidence });
const publishedRecord: CataloguePublishedRecord = {
  id: 'catalogue:one', revision: 1, title: 'Welding pathway', regionId: 'greater-houston',
  region: {
    id: 'greater-houston', label: 'Greater Houston',
    officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' },
    localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' },
  },
  source: { sourceLabel: 'Official programme source', sourceUrl: 'https://example.edu/programme', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-20' },
  facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school'), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person') },
  claimBoundary: 'Factual programme details from the official source.', mediaFallback: false,
  publishedRequirements: [{
    text: 'A high school diploma or equivalent is required.',
    qualificationKeys: ['diploma-credits'],
    evidence,
  }],
};

describe('CatalogueDiscoveryOverview', () => {
  let observerCallback: IntersectionObserverCallback | undefined;
  const play = jest.fn(() => Promise.resolve());
  const pause = jest.fn();
  let prefersReducedMotion = false;

  beforeEach(() => {
    mockRefresh.mockClear();
    observerCallback = undefined;
    play.mockClear();
    pause.mockClear();
    prefersReducedMotion = false;
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({
        matches: prefersReducedMotion,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = jest.fn();
      takeRecords = jest.fn(() => []);
      root = null;
      rootMargin = '0px';
      thresholds = [0];
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  it('renders governed discovery actions without an account or profile', () => {
    const model = buildCatalogueDiscoveryModel({ records: [publishedRecord], searchParams: { metro: 'greater-houston' } });
    render(<CatalogueDiscoveryOverview model={model} />);
    expect(screen.getByRole('heading', { name: /reviewed opportunities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification/i })).toHaveAttribute('href', 'https://example.edu/programme');
    expect(screen.getByRole('link', { name: /see all facts and sources/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open comparison/i })).toHaveAttribute('href', '/shortlist');
    expect(screen.getAllByText(/not yet verified/i)).not.toHaveLength(0);
  });

  it('announces active filters with labelled native controls and bounded result content', () => {
    const model = buildCatalogueDiscoveryModel({
      records: [publishedRecord],
      searchParams: {
        metro: 'greater-houston',
        pathway: 'trade-career-school',
        delivery: 'in-person',
        status: 'current',
        q: 'welding',
      },
    });

    render(<CatalogueDiscoveryOverview model={model} />);

    expect(screen.getByRole('form', { name: /catalogue filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Metro area')).toHaveValue('greater-houston');
    expect(screen.getByLabelText('Pathway type')).toHaveValue('trade-career-school');
    expect(screen.getByLabelText('Delivery')).toHaveValue('in-person');
    expect(screen.getByLabelText('Fact status')).toHaveValue('current');
    expect(screen.getByLabelText('Search reviewed records')).toHaveValue('welding');
    expect(screen.getByRole('status')).toHaveTextContent(/active filters: pathway type: trade or career school/i);
    expect(screen.getByRole('status')).toHaveTextContent(/fact status: current/i);
    expect(screen.getByTestId('catalogue-overview-layout')).toHaveClass('w-full', 'min-w-0', 'max-w-6xl');
    expect(screen.getByTestId('catalogue-coverage')).toHaveTextContent(/not yet verified/i);
  });

  it('keeps normal order by default and changes only local all-visible order after the labelled radio is selected', async () => {
    const user = userEvent.setup();
    const model = buildCatalogueDiscoveryModel({
      records: [publishedRecord],
      searchParams: { metro: 'greater-houston' },
    });
    const lens = buildQualificationLensModel(model.items, {
      structured: ['diploma-credits'],
      keywords: [],
    });

    render(<CatalogueDiscoveryOverview model={model} qualificationLens={lens} canEditQualifications={false} />);

    expect(screen.getByRole('radio', { name: 'Normal catalogue' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 reviewed opportunity. Normal catalogue order. Every opportunity is still shown.');
    expect(screen.getByText('Every reviewed opportunity stays in the list. This changes order only.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Qualifications first' }));

    expect(screen.getByRole('radio', { name: 'Qualifications first' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 reviewed opportunity. Qualifications first order. Every opportunity is still shown.');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('1 published requirement checked')).toBeInTheDocument();
  });

  it('keeps normal browsing available while saved qualifications are loading or unavailable', () => {
    const model = buildCatalogueDiscoveryModel({
      records: [publishedRecord],
      searchParams: { metro: 'greater-houston' },
    });
    const { rerender } = render(<CatalogueDiscoveryOverview model={model} qualificationLensState="loading" />);

    expect(screen.getByText('Loading your saved qualifications…')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Qualifications first' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /see all facts and sources for welding pathway/i })).toBeInTheDocument();

    rerender(<CatalogueDiscoveryOverview model={model} qualificationLensState="error" />);

    expect(screen.getByText('Qualifications first is unavailable right now. You can still browse every opportunity.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry qualifications first' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Normal catalogue' })).toBeChecked();
  });

  it('refreshes the server lens and returns focus after a successful embedded qualification update', async () => {
    const user = userEvent.setup();
    const model = buildCatalogueDiscoveryModel({
      records: [publishedRecord],
      searchParams: { metro: 'greater-houston' },
    });
    const lens = buildQualificationLensModel(model.items, {
      structured: ['diploma-credits'],
      keywords: [],
    });

    render(<CatalogueDiscoveryOverview model={model} qualificationLens={lens} canEditQualifications />);

    const trigger = screen.getByRole('button', { name: 'Edit qualifications' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Complete qualification update' }));

    expect(mockRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('button', { name: 'Complete qualification update' })).not.toBeInTheDocument();
  });

  it('adds an optional visual explorer without removing ordinary six-area factual browsing', () => {
    const model = buildCatalogueDiscoveryModel({
      records: [{
        ...publishedRecord,
        renderableMedia: {
          kind: 'local-preview',
          assetPath: '/media/welding-workshop.mp4',
          alt: 'A welding workshop learning environment.',
          label: 'Provider-approved media',
          sourceLabel: 'Welding pathway media approval',
          sourceUrl: 'https://example.edu/media-approval',
          rightsBasis: 'provider-approved',
          reviewedAt: '2026-09-20',
        },
      }],
      searchParams: { metro: 'greater-houston' },
    });

    render(<CatalogueDiscoveryOverview model={model} />);

    const explorer = screen.getByRole('region', { name: /optional visual explorer/i });
    expect(within(explorer).getByText('Provider-approved media')).toBeInTheDocument();
    expect(within(explorer).getByRole('link', { name: /view welding pathway details/i }))
      .toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
    expect(screen.getByRole('form', { name: /catalogue filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Metro area')).toBeInTheDocument();
    expect(screen.getByTestId('catalogue-coverage').querySelectorAll('li')).toHaveLength(6);
    expect(screen.getByRole('link', { name: /see all facts and sources for welding pathway/i })).toBeInTheDocument();
  });

  it('links to Stories from a non-default metro without changing factual browsing controls', () => {
    const chicagoRegion = catalogueRegions.find((region) => region.id === 'greater-chicago');
    expect(chicagoRegion).toBeDefined();
    const model = buildCatalogueDiscoveryModel({
      records: [{
        ...publishedRecord,
        regionId: 'greater-chicago',
        region: chicagoRegion!,
      }],
      searchParams: { metro: 'greater-chicago' },
    });

    render(<CatalogueDiscoveryOverview model={model} />);

    expect(screen.getByRole('link', { name: /explore visual stories/i }))
      .toHaveAttribute('href', '/stories');
    expect(screen.getByRole('heading', { name: /reviewed opportunities in greater chicago/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Metro area')).toHaveValue('greater-chicago');
    expect(screen.getByTestId('catalogue-coverage').querySelectorAll('li')).toHaveLength(6);
    expect(screen.getByRole('link', { name: /see all facts and sources for welding pathway/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reset filters/i })).toBeInTheDocument();
  });

  it('allows only the visible visual card nearest the viewport center to play and retains a manual pause', async () => {
    const user = userEvent.setup();
    const localMedia = {
      kind: 'local-preview' as const,
      assetPath: '/media/welding-workshop.mp4',
      alt: 'A welding workshop learning environment.',
      label: 'Provider-approved media',
      sourceLabel: 'Welding pathway media approval',
      sourceUrl: 'https://example.edu/media-approval',
      rightsBasis: 'provider-approved' as const,
      reviewedAt: '2026-09-20',
    };
    const model = buildCatalogueDiscoveryModel({
      records: [
        { ...publishedRecord, renderableMedia: localMedia },
        { ...publishedRecord, id: 'catalogue:two', title: 'Electrical pathway', renderableMedia: { ...localMedia, assetPath: '/media/electrical-workshop.mp4', alt: 'An electrical workshop learning environment.' } },
      ],
      searchParams: { metro: 'greater-houston' },
    });

    render(<CatalogueDiscoveryOverview model={model} />);

    const firstPreview = screen.getByTestId('visual-preview-catalogue:one');
    const secondPreview = screen.getByTestId('visual-preview-catalogue:two');
    expect(observerCallback).toBeDefined();
    observerCallback?.([
      observerEntry(firstPreview, 220),
      observerEntry(secondPreview, 680),
    ], {} as IntersectionObserver);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));

    expect(within(firstPreview).getByRole('button', { name: /pause preview/i })).toBeInTheDocument();
    expect(within(secondPreview).getByRole('button', { name: /play preview/i })).toBeInTheDocument();
    await user.click(within(firstPreview).getByRole('button', { name: /pause preview/i }));
    expect(pause).toHaveBeenCalled();
    expect(within(firstPreview).getByRole('button', { name: /play preview/i })).toBeInTheDocument();

    observerCallback?.([
      observerEntry(firstPreview, 760),
      observerEntry(secondPreview, 260),
    ], {} as IntersectionObserver);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
  });

  it('keeps local previews still for visitors who prefer reduced motion', () => {
    prefersReducedMotion = true;
    const model = buildCatalogueDiscoveryModel({
      records: [{
        ...publishedRecord,
        renderableMedia: {
          kind: 'local-preview',
          assetPath: '/media/welding-workshop.mp4',
          alt: 'A welding workshop learning environment.',
          label: 'Provider-approved media',
          sourceLabel: 'Welding pathway media approval',
          sourceUrl: 'https://example.edu/media-approval',
          rightsBasis: 'provider-approved',
          reviewedAt: '2026-09-20',
        },
      }],
      searchParams: { metro: 'greater-houston' },
    });

    render(<CatalogueDiscoveryOverview model={model} />);

    const preview = screen.getByTestId('visual-preview-catalogue:one');
    expect(play).not.toHaveBeenCalled();
    expect(within(preview).getByText(/motion is paused because your device prefers reduced motion/i)).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /play preview/i })).toBeDisabled();
  });
});

function observerEntry(target: Element, midpoint: number): IntersectionObserverEntry {
  return {
    target,
    isIntersecting: true,
    intersectionRatio: 1,
    boundingClientRect: { top: midpoint - 100, bottom: midpoint + 100, height: 200 } as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: 0,
  };
}
