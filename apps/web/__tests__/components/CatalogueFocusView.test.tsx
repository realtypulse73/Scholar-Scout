import { render, screen } from '@testing-library/react';
import CatalogueFocusView from '@/components/catalogue/CatalogueFocusView';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

const item: CatalogueDiscoveryItem = {
  id: 'snapshot-only-id', providerTitle: 'Bayou Skills Academy', regionId: 'greater-new-orleans', regionLabel: 'Greater New Orleans', pathway: 'trade-career-school',
  place: fact('New Orleans, Louisiana', 'current'), delivery: fact('in-person' as const, 'current'),
  facts: { skillTaught: fact('Electrical work', 'current'), trainingPayer: fact('Student', 'needs-confirmation'), costOrTuition: fact('$400', 'current'), duration: fact('10 weeks', 'conflicting') },
  factState: 'conflicting', source: { label: 'Bayou official catalogue', date: '2026-09-20', state: 'current' }, officialVerificationUrl: 'https://example.edu/bayou', mediaState: 'reserved-for-rights-review',
};

function fact<T extends string>(value: T, state: CatalogueDiscoveryItem['factState']) {
  return { value, state, evidence: { status: state, authority: 'provider-official' as const, sourceLabel: 'Bayou official catalogue', sourceUrl: 'https://example.edu/bayou', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-21', verificationAction: 'Confirm this detail directly with Bayou.' } };
}

describe('CatalogueFocusView', () => {
  it('keeps complete evidence and finite visitor-controlled navigation visible without media', () => {
    render(<CatalogueFocusView item={item} backHref="/programmes?metro=greater-new-orleans" previousHref="/programmes/previous?metro=greater-new-orleans" nextHref="/programmes/next?metro=greater-new-orleans" alternateHref="/programmes?metro=greater-new-orleans&pathway=university" />);

    expect(screen.getByRole('heading', { name: /bayou skills academy/i })).toBeInTheDocument();
    expect(screen.getByText(/training payer/i)).toBeInTheDocument();
    expect(screen.getByText(/needs confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm this detail directly with bayou/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to results/i })).toHaveAttribute('href', '/programmes?metro=greater-new-orleans');
    expect(screen.getByRole('link', { name: /previous opportunity/i })).toHaveAttribute('href', '/programmes/previous?metro=greater-new-orleans');
    expect(screen.getByRole('link', { name: /next opportunity/i })).toHaveAttribute('href', '/programmes/next?metro=greater-new-orleans');
    expect(screen.getByRole('region', { name: /media preview/i })).toHaveTextContent(/rights review/i);
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification/i })).toHaveAttribute('href', 'https://example.edu/bayou');
  });
});
