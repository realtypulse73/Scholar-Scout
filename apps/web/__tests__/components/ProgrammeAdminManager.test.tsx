import { fireEvent, render, screen, within } from '@testing-library/react';
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

function installFetch(options: { capabilities?: Response; backups?: Response; route?: (url: string, init?: RequestInit) => Promise<Response> } = {}) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/admin/programmes') return response({ records: [], auditEvents: [] });
    if (url === '/api/admin/data/capabilities') return options.capabilities ?? response(capabilities);
    if (url === '/api/admin/data/backups') return options.backups ?? response({ backups });
    if (options.route) return options.route(url, init);
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
    expect(screen.getByRole('heading', { name: 'Governed programme stewardship' })).toBeInTheDocument();
    expect(screen.getByText(/Authorized staff maintain student-facing programme information/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Checking data operations');
    expect((await screen.findAllByText('Storage verified')).length).toBeGreaterThan(0);
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
    expect((await screen.findAllByText('Storage verified')).length).toBeGreaterThan(0);
    expect(screen.queryByText('No recovery backups yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validate import package' })).not.toBeInTheDocument();
  });

  it('renders a verified zero-backup state separately from a failed read', async () => {
    installFetch({ backups: response({ backups: [], empty: true }) });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    expect(await screen.findByText('No recovery backups yet')).toBeInTheDocument();
    expect(screen.getByText(/No action is needed/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
    expect((await screen.findAllByText('Storage verified')).length).toBeGreaterThan(0);
  });

  it('retains last verified values read-only while refresh fails', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetch();
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    expect((await screen.findAllByText('Storage verified')).length).toBeGreaterThan(0);
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
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Validate import package' })).toBeDisabled();
  });

  it('uses a count-only signed plan before enabling one exact restore apply', async () => {
    const user = userEvent.setup();
    let resolveApply: ((value: Response) => void) | undefined;
    const applyResponse = new Promise<Response>((resolve) => { resolveApply = resolve; });
    const plan = {
      planId: 'plan-1', sourceId: backups[0].id, expiresAt: '2026-08-28T13:10:00.000Z',
      rows: [{ key: 'users', label: 'Users', currentCount: 4, restoredCount: 3, delta: -1 }],
    };
    const planToken = {
      claims: {
        planId: 'plan-1', sourceId: backups[0].id,
        sourceDigest: 'a'.repeat(64), currentDataDigest: 'b'.repeat(64),
        issuedAt: '2026-08-28T13:00:00.000Z', expiresAt: plan.expiresAt,
      },
      signature: 'c'.repeat(64),
    };
    const fetchMock = installFetch({
      route: async (url) => {
        if (url.endsWith('/plan')) return response({ plan, planToken });
        if (url.endsWith('/restore')) return applyResponse;
        throw new Error(`Unexpected fetch: ${url}`);
      },
    });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    await screen.findAllByText('Storage verified');

    await user.click(screen.getByRole('button', { name: 'Preview restore impact' }));
    const preview = await screen.findByRole('heading', { name: 'Impact preview' });
    expect(preview).toHaveFocus();
    expect(screen.getByRole('columnheader', { name: 'After restore' })).toBeInTheDocument();
    expect(screen.queryByText(/student@example/i)).not.toBeInTheDocument();
    const apply = screen.getByRole('button', { name: 'Apply restore' });
    expect(apply).toBeDisabled();

    await user.type(screen.getByLabelText('Operator reason'), 'Approved recovery rehearsal');
    await user.type(screen.getByLabelText(/Type RESTORE SCHOLARSCOUT DATA/), 'RESTORE SCHOLARSCOUT DATA');
    expect(apply).toBeEnabled();
    await user.click(apply);
    expect(screen.getByRole('button', { name: 'Applying restore…' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Applying restore…' }));
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/restore'))).toHaveLength(1);
    resolveApply?.(response({ ok: true, backupId: 'backup-created', incidentId: 'incident-applied', appliedAt: '2026-08-28T13:01:00.000Z' }));
    expect(await screen.findByRole('heading', { name: 'Recovery completed' })).toHaveFocus();
    const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/restore'));
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      planToken, reason: 'Approved recovery rehearsal', confirmation: 'RESTORE SCHOLARSCOUT DATA',
    });
  });

  it('validates raw import server-side and clears a conflicted plan', async () => {
    const user = userEvent.setup();
    const packageText = JSON.stringify({ signed: 'package' });
    const plan = {
      planId: 'import-plan', sourceId: 'package-1', expiresAt: '2026-08-28T13:10:00.000Z',
      rows: [{ key: 'auditEvents', label: 'Audit events', currentCount: 5, restoredCount: 6, delta: 1 }],
    };
    const recoveryToken = {
      claims: { planId: 'import-plan', sourceId: 'package-1', sourceDigest: 'd'.repeat(64), currentDataDigest: 'e'.repeat(64), issuedAt: '2026-08-28T13:00:00.000Z', expiresAt: plan.expiresAt },
      signature: 'f'.repeat(64),
    };
    const fetchMock = installFetch({
      route: async (url) => {
        if (url.endsWith('/import/validate')) return response({ plan, planToken: { recoveryToken, encodedEnvelope: 'encoded' } });
        if (url.endsWith('/import/restore')) return response({ ok: false, error: 'recovery-state-changed' }, false, 409);
        throw new Error(`Unexpected fetch: ${url}`);
      },
    });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    await screen.findAllByText('Storage verified');
    fireEvent.change(screen.getByLabelText('Signed recovery package'), { target: { value: packageText } });
    await user.click(screen.getByRole('button', { name: 'Validate import package' }));
    expect(await screen.findByText('Import package validated. Review the impact before applying it.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/data/import/validate', expect.objectContaining({ body: packageText }));
    await user.type(screen.getByLabelText('Operator reason'), 'Current data changed');
    await user.type(screen.getByLabelText(/Type RESTORE SCHOLARSCOUT DATA/), 'RESTORE SCHOLARSCOUT DATA');
    await user.click(screen.getByRole('button', { name: 'Apply import' }));
    expect(await screen.findByText(/recovery-state-changed/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Type RESTORE SCHOLARSCOUT DATA/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate import package' })).toHaveFocus();
  });

  it('preserves the operator reason after a retryable apply failure', async () => {
    const user = userEvent.setup();
    const plan = {
      planId: 'plan-retry', sourceId: backups[0].id, expiresAt: '2026-08-28T13:10:00.000Z',
      rows: [{ key: 'users', label: 'Users', currentCount: 4, restoredCount: 3, delta: -1 }],
    };
    const planToken = {
      claims: { planId: plan.planId, sourceId: plan.sourceId, sourceDigest: 'a'.repeat(64), currentDataDigest: 'b'.repeat(64), issuedAt: '2026-08-28T13:00:00.000Z', expiresAt: plan.expiresAt },
      signature: 'c'.repeat(64),
    };
    installFetch({ route: async (url) => {
      if (url.endsWith('/plan')) return response({ plan, planToken });
      if (url.endsWith('/restore')) return response({ ok: false, error: 'data-service-unavailable', retryable: true }, false);
      throw new Error(`Unexpected fetch: ${url}`);
    } });
    render(<ProgrammeAdminManager baseProgrammes={[]} />);
    await screen.findAllByText('Storage verified');
    await user.click(screen.getByRole('button', { name: 'Preview restore impact' }));
    await user.type(await screen.findByLabelText('Operator reason'), 'Keep this reason');
    await user.type(screen.getByLabelText(/Type RESTORE SCHOLARSCOUT DATA/), 'RESTORE SCHOLARSCOUT DATA');
    await user.click(screen.getByRole('button', { name: 'Apply restore' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('data-service-unavailable');
    expect(screen.getByLabelText('Operator reason')).toHaveValue('Keep this reason');
  });
});
