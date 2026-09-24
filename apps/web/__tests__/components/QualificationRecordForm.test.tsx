import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QualificationRecordForm from '@/components/qualifications/QualificationRecordForm';

const savedRecord = {
  structured: ['degree'],
  note: 'I completed an associate degree.',
  keywords: ['information technology'],
};

function response(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('QualificationRecordForm', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    global.fetch = fetchMock as typeof fetch;
  });

  it('loads private qualifications and adds a keyword only after the explicit action', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(response({ record: savedRecord }));
    render(<QualificationRecordForm />);

    await screen.findByText('Private qualifications loaded.');
    expect(screen.getByLabelText('Private note (32/500)')).toHaveValue(savedRecord.note);
    await user.type(screen.getByLabelText('Student-confirmed keywords'), ' nursing ');
    expect(screen.queryByText('nursing')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add keyword' }));

    expect(screen.getByRole('button', { name: 'Remove keyword nursing' })).toBeInTheDocument();
    expect(screen.getByText(/Private to your account/)).toBeInTheDocument();
    expect(window.localStorage).toHaveLength(0);
  });

  it('requires confirmation before clearing and sends only the approved empty record', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(response({ record: savedRecord }))
      .mockResolvedValueOnce(response({ ok: true }));
    render(<QualificationRecordForm />);

    await screen.findByText('Private qualifications loaded.');
    await user.click(screen.getByRole('button', { name: 'Clear saved qualifications' }));
    expect(screen.getByRole('dialog', { name: 'Clear saved qualifications' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Clear qualifications' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/account/qualifications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ structured: [], note: '', keywords: [] }),
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Qualifications cleared.');
  });

  it('keeps a draft and offers a reload after a save conflict', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(response({ record: { structured: [], note: '', keywords: [] } }))
      .mockResolvedValueOnce(response({ error: 'conflict' }, false, 409));
    render(<QualificationRecordForm />);

    await screen.findByText('No qualifications saved yet.');
    const note = screen.getByLabelText('Private note (0/500)');
    await user.type(note, 'Keep this draft.');
    await user.click(screen.getByRole('button', { name: 'Save qualifications' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('your draft is still here');
    expect(note).toHaveValue('Keep this draft.');
    expect(screen.getByRole('button', { name: 'Reload saved qualifications' })).toBeInTheDocument();
  });

  it('keeps the existing record visible and explains a failed clear', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(response({ record: savedRecord }))
      .mockResolvedValueOnce(response({ error: 'unavailable' }, false, 503));
    render(<QualificationRecordForm />);

    await screen.findByText('Private qualifications loaded.');
    await user.click(screen.getByRole('button', { name: 'Clear saved qualifications' }));
    await user.click(screen.getByRole('button', { name: 'Clear qualifications' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('could not clear');
    expect(screen.getByLabelText('Private note (32/500)')).toHaveValue(savedRecord.note);
    expect(screen.getByRole('status')).toHaveTextContent('Qualifications were not cleared.');
  });
});
