import { fireEvent, render, screen } from '@testing-library/react';
import SensitiveReferralPanel from '@/components/support/SensitiveReferralPanel';

describe('SensitiveReferralPanel', () => {
  it('keeps a referral selection in component memory and reveals a test-only link only after consent', () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    const storageSpy = jest.spyOn(Storage.prototype, 'setItem');
    const historySpy = jest.spyOn(window.history, 'pushState');

    render(<SensitiveReferralPanel />);

    expect(screen.queryByRole('link', { name: /test-only/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/support area/i), {
      target: { value: 'housing' },
    });
    fireEvent.click(screen.getByRole('button', { name: /show test-only/i }));

    const link = screen.getByRole('link', { name: /test-only housing/i });
    expect(link).toHaveAttribute('href', 'https://housing-support.invalid/contact');
    expect(screen.getByText(/does not claim current provider availability/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(historySpy).not.toHaveBeenCalled();

    if (originalFetch) {
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: originalFetch,
      });
    } else {
      delete (globalThis as { fetch?: typeof globalThis.fetch }).fetch;
    }
    storageSpy.mockRestore();
    historySpy.mockRestore();
  });
});
