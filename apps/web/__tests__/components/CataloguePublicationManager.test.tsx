import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CataloguePublicationManager from '@/components/admin/CataloguePublicationManager';

const candidate = {
  id: 'catalogue:training',
  title: 'Technical training',
  lifecycle: 'draft',
  revision: 2,
  correctionCodes: ['source'],
  reviewStatus: 'draft',
  creatorId: 'editor-1',
  reviewerId: null,
  checklist: {
    summary: [
      { category: 'source', status: 'needs-correction' },
      { category: 'material-evidence', status: 'passed' },
      { category: 'freshness', status: 'passed' },
      { category: 'claim-boundary', status: 'passed' },
      { category: 'regional-boundary', status: 'passed' },
      { category: 'media-rights', status: 'fallback' },
    ],
    passMeaning: 'A pass means editorial completeness, not verified real-world provider truth.',
  },
  audit: [{
    actor: 'editor-1',
    capability: 'editor',
    action: 'stage',
    timestamp: '2026-09-23T12:00:00.000Z',
    outcome: 'needs-correction',
    correctionCodes: ['source'],
    reviewStatus: 'draft',
    candidateRevision: 2,
  }],
};

describe('CataloguePublicationManager', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, capabilities: ['editor', 'reviewer'], candidates: [candidate] }),
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('renders safe lifecycle, all six checklist categories, disclosure, and capability-specific controls', async () => {
    render(<CataloguePublicationManager />);

    await waitFor(() => expect(screen.getByText('Technical training')).toBeInTheDocument());
    expect(screen.getAllByText(/editorial completeness, not verified real-world provider truth/i)).not.toHaveLength(0);
    expect(screen.getByText('material evidence')).toBeInTheDocument();
    expect(screen.getByText('media rights')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve candidate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /emergency correction/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publish weekly/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restore snapshot/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/source/i)).not.toHaveLength(0);
  });

  it('does not fabricate a conflict before a stale import response', async () => {
    render(<CataloguePublicationManager />);
    await waitFor(() => expect(screen.getByText('Technical training')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: /^resolve conflict$/i })).not.toBeInTheDocument();
  });

  it('opens a real stale import comparison and sends both chosen fields for resolution', async () => {
    global.fetch = jest.fn().mockImplementation(async (input: string) => {
      if (input.includes('view=candidate-intake')) {
        return { ok: true, json: async () => ({ capabilities: ['editor'], candidates: [candidate] }) };
      }
      if (input.includes('snapshot-history')) {
        return { ok: true, json: async () => ({ history: [] }) };
      }
      if (input.includes('/import')) {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: 'This catalogue candidate changed. Compare values before resolving.',
            conflict: {
              candidateId: candidate.id,
              currentRevision: 2,
              attemptedRevision: 1,
              current: { title: 'Current training', claimBoundary: 'Current factual claim.', regionId: 'greater-houston' },
              attempted: { title: 'Earlier training', claimBoundary: 'Earlier factual claim.', regionId: 'greater-houston' },
              mergeChoices: ['current', 'attempted'],
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    });

    render(<CataloguePublicationManager />);
    await waitFor(() => expect(screen.getByText('Technical training')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/import json/i), {
      target: { value: JSON.stringify({ schemaVersion: 1, changes: [{ action: 'upsert' }] }) },
    });
    fireEvent.click(screen.getByRole('button', { name: /stage private import/i }));

    await waitFor(() => expect(screen.getByText('Resolve candidate conflict')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Current factual claim.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Earlier factual claim.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /keep attempted title/i }));
    fireEvent.click(screen.getByRole('button', { name: /keep attempted claim boundary/i }));
    fireEvent.click(screen.getByRole('button', { name: /save conflict decision/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/explain why the older value/i);
    fireEvent.change(screen.getByLabelText(/reason when retaining an older value/i), {
      target: { value: 'The source correction retains the earlier wording.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save conflict decision/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('action=resolve-conflict'),
      expect.objectContaining({ body: expect.stringContaining('"claimBoundary":"attempted"') }),
    ));
  });

  it('shows a non-mutating administrator weekly preview, release controls, and redacted release history', async () => {
    let requestCount = 0;
    global.fetch = jest.fn().mockImplementation(async (input: string) => {
      requestCount += 1;
      if (input.includes('view=candidate-intake')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            capabilities: ['editor', 'reviewer', 'administrator'],
            candidates: [{ ...candidate, lifecycle: 'approved', correctionCodes: [] }],
          }),
        };
      }
      if (input.includes('view=snapshot-history')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            history: [{
              actor: 'administrator-1',
              capability: 'administrator',
              action: 'release',
              timestamp: '2026-09-21T13:00:00.000Z',
              outcome: 'published',
              version: 1,
              kind: 'weekly',
              periodKey: '2026-W39',
              correctionStatus: 'all-selected-passed',
              reviewStatus: 'approved-release',
              lineage: { snapshotId: 'catalogue-snapshot-1', priorSnapshotId: null, restoredFromSnapshotId: null, contentDigest: 'digest' },
            }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          ok: true,
          eligibility: { periodKey: '2026-W39', withinWindow: true, alreadyPublished: false, eligible: true },
          selected: [{ id: candidate.id, revision: candidate.revision }],
          quarantined: [],
          mediaFallbackIds: [candidate.id],
        }),
      };
    });

    render(<CataloguePublicationManager />);

    await waitFor(() => expect(screen.getByRole('button', { name: /preview weekly release/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /preview weekly release/i }));

    await waitFor(() => expect(screen.getAllByText(/preview only — nothing has been published/i)).not.toHaveLength(0));
    expect(screen.getAllByText(/2026-W39/)).not.toHaveLength(0);
    expect(screen.getByText(/media falls back to factual text/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /emergency correction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore snapshot/i })).toBeInTheDocument();
    expect(screen.getAllByText(/catalogue-snapshot-1/)).not.toHaveLength(0);
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });
});
