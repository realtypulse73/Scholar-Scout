interface CatalogueVisualWelcomeProps {
  regionLabel: string;
}

/** A static, abstract first step that directs visitors to reviewed catalogue facts. */
export default function CatalogueVisualWelcome({
  regionLabel,
}: CatalogueVisualWelcomeProps) {
  return (
    <section
      aria-label="Visual welcome"
      className="catalogue-visual-welcome mx-auto mt-6 w-full max-w-6xl min-w-0 px-5 sm:px-6 lg:px-8"
    >
      <div className="catalogue-visual-welcome-panel">
        <div className="catalogue-visual-welcome-decoration" aria-hidden="true">
          <div className="catalogue-visual-welcome-plane catalogue-visual-welcome-plane-primary" />
          <div className="catalogue-visual-welcome-plane catalogue-visual-welcome-plane-secondary" />
          <div className="catalogue-visual-welcome-rule" />
        </div>
        <div className="relative min-w-0 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Visual welcome</p>
          <h2 id="catalogue-visual-welcome-heading" className="mt-2 text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">
            Begin with what you can verify.
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-700 sm:text-base">
            Explore reviewed opportunities in {regionLabel}, then use sources and official actions to decide your next step.
          </p>
          <a
            href="#catalogue-results-heading"
            className="mt-5 inline-flex min-h-touch items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Browse reviewed opportunities
          </a>
        </div>
      </div>
    </section>
  );
}
