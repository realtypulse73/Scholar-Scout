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

  it('requires the local adult attestation before calling the existing route', async () => {
    const fetchMock = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchMock as typeof fetch;
    render(<ContributorMediaIntake programmes={[]} initialStatus={null} />);

    expect(screen.getByLabelText('Signer name')).toBeInTheDocument();
    expect(screen.getByLabelText(/I am 18 or older/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I created this material/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consent from every recognisable person/i)).toBeInTheDocument();

    fireEvent.submit(screen.getByRole('button', { name: /continue to private upload/i }).closest('form')!);

    expect(await screen.findByText(/complete every attestation field/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
    global.fetch = originalFetch;
  });

  it('posts only the existing attestation contract and reveals the uploader after a Draft response', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ submission: { status: 'Draft', revision: 4 } }),
    });
    global.fetch = fetchMock as typeof fetch;
    render(<ContributorMediaIntake programmes={[{ id: 'programme-1', name: 'Pilot programme' }]} initialStatus={null} />);

    fireEvent.change(screen.getByLabelText('Signer name'), { target: { value: 'Jordan Scout' } });
    fireEvent.click(screen.getByLabelText(/I am 18 or older/i));
    fireEvent.click(screen.getByLabelText(/I created this material/i));
    fireEvent.click(screen.getByLabelText(/consent from every recognisable person/i));
    fireEvent.submit(screen.getByRole('button', { name: /continue to private upload/i }).closest('form')!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/contributor-media/attestation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        adultAffirmed: true,
        signerName: 'Jordan Scout',
        creatorAuthority: true,
        recognisablePeopleConsent: true,
      }),
    });
    expect(await screen.findByLabelText('Programme')).toBeInTheDocument();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
    global.fetch = originalFetch;
  });

  it('keeps a safe rejected attestation response actionable without revealing upload controls', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Contributor invitation required.' }),
    });
    global.fetch = fetchMock as typeof fetch;
    render(<ContributorMediaIntake programmes={[]} initialStatus={null} />);

    fireEvent.change(screen.getByLabelText('Signer name'), { target: { value: 'Jordan Scout' } });
    fireEvent.click(screen.getByLabelText(/I am 18 or older/i));
    fireEvent.click(screen.getByLabelText(/I created this material/i));
    fireEvent.click(screen.getByLabelText(/consent from every recognisable person/i));
    fireEvent.submit(screen.getByRole('button', { name: /continue to private upload/i }).closest('form')!);

    expect(await screen.findByText(/Contributor invitation required/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Programme')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('contributor-media')).toBeNull();
    global.fetch = originalFetch;
  });
});
