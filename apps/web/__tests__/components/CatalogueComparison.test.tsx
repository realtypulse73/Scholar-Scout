import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CatalogueComparison from '@/components/catalogue/CatalogueComparison';
import {
  buildCatalogueDetailHref,
  type CatalogueDiscoveryItem,
} from '@/lib/catalogue-discovery';
import type { CatalogueRegionId } from '@/lib/catalogue-contract';
import type { QualificationExplanation } from '@/lib/qualification-lens';

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

const item = (
  id = 'catalogue:one',
  title = 'Welding pathway',
  regionId: CatalogueRegionId = 'greater-houston',
): CatalogueDiscoveryItem => ({
  id,
  providerTitle: title,
  regionId,
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
  reasonsToConsider: [{
    label: 'Skill taught',
    value: 'Welding',
    state: 'current',
    evidence: fact('Welding').evidence,
  }],
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
    expect(screen.getAllByText('Welding')).toHaveLength(2);
    expect(screen.getByText(/needs confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /details for welding pathway/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
    expect(screen.getByRole('link', { name: /official verification for welding pathway/i })).toHaveAttribute('href', 'https://example.edu/programme');
    expect(screen.getByRole('button', { name: /remove welding pathway/i })).toBeInTheDocument();
    expect(screen.queryByText(/best|winner|eligible|fit/i)).not.toBeInTheDocument();
  });

  it('renders the shared factual qualification explanation without changing saved choice actions', async () => {
    const user = userEvent.setup();
    const qualificationExplanation: QualificationExplanation = {
      hasQualificationInput: true,
      hasPublishedRequirements: true,
      checkedRequirements: [
        'A high school diploma or equivalent is required for this long reviewed training pathway.',
        'A current licence is listed in this reviewed programme requirement.',
        'Prior work experience is listed in the reviewed programme requirement.',
      ].map((text) => ({
        label: 'Checked published requirement' as const,
        text,
        qualificationKeys: ['diploma-credits'],
        evidence: evidence(),
      })),
      keywordConnections: [{
        label: 'Keyword connection',
        keyword: 'welding',
        text: 'Hands-on welding instruction appears in this reviewed description.',
        source: 'reviewed-description',
        evidence: evidence(),
      }],
      verificationRows: [{
        label: 'Needs verification',
        text: 'A dated requirement needs a current source.',
        state: 'unknown',
        sourceDate: '2026-09-20',
        evidence: evidence('unknown'),
      }],
      documentedSupport: {
        label: 'Documented support',
        text: 'career advising with a long reviewed support description',
        sourceDate: '2026-09-20',
        evidence: evidence(),
      },
    };
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one']));

    render(<CatalogueComparison items={[item()]} qualificationExplanations={{ 'catalogue:one': qualificationExplanation }} />);

    await screen.findByRole('heading', { name: 'Welding pathway' });
    const explanation = screen.getByRole('region', { name: /qualification details/i });
    expect(explanation).toHaveTextContent('3 published requirements checked');
    expect(explanation).toHaveTextContent('Keyword connection: welding appears in this reviewed text.');
    expect(explanation).toHaveTextContent('Needs verification');
    expect(explanation).toHaveTextContent(/this programme lists career advising with a long reviewed support description/i);
    expect(explanation).toHaveClass('min-w-0');
    expect(screen.getByLabelText('Needs verification').parentElement?.parentElement).toHaveClass('border-blue-300', 'bg-blue-50');
    expect(screen.getByRole('button', { name: 'Show details' })).toHaveAttribute('aria-expanded', 'false');

    screen.getByRole('button', { name: 'Show details' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Prior work experience is listed in the reviewed programme requirement.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /verify a high school diploma or equivalent.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/programme');
    expect(screen.getByRole('link', { name: /details for welding pathway/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification for welding pathway/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove welding pathway/i })).toBeInTheDocument();
    expect(explanation.textContent?.toLocaleLowerCase()).not.toMatch(/eligible|admission|outcome|safe|salary|note|score/);
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
    expect(screen.getAllByText((_, node) => node?.textContent === 'Source date: 2026-09-20')).toHaveLength(8);
    expect(screen.getAllByRole('link', { name: /verify this fact/i })).toHaveLength(8);
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
    expect(screen.getAllByRole('link', { name: /verify this fact.*opens a new tab/i })).toHaveLength(8);
  });

  it('renders every saved factual reason with its complete evidence', async () => {
    const reviewed = item();
    reviewed.reasonsToConsider = [
      { label: 'Skill taught', value: 'Welding', state: 'current', evidence: evidence() },
      { label: 'Training payer', value: 'Student', state: 'needs-confirmation', evidence: evidence('needs-confirmation') },
    ];
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one']));

    render(<CatalogueComparison items={[reviewed]} />);

    const reasons = await screen.findByRole('region', { name: /factual reasons to consider for welding pathway/i });
    expect(reasons).toHaveTextContent(/skill taught.*welding/i);
    expect(reasons).toHaveTextContent(/training payer.*student/i);
    expect(reasons).toHaveTextContent(/needs confirmation.*official programme source.*2026-09-20/i);
    expect(reasons).toHaveTextContent(/verify on the official programme page/i);
    expect(screen.getAllByRole('link', { name: /verify this fact.*opens a new tab/i })).toHaveLength(9);
  });

  it.each([
    'greater-houston',
    'greater-chicago',
    'greater-buffalo',
    'greater-atlanta',
    'greater-new-orleans',
    'greater-kingston-jamaica',
  ] as CatalogueRegionId[])('builds the controlled %s detail URL for its saved record', async (regionId) => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['catalogue:one']));

    render(<CatalogueComparison items={[item('catalogue:one', 'Welding pathway', regionId)]} />);

    expect(await screen.findByRole('link', { name: /details for welding pathway/i })).toHaveAttribute(
      'href',
      buildCatalogueDetailHref('catalogue:one', { metro: regionId, pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }),
    );
  });
});
