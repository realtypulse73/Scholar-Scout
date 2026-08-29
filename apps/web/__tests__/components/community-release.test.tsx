import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityModerationQueue from '@/components/admin/CommunityModerationQueue';
import WesternNewYorkDirectory from '@/components/western-new-york/WesternNewYorkDirectory';
import type { WesternNewYorkInstitution } from '@/lib/western-new-york';

jest.mock('@/lib/platform', () => ({
  creatorProfiles: [{ schoolSlug: 'test-school', school: 'Tést School', username: 'student', displayName: 'Student', currentStage: 'Applying' }],
}));
jest.mock('@/lib/server/programme-records', () => ({
  getGovernedProgrammes: jest.fn(),
}));

const directoryInstitution: WesternNewYorkInstitution = {
  id: 'unicode-school',
  name: 'École de Buffalo',
  city: 'Buffalo',
  kind: 'college',
  officialUrl: 'https://example.edu',
  mediaUrl: 'https://example.edu/visit',
  admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Confirm programme requirements.', admissionsUrl: 'https://example.edu/apply' },
  logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm your route.' },
  accountability: { notice: 'Review official sources.', sources: [{ label: 'Official source — Études', url: 'https://example.edu/source', status: 'review-before-applying' }] },
  sourceCheckedOn: '2026-08-29',
};

const record = {
  noteId: 'pending-1',
  schoolSlug: 'buffalo-state',
  uploaderUsername: null,
  programId: null,
  excerpt: 'This is a long safe excerpt for staff review.',
  reportedAt: '2026-08-29T12:00:00.000Z',
};

describe('CommunityModerationQueue', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('renders a safe pending row with labelled restore and remove actions', () => {
    render(<CommunityModerationQueue initialRecords={[record]} />);

    expect(screen.getByRole('heading', { name: 'Community moderation' })).toBeInTheDocument();
    expect(screen.getByText(record.excerpt)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore to community' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove permanently' })).toBeInTheDocument();
    expect(screen.queryByText('student-private-id')).not.toBeInTheDocument();
  });

  it('confirms the safe restore action before resolving and removes only the successful row', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, status: 'restored' }),
    } as Response);
    render(<CommunityModerationQueue initialRecords={[record]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Restore to community' }));
    expect(screen.getByRole('dialog', { name: 'Restore to community' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore note' }));

    await waitFor(() => expect(screen.queryByText(record.excerpt)).not.toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/community-moderation', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ noteId: 'pending-1', action: 'restore' }),
    }));
  });

  it('keeps a conflicted row actionable and announces retry guidance', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'This note changed before it could be resolved. Refresh the queue and try again.' }),
    } as Response);
    render(<CommunityModerationQueue initialRecords={[record]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove permanently' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove note' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Refresh the queue and try again.'));
    expect(screen.getByText(record.excerpt)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove permanently' })).toBeEnabled();
  });

  it('renders the approved empty state', () => {
    render(<CommunityModerationQueue initialRecords={[]} />);

    expect(screen.getByRole('heading', { name: 'No notes need review' })).toBeInTheDocument();
    expect(screen.getByText('Reported notes will appear here for a restore or removal decision.')).toBeInTheDocument();
  });
});

describe('discovery release surfaces', () => {
  it('renders approved source guidance and labelled official links for WNY results', () => {
    render(<WesternNewYorkDirectory institutions={[directoryInstitution]} />);

    expect(screen.getByRole('heading', { name: 'Verify before applying' })).toBeInTheDocument();
    expect(screen.getByText('Use the official links on each listing to confirm programme requirements, deadlines, costs, support availability, and current policies directly with the institution.')).toBeInTheDocument();
    expect(screen.getByText('Check these details with the institution')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Official source — Études' })).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders the WNY recovery state when there are no institutions', () => {
    render(<WesternNewYorkDirectory institutions={[]} />);

    expect(screen.getByRole('heading', { name: 'No pathways match these priorities yet' })).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your access priorities, then use the official sources to compare options directly.')).toBeInTheDocument();
  });
});
