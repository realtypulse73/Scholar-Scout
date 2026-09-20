import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvisorChat from '@/components/advisor/AdvisorChat';

describe('AdvisorChat', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
    });
    global.fetch = fetchMock as typeof fetch;
    window.localStorage.clear();
  });

  it('sends exactly the student message and renders safe success and crisis replies', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reply: 'Compare each official cost page.', fallback: false, crisis: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ reply: 'Please contact emergency support now.', fallback: false, crisis: true }),
      });
    const user = userEvent.setup();

    render(<AdvisorChat />);
    const input = screen.getByPlaceholderText('Ask about fit, risk, cost, or next steps');
    await user.type(input, '  What should I compare?  ');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/advisor-chat', expect.objectContaining({
        body: JSON.stringify({ message: 'What should I compare?' }),
      }));
    });
    expect(await screen.findByText('Compare each official cost page.')).toBeInTheDocument();

    await user.type(input, 'I need urgent help');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Please contact emergency support now.')).toBeInTheDocument();
  });

  it('renders validation, reset-aware quota, unavailable, and fallback states without diagnostics', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: 'Message must be valid.' }) })
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: 'Daily limit reached.', resetAt: '2026-07-29T00:00:00.000Z' }) })
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'Advisor unavailable.' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ reply: 'Safe fallback.', fallback: true, crisis: false }) });
    const user = userEvent.setup();

    render(<AdvisorChat />);
    const input = screen.getByPlaceholderText('Ask about fit, risk, cost, or next steps');
    await user.type(input, 'one');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Message must be valid.')).toBeInTheDocument();

    await user.type(input, 'two');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/Daily limit reached/)).toBeInTheDocument();
    expect(screen.getByText(/Try again after/)).toBeInTheDocument();

    await user.type(input, 'three');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/not available right now/)).toBeInTheDocument();

    await user.type(input, 'four');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Safe fallback.')).toBeInTheDocument();
    expect(screen.getByText(/safe general next step/)).toBeInTheDocument();
  });
});
