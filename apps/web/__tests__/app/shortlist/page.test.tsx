import { render, screen } from '@testing-library/react';
import ShortlistPage from '@/app/shortlist/page';
import { getServerSession } from 'next-auth';
import { getQualificationRecord } from '@/lib/server/data-store';
import { getPublishedCatalogueSnapshot } from '@/lib/server/programme-records';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });
jest.mock('@/lib/server/data-store', () => ({ getQualificationRecord: jest.fn() }));
jest.mock('@/lib/server/programme-records', () => ({ getPublishedCatalogueSnapshot: jest.fn() }));

const evidence = { status: 'current' as const, authority: 'provider-official' as const, sourceLabel: 'Shortlist official source', sourceUrl: 'https://example.edu/shortlist', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-20', verificationAction: 'Verify this requirement with Shortlist Academy.' };
const fact = <T,>(value: T) => ({ value, evidence });
const record: CataloguePublishedRecord = {
  id: 'shortlist-account-key', revision: 1, title: 'Shortlist Account Key Academy', regionId: 'greater-houston',
  region: { id: 'greater-houston', label: 'Greater Houston', officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' }, localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' } },
  source: { sourceLabel: 'Shortlist official source', sourceUrl: 'https://example.edu/shortlist', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-20' },
  facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school'), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person') },
  claimBoundary: 'Factual programme details from the official source.', mediaFallback: false,
  publishedRequirements: [{ text: 'A degree is required for this reviewed saved programme.', qualificationKeys: ['degree'], evidence }],
};

describe('ShortlistPage qualification composition', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.mocked(getServerSession).mockReset();
    jest.mocked(getQualificationRecord).mockReset();
    jest.mocked(getPublishedCatalogueSnapshot).mockResolvedValue({ status: 'published', snapshotId: 'snapshot-1', version: 1, records: [record] });
  });

  it('uses the active account namespace for the saved comparison explanation', async () => {
    window.localStorage.setItem('scholarscout.shortlist', JSON.stringify(['shortlist-account-key']));
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: 'student-one' } } as never);
    jest.mocked(getQualificationRecord).mockResolvedValue({ structured: ['degree'], keywords: [], note: 'private shortlist note' });

    render(await ShortlistPage());

    expect(await screen.findByText('A degree is required for this reviewed saved programme.')).toBeInTheDocument();
    expect(getQualificationRecord).toHaveBeenCalledWith('account:student-one');
    expect(getQualificationRecord).not.toHaveBeenCalledWith('account:student-two');
    expect(screen.queryByText('private shortlist note')).not.toBeInTheDocument();
  });

  it('does not read a qualification record for a guest comparison', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null);

    render(await ShortlistPage());

    expect(getQualificationRecord).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /browse reviewed opportunities/i })).toBeInTheDocument();
  });
});
