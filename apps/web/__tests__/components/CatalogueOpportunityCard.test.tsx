import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CatalogueOpportunityCard from '@/components/catalogue/CatalogueOpportunityCard';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';
import type { QualificationExplanation } from '@/lib/qualification-lens';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

const item: CatalogueDiscoveryItem = {
  id: 'catalogue:one',
  providerTitle: 'Northside Welding Institute',
  regionId: 'greater-houston',
  regionLabel: 'Greater Houston',
  pathway: 'trade-career-school',
  place: fact('Houston, Texas', 'current'),
  delivery: fact('in-person' as const, 'current'),
  facts: {
    skillTaught: fact('Welding', 'current'),
    trainingPayer: fact('Student', 'needs-confirmation'),
    costOrTuition: fact('$500', 'current'),
    duration: fact('12 weeks', 'unknown'),
  },
  reasonsToConsider: [{
    label: 'Skill taught',
    value: 'Welding',
    state: 'current',
    evidence: fact('Welding', 'current').evidence,
  }],
  factState: 'needs-confirmation',
  source: { label: 'Northside official catalogue', date: '2026-09-20', state: 'current' },
  officialVerificationUrl: 'https://example.edu/welding',
  mediaState: 'reserved-for-rights-review',
};

function fact<T extends string>(value: T, state: CatalogueDiscoveryItem['factState']) {
  return {
    value,
    state,
    evidence: {
      status: state,
      authority: 'provider-official' as const,
      sourceLabel: 'Northside official catalogue',
      sourceUrl: 'https://example.edu/welding',
      sourceDate: { state: 'documented' as const, value: '2026-09-20' },
      reviewedAt: '2026-09-21',
      verificationAction: 'Confirm this detail directly with Northside.',
    },
  };
}

describe('CatalogueOpportunityCard', () => {
  it('keeps source-first factual actions and facts needing verification visible', () => {
    render(<CatalogueOpportunityCard item={item} filters={{ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }} />);

    expect(screen.getByRole('heading', { name: /northside welding institute/i })).toBeInTheDocument();
    expect(screen.getByText(/cost or tuition/i)).toBeInTheDocument();
    expect(screen.getByText(/northside official catalogue.*2026-09-20.*current/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification/i })).toHaveAttribute('href', 'https://example.edu/welding');
    expect(screen.getByRole('link', { name: /see all facts and sources/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
    expect(screen.getByRole('region', { name: /facts to verify/i })).toHaveTextContent(/training payer/i);
    expect(screen.getByRole('link', { name: /alternate routes/i })).toHaveAttribute('href', expect.stringContaining('pathway=university'));
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open comparison/i })).toHaveAttribute('href', '/shortlist');
  });

  it('uses named native actions and a wrapping card layout without color-only fact states', () => {
    render(<CatalogueOpportunityCard item={item} filters={{ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }} />);

    expect(screen.getByRole('article', { name: /northside welding institute/i })).toHaveClass('min-w-0', 'max-w-full');
    expect(screen.getByText(/facts: needs confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('link', { name: /official verification for northside welding institute.*opens a new tab/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /see all facts and sources for northside welding institute/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
    expect(screen.getByTestId('catalogue-card-actions')).toHaveClass('flex-wrap');
  });

  it('shows one source-backed factual reason with a direct fact source separate from details', () => {
    render(<CatalogueOpportunityCard item={item} filters={{ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }} />);

    expect(screen.getByRole('region', { name: /reason to consider/i })).toHaveTextContent(/skill taught.*welding/i);
    expect(screen.getByRole('region', { name: /reason to consider/i })).toHaveTextContent(/current.*northside official catalogue.*2026-09-20/i);
    expect(screen.getByRole('region', { name: /reason to consider/i })).toHaveTextContent(/confirm this detail directly with northside/i);
    expect(screen.getByRole('link', { name: /open source for skill taught.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/welding');
    expect(screen.getByRole('link', { name: /see all facts and sources/i })).toHaveAttribute('href', '/programmes/catalogue%3Aone?metro=greater-houston');
  });

  it('renders a checked published requirement before general reasons with a direct verification action', () => {
    const qualificationExplanation: QualificationExplanation = {
      checkedRequirements: [{
        label: 'Checked published requirement',
        text: 'A high school diploma or equivalent is required.',
        qualificationKeys: ['diploma-credits'],
        evidence: fact('Welding', 'current').evidence,
      }],
      keywordConnections: [],
      verificationRows: [],
    };

    render(<CatalogueOpportunityCard item={item} filters={{ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }} qualificationExplanation={qualificationExplanation} />);

    const explanation = screen.getByRole('region', { name: /qualification details/i });
    expect(explanation).toHaveTextContent('1 published requirement checked');
    expect(explanation).toHaveTextContent('A high school diploma or equivalent is required.');
    expect(screen.getByRole('link', { name: /verify a high school diploma or equivalent is required.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/welding');
    expect(explanation.compareDocumentPosition(screen.getByRole('region', { name: /reason to consider/i })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toBeInTheDocument();
  });

  it('keeps keyword, uncertainty, and documented support factual while revealing extra requirement details on request', async () => {
    const user = userEvent.setup();
    const qualificationExplanation: QualificationExplanation = {
      checkedRequirements: [
        'A high school diploma or equivalent is required.',
        'A current licence is required for this long reviewed training route.',
        'Prior work experience is listed in the reviewed programme requirements.',
      ].map((text) => ({
        label: 'Checked published requirement' as const,
        text,
        qualificationKeys: ['diploma-credits'],
        evidence: fact('Welding', 'current').evidence,
      })),
      keywordConnections: [{
        label: 'Keyword connection',
        keyword: 'welding',
        text: 'Hands-on welding instruction for entry-level learners.',
        source: 'reviewed-description',
        evidence: fact('Welding', 'current').evidence,
      }],
      verificationRows: [{
        label: 'Needs verification',
        text: 'A dated requirement needs a current source.',
        state: 'needs-confirmation',
        sourceDate: '2026-09-20',
        evidence: fact('Welding', 'needs-confirmation').evidence,
      }],
      documentedSupport: {
        label: 'Documented support',
        text: 'career advising',
        sourceDate: '2026-09-20',
        evidence: fact('Welding', 'current').evidence,
      },
    };

    render(<CatalogueOpportunityCard item={item} filters={{ metro: 'greater-houston', pathway: 'all', delivery: 'all', status: 'all', q: '', page: 1 }} qualificationExplanation={qualificationExplanation} />);

    expect(screen.getByText('Keyword connection: welding appears in this reviewed text.')).toBeInTheDocument();
    expect(screen.getByLabelText('Needs verification')).toBeInTheDocument();
    expect(screen.getByText(/this programme lists career advising.*ask the programme/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show details' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Prior work experience is listed in the reviewed programme requirements.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show details' }));

    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Prior work experience is listed in the reviewed programme requirements.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /verify this requirement.*opens a new tab/i })).toBeInTheDocument();
  });
});
