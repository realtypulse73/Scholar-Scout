import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PreviewOwnerMediaDemo from '@/components/admin/PreviewOwnerMediaDemo';

describe('PreviewOwnerMediaDemo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('shows the labelled owner-only Preview control and performs a bodyless mutation', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ available: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reconciliation: null }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 'ready' }) }) as never;

    render(<PreviewOwnerMediaDemo />);

    expect(await screen.findByRole('heading', { name: /Preview-only original test media/i })).toBeInTheDocument();
    expect(screen.getByText(/does not enable student uploads or suggest provider endorsement/i)).toBeInTheDocument();
    expect(screen.getByText(/independent review and publication/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create my Preview invitation/i }));

    expect(await screen.findByText(/invitation is ready/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue to contributor media/i })).toHaveAttribute(
      'href',
      '/contribute/media',
    );
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/admin/contributor-media/preview-demo', {
      method: 'POST',
    });
  });

  it('requires an explicit approved candidate selection before linking an existing private package', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ available: true }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          reconciliation: {
            submissionId: 'submission-1', expectedRevision: 3, programmeId: 'legacy-programme-id',
            candidates: [{ id: 'candidate-htu', title: 'Houston Tillotson University' }],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ submission: { status: 'Ready for review', revision: 4 } }) }) as never;

    render(<PreviewOwnerMediaDemo />);

    const select = await screen.findByLabelText(/approved catalogue record/i);
    expect(screen.getByRole('button', { name: /link private package for review/i })).toBeDisabled();
    fireEvent.change(select, { target: { value: 'candidate-htu' } });
    fireEvent.click(screen.getByRole('button', { name: /link private package for review/i }));

    expect(await screen.findByText(/private package linked/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/admin/contributor-media/preview-demo/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: 'submission-1', expectedRevision: 3, candidateId: 'candidate-htu' }),
    });
  });

  it('does not reveal the control when the server reports generic absence', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as never;

    render(<PreviewOwnerMediaDemo />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /create my Preview invitation/i })).not.toBeInTheDocument();
    });
  });
});
