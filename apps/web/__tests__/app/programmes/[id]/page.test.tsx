import { render, screen } from '@testing-library/react';
import ProgrammeDetailPage, { generateMetadata } from '@/app/programmes/[id]/page';
import { getServerSession } from 'next-auth';
import { getQualificationRecord } from '@/lib/server/data-store';
import { getPublishedCatalogueSnapshot } from '@/lib/server/programme-records';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });
jest.mock('@/lib/server/data-store', () => ({ getQualificationRecord: jest.fn() }));
jest.mock('next/navigation', () => ({ notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }) }));
jest.mock('@/lib/server/programme-records', () => ({ getPublishedCatalogueSnapshot: jest.fn() }));

const snapshotRecord: CataloguePublishedRecord = {
  id: 'snapshot-only-id', revision: 1, title: 'Snapshot Only Academy', regionId: 'greater-houston',
  region: { id: 'greater-houston', label: 'Greater Houston', officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' }, localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' } },
  source: { sourceLabel: 'Snapshot official source', sourceUrl: 'https://example.edu/snapshot', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-20' },
  facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school'), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person') },
  claimBoundary: 'Factual programme details from the official source.', mediaFallback: false,
  publishedRequirements: [{ text: 'A degree is required for this reviewed detail programme.', qualificationKeys: ['degree'], evidence: fact('Welding').evidence }],
};

const buffaloSnapshotRecord: CataloguePublishedRecord = {
  ...snapshotRecord,
  id: 'buffalo-reviewed-id',
  title: 'Buffalo Reviewed Academy',
  regionId: 'greater-buffalo',
  region: {
    ...snapshotRecord.region,
    id: 'greater-buffalo',
    label: 'Greater Buffalo',
  },
  facts: {
    ...snapshotRecord.facts,
    location: fact('Buffalo, New York'),
  },
};

function fact<T>(value: T) { return { value, evidence: { status: 'current' as const, authority: 'provider-official' as const, sourceLabel: 'Snapshot official source', sourceUrl: 'https://example.edu/snapshot', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-20', verificationAction: 'Verify with the official source.' } }; }

describe('programme detail page', () => {
  beforeEach(() => {
    jest.mocked(getServerSession).mockReset();
    jest.mocked(getQualificationRecord).mockReset();
    jest.mocked(getPublishedCatalogueSnapshot).mockResolvedValue({ status: 'published', snapshotId: 'snapshot-1', version: 1, records: [snapshotRecord, buffaloSnapshotRecord] });
  });

  it('uses a snapshot record absent from legacy seeds for page and metadata', async () => {
    render(await ProgrammeDetailPage({ params: Promise.resolve({ id: 'snapshot-only-id' }), searchParams: Promise.resolve({ metro: 'greater-houston' }) }));
    expect(screen.getByRole('heading', { name: /snapshot only academy/i })).toBeInTheDocument();
    await expect(generateMetadata({ params: Promise.resolve({ id: 'snapshot-only-id' }) })).resolves.toMatchObject({ title: 'Snapshot Only Academy | Scholar Scout' });
  });

  it('uses only the active account namespace for a source-backed qualification explanation', async () => {
    jest.mocked(getServerSession).mockResolvedValue({ user: { id: 'student-one' } } as never);
    jest.mocked(getQualificationRecord).mockResolvedValue({ structured: ['degree'], keywords: [], note: 'private detail note' });

    render(await ProgrammeDetailPage({ params: Promise.resolve({ id: 'snapshot-only-id' }), searchParams: Promise.resolve({ metro: 'greater-houston' }) }));

    expect(getQualificationRecord).toHaveBeenCalledWith('account:student-one');
    expect(getQualificationRecord).not.toHaveBeenCalledWith('account:student-two');
    expect(screen.getByText('A degree is required for this reviewed detail programme.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /verify a degree is required.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/snapshot');
    expect(screen.queryByText('private detail note')).not.toBeInTheDocument();
  });

  it('keeps guest detail browsing factual without a qualification lookup', async () => {
    jest.mocked(getServerSession).mockResolvedValue(null);

    render(await ProgrammeDetailPage({ params: Promise.resolve({ id: 'snapshot-only-id' }), searchParams: Promise.resolve({ metro: 'greater-houston' }) }));

    expect(getQualificationRecord).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /official verification/i })).toBeInTheDocument();
  });

  it('does not fall back to a legacy seed-only ID', async () => {
    await expect(ProgrammeDetailPage({ params: Promise.resolve({ id: 'buffalo-state-community-health' }), searchParams: Promise.resolve({ metro: 'greater-houston' }) })).rejects.toThrow('NOT_FOUND');
    await expect(generateMetadata({ params: Promise.resolve({ id: 'buffalo-state-community-health' }) })).resolves.toMatchObject({ title: 'Opportunity Not Found | Scholar Scout' });
  });

  it('resolves a reviewed non-Houston record when its controlled metro is supplied', async () => {
    render(await ProgrammeDetailPage({ params: Promise.resolve({ id: 'buffalo-reviewed-id' }), searchParams: Promise.resolve({ metro: 'greater-buffalo' }) }));

    expect(screen.getByRole('heading', { name: /buffalo reviewed academy/i })).toBeInTheDocument();
    expect(screen.getByText(/greater buffalo.*buffalo, new york/i)).toBeInTheDocument();
  });
});
