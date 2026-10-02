import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@vercel/blob/client', () => ({ uploadPresigned: jest.fn() }));

import ContributorMediaIntake from '@/components/contributor-media/ContributorMediaIntake';
import { uploadPresigned } from '@vercel/blob/client';

describe('ContributorMediaIntake', () => {
  it('keeps private package feedback actionable and rejects an unsupported local video', async () => {
    render(<ContributorMediaIntake programmes={[{ id: 'programme-1', name: 'Pilot programme' }]} initialStatus={{ status: 'Draft', revision: 1 }} />);
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: 'programme-1' } });
    fireEvent.change(screen.getByLabelText(/Original MP4 video/), { target: { files: [new File(['x'], 'clip.mov', { type: 'video/quicktime' })] } });
    fireEvent.change(screen.getByLabelText(/JPEG or PNG poster/), { target: { files: [new File(['x'], 'poster.png', { type: 'image/png' })] } });
    fireEvent.submit(screen.getByRole('button', { name: /prepare private upload/i }).closest('form')!);
    expect(await screen.findByText(/Action needed: use one MP4 video/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
  });

  it('shows a visible removal control for every non-final private lifecycle without browser storage', () => {
    render(<ContributorMediaIntake programmes={[]} initialStatus={{ status: 'Ready for review', revision: 2 }} />);

    expect(screen.getByRole('button', { name: /remove my submission/i })).toBeInTheDocument();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
  });

  it('replays the server-issued opaque revision for both private uploads and completion', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ capability: { uploadId: 'opaque-upload-id', revision: 7 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ submission: { status: 'Ready for review', revision: 8 } }),
      });
    global.fetch = fetchMock as typeof fetch;
    jest.mocked(uploadPresigned).mockResolvedValue({} as never);
    render(<ContributorMediaIntake programmes={[{ id: 'programme-1', name: 'Pilot programme' }]} initialStatus={{ status: 'Draft', revision: 1 }} />);
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: 'programme-1' } });
    fireEvent.change(screen.getByLabelText(/Original MP4 video/), { target: { files: [new File(['video'], 'clip.mp4', { type: 'video/mp4' })] } });
    fireEvent.change(screen.getByLabelText(/JPEG or PNG poster/), { target: { files: [new File(['poster'], 'poster.png', { type: 'image/png' })] } });
    fireEvent.submit(screen.getByRole('button', { name: /prepare private upload/i }).closest('form')!);

    await waitFor(() => expect(uploadPresigned).toHaveBeenCalledTimes(2));
    expect(JSON.parse(jest.mocked(uploadPresigned).mock.calls[0][2].clientPayload!)).toEqual({
      uploadId: 'opaque-upload-id', kind: 'video', expectedRevision: 7,
    });
    expect(JSON.parse(jest.mocked(uploadPresigned).mock.calls[1][2].clientPayload!)).toEqual({
      uploadId: 'opaque-upload-id', kind: 'poster', expectedRevision: 7,
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      uploadId: 'opaque-upload-id', expectedRevision: 7,
    });
    global.fetch = originalFetch;
  });
});
