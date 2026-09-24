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
  delivery: fact('in-person', 'current'),
  facts: {
    skillTaught: fact('Welding', 'current'),
    trainingPayer: fact('Student', 'needs-confirmation'),
    costOrTuition: fact('$500', 'current'),
    duration: fact('12 weeks', 'unknown'),
  },
  factState: 'needs-confirmation',
  source: { label: 'Northside official catalogue', date: '2026-09-20', state: 'current' },
  officialVerificationUrl: 'https://example.edu/welding',
  mediaState: 'reserved-for-rights-review',
};

function fact(value: string, state: CatalogueDiscoveryItem['factState']) {
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
    expect(screen.getByText(/facts to verify/i)).toHaveTextContent(/training payer/i);
    expect(screen.getByRole('link', { name: /alternate routes/i })).toHaveAttribute('href', expect.stringContaining('pathway=university'));
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open comparison/i })).toHaveAttribute('href', '/shortlist');
  });
});
