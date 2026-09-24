import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CatalogueComparison from '@/components/catalogue/CatalogueComparison';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}));

const evidence = (status: 'current' | 'needs-confirmation' | 'unknown' | 'conflicting' = 'current') => ({
  status,
  authority: 'provider-official' as const,
  sourceLabel: 'Official programme source',
  sourceUrl: 'https://example.edu/programme',
  sourceDate: { state: 'documented' as const, value: '2026-09-20' },
  reviewedAt: '2026-09-20',
  verificationAction: 'Verify on the official programme page.',
});

const fact = <Value,>(value: Value, status: 'current' | 'needs-confirmation' | 'unknown' | 'conflicting' = 'current') => ({
  value,
  state: status,
  evidence: evidence(status),
});

const item = (id = 'catalogue:one', title = 'Welding pathway'): CatalogueDiscoveryItem => ({
  id,
  providerTitle: title,
  regionId: 'greater-houston',
  regionLabel: 'Greater Houston',
  pathway: 'trade-career-school',
  place: fact('Houston, Texas'),
  delivery: fact('in-person'),
  facts: {
    skillTaught: fact('Welding'),
    trainingPayer: fact('Student'),
    costOrTuition: fact('$500', 'needs-confirmation'),
    duration: fact('12 weeks'),
  },
  factState: 'needs-confirmation',
  source: { label: 'Official programme source', date: '2026-09-20', state: 'current' },
  officialVerificationUrl: 'https://example.edu/programme',
  mediaState: 'reserved-for-rights-review',
});

describe('CatalogueComparison', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows one saved public item with source-first factual actions without sign-in', async () => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one']));

    render(<CatalogueComparison items={[item()]} />);

    expect(await screen.findByRole('heading', { name: 'Welding pathway' })).toBeInTheDocument();
    expect(screen.getByText('Trade or career school')).toBeInTheDocument();
    expect(screen.getByText('Houston, Texas')).toBeInTheDocument();
    expect(screen.getByText('Welding')).toBeInTheDocument();
    expect(screen.getByText(/needs confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /details for welding pathway/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone');
    expect(screen.getByRole('link', { name: /official verification for welding pathway/i })).toHaveAttribute('href', 'https://example.edu/programme');
    expect(screen.getByRole('button', { name: /remove welding pathway/i })).toBeInTheDocument();
    expect(screen.queryByText(/best|winner|eligible|fit/i)).not.toBeInTheDocument();
  });

  it('keeps missing IDs and cards in saved order, with each fact still carrying evidence', async () => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:two', 'retired:one', 'catalogue:one']));

    render(<CatalogueComparison items={[item('catalogue:one', 'Welding pathway'), item('catalogue:two', 'Hair design pathway')]} />);

    expect(await screen.findByRole('heading', { name: 'Hair design pathway' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welding pathway' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /retired:one is unavailable/i })).toBeInTheDocument();
    expect(screen.getAllByText('Official programme source')).not.toHaveLength(0);
    expect(screen.getByTestId('catalogue-comparison-root')).toHaveClass('w-full');
    expect(screen.getByTestId('catalogue-comparison-root')).not.toHaveClass('min-w-');
  });

  it('removes only the visitor-selected choice and keeps unavailable saved IDs visible', async () => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one', 'retired:one']));

    render(<CatalogueComparison items={[item()]} />);

    await screen.findByRole('heading', { name: 'Welding pathway' });
    fireEvent.click(screen.getByRole('button', { name: /remove welding pathway/i }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Welding pathway' })).not.toBeInTheDocument());
    expect(screen.getByRole('status', { name: /retired:one is unavailable/i })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('scholarscout.shortlist') ?? '[]')).toEqual(['retired:one']);
  });

  it('shows mixed fact states with their source dates and individual verification actions', async () => {
    const mixed = item();
    mixed.facts.skillTaught = fact('Welding', 'unknown');
    mixed.facts.duration = fact('12 weeks', 'conflicting');
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one']));

    render(<CatalogueComparison items={[mixed]} />);

    await screen.findByRole('heading', { name: 'Welding pathway' });
    expect(screen.getByText((_, node) => node?.textContent === 'Status: unknown')).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === 'Status: conflicting')).toBeInTheDocument();
    expect(screen.getAllByText((_, node) => node?.textContent === 'Source date: 2026-09-20')).toHaveLength(7);
    expect(screen.getAllByRole('link', { name: /verify this fact/i })).toHaveLength(7);
  });

  it('keeps current and unavailable choices in a labelled stacked comparison region with native actions', async () => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one', 'retired:one']));

    render(<CatalogueComparison items={[item()]} />);

    await screen.findByRole('heading', { name: 'Welding pathway' });
    expect(screen.getByRole('region', { name: /saved opportunity comparison cards/i })).toHaveClass('grid', 'max-w-full', 'md:grid-cols-2');
    expect(screen.getByRole('article', { name: /welding pathway/i })).toHaveClass('min-w-0');
    expect(screen.getByRole('status', { name: /retired:one is unavailable/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification for welding pathway.*opens a new tab/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: /remove welding pathway/i })).toHaveAttribute('type', 'button');
    expect(screen.getAllByRole('link', { name: /verify this fact.*opens a new tab/i })).toHaveLength(7);
  });
});
