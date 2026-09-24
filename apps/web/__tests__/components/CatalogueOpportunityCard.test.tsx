import { render, screen } from '@testing-library/react';
import CatalogueOpportunityCard from '@/components/catalogue/CatalogueOpportunityCard';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';

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
});
