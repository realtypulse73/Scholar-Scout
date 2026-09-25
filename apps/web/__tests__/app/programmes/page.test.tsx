import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgrammesPage from '@/app/programmes/page';
import { getServerSession } from 'next-auth';
import { getQualificationRecord } from '@/lib/server/data-store';
import { getPublishedCatalogueSnapshot } from '@/lib/server/programme-records';
import type { CataloguePublishedRecord } from '@/lib/catalogue-publication';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/auth', () => ({ authOptions: {} }), { virtual: true });
jest.mock('@/lib/server/data-store', () => ({ getQualificationRecord: jest.fn() }));
jest.mock('@/lib/server/programme-records', () => ({ getPublishedCatalogueSnapshot: jest.fn() }));

const record: CataloguePublishedRecord = {
  id: 'account-key-welding', revision: 1, title: 'Account Key Welding Academy', regionId: 'greater-houston',
  region: { id: 'greater-houston', label: 'Greater Houston', officialBoundary: { authority: 'us-census-omb-cbsa', boundaryId: '26420', boundaryVersion: '2023', sourceLabel: 'Boundary source', sourceUrl: 'https://example.edu/boundary', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' }, localFocus: { authority: 'City', anchorLabel: 'City Hall', latitude: 29.76, longitude: -95.36, radiusMiles: 10, sourceLabel: 'City source', sourceUrl: 'https://example.edu/city', sourceDate: { state: 'documented', value: '2026-09-01' }, checkedAt: '2026-09-20' } },
  source: { sourceLabel: 'Account Key official source', sourceUrl: 'https://example.edu/welding', sourceDate: { state: 'documented', value: '2026-09-20' }, checkedAt: '2026-09-20' },
  facts: { location: fact('Houston, Texas'), pathway: fact('trade-career-school'), skillTaught: fact('Welding'), trainingPayer: fact('Student'), costOrTuition: fact('$500'), duration: fact('12 weeks'), delivery: fact('in-person') },
  claimBoundary: 'Factual programme details from the official source.', mediaFallback: false,
  publishedRequirements: [{ text: 'A degree is required for this reviewed welding programme.', qualificationKeys: ['degree'], evidence: evidence() }],
};

function evidence() {
  return { status: 'current' as const, authority: 'provider-official' as const, sourceLabel: 'Account Key official source', sourceUrl: 'https://example.edu/welding', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-20', verificationAction: 'Verify this requirement with Account Key.' };
}

function fact<T>(value: T) { return { value, evidence: evidence() }; }

describe('ProgrammesPage qualification composition', () => {
  const getSessionMock = jest.mocked(getServerSession);
  const getQualificationRecordMock = jest.mocked(getQualificationRecord);
  const getSnapshotMock = jest.mocked(getPublishedCatalogueSnapshot);

  beforeEach(() => {
    getSnapshotMock.mockResolvedValue({ status: 'published', snapshotId: 'snapshot-1', version: 1, records: [record] });
    getQualificationRecordMock.mockReset();
    getSessionMock.mockReset();
  });

  it('uses the active account namespace and renders its reviewed checked requirement', async () => {
    const user = userEvent.setup();
    getSessionMock.mockResolvedValue({ user: { id: 'student-one' } } as never);
    getQualificationRecordMock.mockResolvedValue({ structured: ['degree'], keywords: [], note: 'private student note' });

    render(await ProgrammesPage({ searchParams: Promise.resolve({ metro: 'greater-houston' }) }));
    await user.click(screen.getByRole('radio', { name: 'Qualifications first' }));

    expect(getQualificationRecordMock).toHaveBeenCalledWith('account:student-one');
    expect(getQualificationRecordMock).not.toHaveBeenCalledWith('account:student-two');
    expect(screen.getByText('A degree is required for this reviewed welding programme.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /verify a degree is required.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/welding');
    expect(screen.queryByText('private student note')).not.toBeInTheDocument();
  });

  it('does not read a qualification record for an anonymous session', async () => {
    getSessionMock.mockResolvedValue(null);

    render(await ProgrammesPage({ searchParams: Promise.resolve({ metro: 'greater-houston' }) }));

    expect(getQualificationRecordMock).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /account key welding academy/i })).toBeInTheDocument();
  });
});
