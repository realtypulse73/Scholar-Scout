import {
  buildCatalogueDiscoveryHref,
  type CatalogueDiscoveryFilters,
} from '@/lib/catalogue-discovery';
import type {
  CataloguePathway,
  CatalogueRegionId,
} from '@/lib/catalogue-contract';

export interface TransitionStory {
  id: string;
  title: string;
  context: string;
  destinationLabel: string;
  href: string;
}

const DEFAULT_FACTUAL_FILTERS: CatalogueDiscoveryFilters = {
  metro: 'greater-houston',
  pathway: 'all',
  delivery: 'all',
  status: 'all',
  q: '',
  page: 1,
};

function buildStoryDestination(
  metro: CatalogueRegionId,
  pathway: CataloguePathway,
): string {
  return buildCatalogueDiscoveryHref({
    ...DEFAULT_FACTUAL_FILTERS,
    metro,
    pathway,
  });
}

/** The public escape hatch always returns visitors to controlled factual browsing. */
export const TRANSITION_STORY_SKIP_HREF = buildCatalogueDiscoveryHref(DEFAULT_FACTUAL_FILTERS);

/**
 * A small local editorial layer that offers orientation without representing
 * a provider, learner, attendance experience, placement, or result.
 */
export const TRANSITION_STORIES: readonly TransitionStory[] = [
  {
    id: 'explore-possibilities',
    title: 'Explore possibilities',
    context: 'Start with questions that matter to you, then compare published details at your own pace.',
    destinationLabel: 'Browse Greater Houston university options',
    href: buildStoryDestination('greater-houston', 'university'),
  },
  {
    id: 'compare-questions',
    title: 'Compare questions',
    context: 'Look for practical details to verify, including location, delivery, cost, and the next official source to check.',
    destinationLabel: 'Browse Greater Chicago community college options',
    href: buildStoryDestination('greater-chicago', 'community-college'),
  },
  {
    id: 'notice-practical-details',
    title: 'Notice practical details',
    context: 'A path can be worth exploring when its published details fit the questions you want to ask next.',
    destinationLabel: 'Browse Greater Buffalo trade and career school options',
    href: buildStoryDestination('greater-buffalo', 'trade-career-school'),
  },
  {
    id: 'consider-supports',
    title: 'Consider supports',
    context: 'Check which supports are documented, and confirm availability and requirements directly with the source.',
    destinationLabel: 'Browse Greater Atlanta registered apprenticeship options',
    href: buildStoryDestination('greater-atlanta', 'registered-apprenticeship'),
  },
  {
    id: 'plan-next-steps',
    title: 'Plan next steps',
    context: 'You can keep notes, compare options, and choose a practical next question without needing to decide today.',
    destinationLabel: 'Browse Greater New Orleans employer-linked training options',
    href: buildStoryDestination('greater-new-orleans', 'employer-linked-training'),
  },
  {
    id: 'keep-options-open',
    title: 'Keep options open',
    context: 'Review more than one route and use the factual catalogue to find details you can verify for yourself.',
    destinationLabel: 'Browse Greater Kingston military information options',
    href: buildStoryDestination('greater-kingston-jamaica', 'military-information'),
  },
];
