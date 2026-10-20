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
        <a href="#catalogue-results-heading" className="mt-5 inline-flex min-h-touch items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">Browse reviewed opportunities</a>
      </div>
    </section>
  );
}
