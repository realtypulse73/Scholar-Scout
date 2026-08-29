import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommunityModerationQueue from '@/components/admin/CommunityModerationQueue';

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
