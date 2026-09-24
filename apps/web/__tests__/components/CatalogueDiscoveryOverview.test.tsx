import { render, screen } from '@testing-library/react';
import CatalogueDiscoveryOverview from '@/components/catalogue/CatalogueDiscoveryOverview';
import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

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
};

describe('CatalogueDiscoveryOverview', () => {
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
});
