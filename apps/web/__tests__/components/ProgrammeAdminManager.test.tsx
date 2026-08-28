import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgrammeAdminManager from '@/components/admin/ProgrammeAdminManager';

const counts = { users: 4, onboardingProfiles: 3, shortlists: 2, programmeRecords: 1, auditEvents: 5 };
const capabilities = {
  health: 'healthy', adapter: 'vercel-blob', lastVerifiedAt: '2026-08-28T13:00:00.000Z', counts,
  operations: [
    { id: 'status', available: true, allowedAction: 'view', reason: 'available', retryable: false },
    { id: 'backup-list', available: true, allowedAction: 'view', reason: 'available', retryable: false },
    { id: 'import-validate', available: true, allowedAction: 'validate', reason: 'available', retryable: false },
  ],
};
const backups = [{
  id: 'backup-long-identifier-1234567890', createdAt: '2026-08-28T12:00:00.000Z',
  actorUserId: 'staff-1', reason: 'pre-restore', counts,
  incidentHold: { incidentId: 'incident-long-identifier-1234567890', status: 'unresolved', createdAt: '2026-08-28T12:05:00.000Z' },
}];

function response(body: unknown, ok = true, status = ok ? 200 : 503) {
  return { ok, status, json: async () => body } as Response;
}

function installFetch(options: { capabilities?: Response; backups?: Response } = {}) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === '/api/admin/programmes') return response({ records: [], auditEvents: [] });
    if (url === '/api/admin/data/capabilities') return options.capabilities ?? response(capabilities);
    if (url === '/api/admin/data/backups') return options.backups ?? response({ backups });
    throw new Error(`Unexpected fetch: ${url}`);
  });
  global.fetch = fetchMock as typeof fetch;
  return fetchMock;
}

describe('ProgrammeAdminManager recovery state contract', () => {
  beforeEach(() => { jest.resetAllMocks(); window.localStorage.clear(); });

  it('renders only server-advertised operations and held backups', async () => {
    const fetchMock = installFetch();
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Checking data operations');
    expect(await screen.findByText('Storage verified')).toBeInTheDocument();
    expect(screen.getByText('vercel-blob')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /export/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate import package' })).toBeEnabled();
    expect(screen.getByText('Retention hold')).toBeInTheDocument();
    expect(screen.getByText('backup-long-identifier-1234567890')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not invent operations omitted by the server', async () => {
    installFetch({ capabilities: response({ ...capabilities, operations: [{ id: 'status', available: true, allowedAction: 'view', reason: 'available', retryable: false }] }) });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    expect(await screen.findByText('Storage verified')).toBeInTheDocument();
    expect(screen.queryByText('No recovery backups yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validate import package' })).not.toBeInTheDocument();
  });

  it('focuses a safe unavailable alert and retries a fresh capability read', async () => {
    const user = userEvent.setup();
    const unavailable = response({ error: 'data-service-unavailable', category: 'storage-timeout', incidentId: 'incident-retry-1', retryable: true }, false);
    const fetchMock = installFetch({ capabilities: unavailable });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveFocus();
    expect(alert).toHaveTextContent('Data operations are unavailable');
    expect(alert).toHaveTextContent('storage-timeout');
    expect(alert).toHaveTextContent('incident-retry-1');
    expect(screen.queryByRole('button', { name: /apply|restore/i })).not.toBeInTheDocument();

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/admin/programmes') return response({ records: [], auditEvents: [] });
      if (url === '/api/admin/data/capabilities') return response(capabilities);
      if (url === '/api/admin/data/backups') return response({ backups: [] });
      throw new Error(`Unexpected fetch: ${url}`);
    });
    await user.click(within(alert).getByRole('button', { name: 'Retry data operations' }));
    expect(await screen.findByText('Storage verified')).toBeInTheDocument();
  });

  it('retains last verified values read-only while refresh fails', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetch();
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    expect(await screen.findByText('Storage verified')).toBeInTheDocument();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/admin/data/capabilities') return response({ category: 'storage-unavailable', incidentId: 'incident-refresh', retryable: true }, false);
      if (url === '/api/admin/programmes') return response({ records: [], auditEvents: [] });
      throw new Error(`Unexpected fetch: ${url}`);
    });
    await user.click(screen.getByRole('button', { name: 'Refresh data operations' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('incident-refresh');
    expect(screen.getByText(/Last verified/)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate import package' })).toBeDisabled();
  });
});
