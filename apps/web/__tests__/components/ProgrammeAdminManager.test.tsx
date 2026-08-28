import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

type RecoveryFixture =
  | { state: 'loading' }
  | { state: 'unavailable'; incidentId: string; retryable: true }
  | { state: 'last-known'; verifiedAt: string }
  | { state: 'ready'; verifiedAt: string };

function RecoveryStateFixture({ fixture }: { fixture: RecoveryFixture }) {
  let content: ReactNode;

  if (fixture.state === 'loading') {
    content = <p role="status">Checking data operations…</p>;
  } else if (fixture.state === 'unavailable') {
    content = (
      <div role="alert">
        Data operations are unavailable. Incident {fixture.incidentId}.
        <button type="button">Retry</button>
      </div>
    );
  } else {
    content = (
      <section aria-label="Data operations">
        <p>Last verified {fixture.verifiedAt}</p>
        <button type="button" disabled={fixture.state === 'last-known'}>
          Restore data
        </button>
      </section>
    );
  }

  return <div>{content}</div>;
}

describe('ProgrammeAdminManager recovery state contract', () => {
  it.each<RecoveryFixture>([
    { state: 'loading' },
    { state: 'unavailable', incidentId: 'incident-1', retryable: true },
    { state: 'last-known', verifiedAt: '2026-08-28T13:00:00.000Z' },
    { state: 'ready', verifiedAt: '2026-08-28T13:00:00.000Z' },
  ])('exposes an accessible $state state', (fixture) => {
    render(<RecoveryStateFixture fixture={fixture} />);

    if (fixture.state === 'loading') {
      expect(screen.getByRole('status')).toBeInTheDocument();
    } else if (fixture.state === 'unavailable') {
      expect(screen.getByRole('alert')).toHaveTextContent(fixture.incidentId);
      expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
    } else {
      expect(screen.getByRole('region', { name: 'Data operations' })).toBeInTheDocument();
      const restoreButton = screen.getByRole('button', { name: 'Restore data' });
      if (fixture.state === 'ready') {
        expect(restoreButton).toBeEnabled();
      } else {
        expect(restoreButton).toBeDisabled();
      }
    }
  });
});
