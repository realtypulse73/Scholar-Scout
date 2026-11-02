interface CatalogueVisualWelcomeProps {
  regionLabel: string;
}

export default function CatalogueVisualWelcome({ regionLabel }: CatalogueVisualWelcomeProps) {
  return (
    <section className="catalogue-visual-welcome relative mx-auto w-full max-w-6xl min-w-0 overflow-hidden border-x border-b border-ink-200 bg-white px-5 py-8 sm:px-6 lg:px-8" aria-labelledby="catalogue-visual-welcome-heading">
      <div data-testid="catalogue-visual-welcome-decoration" className="catalogue-visual-welcome-decoration pointer-events-none" aria-hidden="true">
        <span className="catalogue-visual-welcome-plane catalogue-visual-welcome-plane-primary" />
        <span className="catalogue-visual-welcome-plane catalogue-visual-welcome-plane-secondary" />
        <span className="catalogue-visual-welcome-rule" />
      </div>
      <div className="relative min-w-0 rounded-card border border-ink-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Find your next step</p>
        <h2 id="catalogue-visual-welcome-heading" className="mt-2 max-w-3xl text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">Start with reviewed opportunities</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-700 sm:text-base">Explore current, source-backed options in {regionLabel}. You stay in control of the filters, order, and next steps.</p>
        <nav aria-label="Choose a starting point" className="mt-5 grid gap-3 sm:grid-cols-2">
          <a href="#catalogue-results-heading" className="group min-h-touch rounded-card bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
            <span className="block">Browse reviewed opportunities</span>
            <span className="mt-1 block text-xs font-normal text-white/85">See every current, source-backed option.</span>
          </a>
          <a href="#catalogue-filters" className="group min-h-touch rounded-card border border-ink-300 bg-white/90 px-4 py-3 text-sm font-semibold text-ink-900 shadow-sm hover:border-brand-600 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
            <span className="block">Choose filters</span>
            <span className="mt-1 block text-xs font-normal text-ink-700">Set a metro, pathway, or delivery preference.</span>
          </a>
        </nav>
      </div>
    </section>
  );
}
