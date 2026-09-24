import { render, screen } from '@testing-library/react';
import CatalogueFocusView from '@/components/catalogue/CatalogueFocusView';
import type { CatalogueDiscoveryItem } from '@/lib/catalogue-discovery';

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

const item: CatalogueDiscoveryItem = {
  id: 'snapshot-only-id', providerTitle: 'Bayou Skills Academy', regionId: 'greater-new-orleans', regionLabel: 'Greater New Orleans', pathway: 'trade-career-school',
  place: fact('New Orleans, Louisiana', 'current'), delivery: fact('in-person' as const, 'current'),
  facts: { skillTaught: fact('Electrical work', 'current'), trainingPayer: fact('Student', 'needs-confirmation'), costOrTuition: fact('$400', 'current'), duration: fact('10 weeks', 'conflicting') },
  reasonsToConsider: [{
    label: 'Skill taught',
    value: 'Electrical work',
    state: 'current',
    evidence: fact('Electrical work', 'current').evidence,
  }, {
    label: 'Training payer',
    value: 'Student',
    state: 'needs-confirmation',
    evidence: fact('Student', 'needs-confirmation').evidence,
  }],
  factState: 'conflicting', source: { label: 'Bayou official catalogue', date: '2026-09-20', state: 'current' }, officialVerificationUrl: 'https://example.edu/bayou', mediaState: 'reserved-for-rights-review',
};

function fact<T extends string>(value: T, state: CatalogueDiscoveryItem['factState']) {
  return { value, state, evidence: { status: state, authority: 'provider-official' as const, sourceLabel: 'Bayou official catalogue', sourceUrl: 'https://example.edu/bayou', sourceDate: { state: 'documented' as const, value: '2026-09-20' }, reviewedAt: '2026-09-21', verificationAction: 'Confirm this detail directly with Bayou.' } };
}

describe('CatalogueFocusView', () => {
  it('keeps complete evidence and finite visitor-controlled navigation visible without media', () => {
    render(<CatalogueFocusView item={item} backHref="/programmes?metro=greater-new-orleans" previousHref="/programmes/previous?metro=greater-new-orleans" nextHref="/programmes/next?metro=greater-new-orleans" alternateHref="/programmes?metro=greater-new-orleans&pathway=university" />);

    expect(screen.getByRole('heading', { name: /bayou skills academy/i })).toBeInTheDocument();
    expect(screen.getAllByText('Training payer', { exact: true })).toHaveLength(2);
    expect(screen.getAllByText(/needs confirmation/i)).toHaveLength(2);
    expect(screen.getAllByText(/confirm this detail directly with bayou/i)).toHaveLength(8);
    expect(screen.getByRole('link', { name: /back to results/i })).toHaveAttribute('href', '/programmes?metro=greater-new-orleans');
    expect(screen.getByRole('link', { name: /previous opportunity/i })).toHaveAttribute('href', '/programmes/previous?metro=greater-new-orleans');
    expect(screen.getByRole('link', { name: /next opportunity/i })).toHaveAttribute('href', '/programmes/next?metro=greater-new-orleans');
    expect(screen.getByRole('region', { name: /media preview/i })).toHaveTextContent(/rights review/i);
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official verification/i })).toHaveAttribute('href', 'https://example.edu/bayou');
  });

  it('keeps named focus actions and the non-media preview readable with reduced motion or a narrow viewport', () => {
    render(<CatalogueFocusView item={item} backHref="/programmes?metro=greater-new-orleans" previousHref="/programmes/previous?metro=greater-new-orleans" nextHref="/programmes/next?metro=greater-new-orleans" alternateHref="/programmes?metro=greater-new-orleans&pathway=university" />);

    expect(screen.getByTestId('catalogue-focus-layout')).toHaveClass('catalogue-focus', 'min-w-0', 'max-w-full');
    expect(screen.getByRole('navigation', { name: /opportunity detail navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /facts and sources/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /media preview/i })).toHaveTextContent(/does not display provider or learner media yet/i);
    expect(screen.getByRole('link', { name: /open source for training payer.*opens a new tab/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: /save to shortlist/i })).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('catalogue-focus-decoration')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders every factual reason with source evidence, state, date, and a direct verification path', () => {
    render(<CatalogueFocusView item={item} backHref="/programmes?metro=greater-new-orleans" alternateHref="/programmes?metro=greater-new-orleans&pathway=university" />);

    const reasons = screen.getByRole('region', { name: /reasons to consider/i });
    expect(reasons).toHaveTextContent(/skill taught.*electrical work/i);
    expect(reasons).toHaveTextContent(/training payer.*student/i);
    expect(reasons).toHaveTextContent(/needs confirmation.*bayou official catalogue.*2026-09-20/i);
    expect(reasons).toHaveTextContent(/confirm this detail directly with bayou/i);
    expect(screen.getByRole('link', { name: /open reason source for skill taught.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/bayou');
    expect(screen.getByRole('link', { name: /open reason source for training payer.*opens a new tab/i })).toHaveAttribute('href', 'https://example.edu/bayou');
  });

  it('states when no reviewed factual reasons are available', () => {
    render(<CatalogueFocusView item={{ ...item, reasonsToConsider: [] }} backHref="/programmes?metro=greater-new-orleans" alternateHref="/programmes?metro=greater-new-orleans&pathway=university" />);

    expect(screen.getByRole('region', { name: /reasons to consider/i })).toHaveTextContent(/no reviewed factual reasons are currently listed/i);
  });
});
