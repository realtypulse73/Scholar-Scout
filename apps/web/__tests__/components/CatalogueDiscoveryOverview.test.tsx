import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CatalogueDiscoveryOverview from '@/components/catalogue/CatalogueDiscoveryOverview';
import { buildCatalogueDiscoveryModel } from '@/lib/catalogue-discovery';
import { buildQualificationLensModel } from '@/lib/qualification-lens';
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
  publishedRequirements: [{
    text: 'A high school diploma or equivalent is required.',
    qualificationKeys: ['diploma-credits'],
    evidence,
  }],
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
    expect(screen.getByRole('article', { name: /welding pathway/i })).toBeInTheDocument();

    rerender(<CatalogueDiscoveryOverview model={model} qualificationLensState="error" />);

    expect(screen.getByText('Qualifications first is unavailable right now. You can still browse every opportunity.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry qualifications first' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Normal catalogue' })).toBeChecked();
  });
});
