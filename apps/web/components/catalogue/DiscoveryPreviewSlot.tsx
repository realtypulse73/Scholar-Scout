/**
 * Structural boundary for the later rights-reviewed media experience.
 * It intentionally accepts no record or media URL in Phase 11.
 */
export default function DiscoveryPreviewSlot() {
  return (
    <section
      aria-label="Media preview"
      className="min-w-0 rounded-card border border-dashed border-brand-300 bg-brand-50 p-5"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Media preview</p>
      <h2 className="mt-2 text-xl font-semibold text-ink-900">Visual media needs rights review</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
        This factual opportunity page does not display provider or learner media yet. A future
        preview can appear here only after documented rights, accessibility, attribution, and
        fallback review are complete.
      </p>
    </section>
  );
}
