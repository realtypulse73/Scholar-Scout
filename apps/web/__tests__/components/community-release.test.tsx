import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityModerationQueue from '@/components/admin/CommunityModerationQueue';
import WesternNewYorkDirectory from '@/components/western-new-york/WesternNewYorkDirectory';
import type { WesternNewYorkInstitution } from '@/lib/western-new-york';
import SchoolLockerPage from '@/app/schools/[slug]/page';
import { getGovernedProgrammes } from '@/lib/server/programme-records';
import CampusNoteBoard from '@/components/campus-community/CampusNoteBoard';

jest.mock('@/lib/platform', () => ({
  creatorProfiles: [{ schoolSlug: 'test-school', school: 'Tést School', username: 'student', displayName: 'Student', currentStage: 'Applying' }],
}));
jest.mock('@/lib/server/programme-records', () => ({
  getGovernedProgrammes: jest.fn(),
}));
jest.mock('@/components/auth/AuthStatusLink', () => function AuthStatusLinkMock() {
  return <span>Account</span>;
});
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
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
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notes: [] }),
    } as Response);
  });

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

  it('renders a known school recovery state with verification guidance when it has no programmes', async () => {
    jest.mocked(getGovernedProgrammes).mockResolvedValue([]);

    render(await SchoolLockerPage({ params: Promise.resolve({ slug: 'test-school' }) }));

    expect(screen.getByRole('heading', { name: 'Verify programme details before you apply' })).toBeInTheDocument();
    expect(screen.getByText('Programme details can change. Open the official programme page to confirm requirements, delivery, cost, and deadlines.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No programme details are available for this school yet' })).toBeInTheDocument();
    expect(screen.getByText('Explore the student perspectives below and check the school’s official website for current programme information.')).toBeInTheDocument();
  });
});

describe('community submission and reporting', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('reports a public note only after a successful server response and announces the private confirmation', async () => {
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: [{ id: 'note-1', school_slug: 'test-school', uploader_username: null, program_id: null, body: 'Long Unicode note 漢字', created_at: '2026-08-29T12:00:00.000Z' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, message: 'Thanks for reporting this note. It is hidden from the community while staff review it.' }),
      } as Response);

    render(<CampusNoteBoard schoolSlug="test-school" />);

    await screen.findByText('Long Unicode note 漢字');
    fireEvent.click(screen.getByRole('button', { name: 'Report this note' }));
    expect(screen.getByRole('dialog', { name: 'Report this note' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm report' }));

    await waitFor(() => expect(screen.queryByText('Long Unicode note 漢字')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for reporting this note. It is hidden from the community while staff review it.');
  });

  it('retains a public note and report action when reporting fails', async () => {
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: [{ id: 'note-1', school_slug: 'test-school', uploader_username: null, program_id: null, body: 'Keep this note', created_at: '2026-08-29T12:00:00.000Z' }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'We couldn’t report this note. Please try again.' }),
      } as Response);

    render(<CampusNoteBoard schoolSlug="test-school" />);

    await screen.findByText('Keep this note');
    fireEvent.click(screen.getByRole('button', { name: 'Report this note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm report' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('We couldn’t report this note. Please try again.'));
    expect(screen.getByText('Keep this note')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report this note' })).toBeEnabled();
  });

  it('keeps the report dialog keyboard-contained and returns focus when cancelled', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notes: [{ id: 'note-1', school_slug: 'test-school', uploader_username: null, program_id: null, body: 'Keyboard-safe note', created_at: '2026-08-29T12:00:00.000Z' }] }),
    } as Response);

    render(<CampusNoteBoard schoolSlug="test-school" />);

    const reportButton = await screen.findByRole('button', { name: 'Report this note' });
    fireEvent.click(reportButton);
    const dialog = screen.getByRole('dialog', { name: 'Report this note' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm report' });

    await waitFor(() => expect(cancel).toHaveFocus());
    confirm.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(reportButton).toHaveFocus());
  });

  it('returns focus to the reported note that failed, not another note', async () => {
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: [
          { id: 'note-1', school_slug: 'test-school', uploader_username: null, program_id: null, body: 'First public note', created_at: '2026-08-29T12:00:00.000Z' },
          { id: 'note-2', school_slug: 'test-school', uploader_username: null, program_id: null, body: 'Second public note', created_at: '2026-08-29T12:00:00.000Z' },
        ] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'This note changed before it could be reported. Refresh and try again.' }),
      } as Response);

    render(<CampusNoteBoard schoolSlug="test-school" />);

    await screen.findByText('First public note');
    const reportButtons = screen.getAllByRole('button', { name: 'Report this note' });
    fireEvent.click(reportButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm report' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Refresh and try again.'));
    await waitFor(() => expect(reportButtons[0]).toHaveFocus());
    expect(reportButtons[1]).not.toHaveFocus();
  });
});
