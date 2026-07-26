import {
  SHORTLIST_PLAN_STATUS_LABELS,
  getShortlistPlan,
  getProgrammeDecisionSummary,
  getShortlistDecisionHeadline,
  getShortlistDecisionSummaries,
  getShortlistedProgrammes,
  isShortlisted,
  normalizeShortlistIds,
  parseShortlist,
  parseShortlistPlans,
  pruneShortlistPlans,
  toggleShortlistId,
  updateShortlistPlan,
} from '@/lib/shortlist';
import { programmes } from '@/lib/programmes';

describe('shortlist helpers', () => {
  it('normalizes ids by removing blanks and duplicates', () => {
    expect(normalizeShortlistIds(['b', '', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('parses valid shortlist JSON and ignores invalid entries', () => {
    expect(parseShortlist('["north-valley-health", 7, "harbor-welding"]')).toEqual([
      'harbor-welding',
      'north-valley-health',
    ]);
  });

  it('returns an empty list for invalid stored values', () => {
    expect(parseShortlist('{bad')).toEqual([]);
  });

  it('toggles ids in and out of the shortlist', () => {
    const added = toggleShortlistId([], 'metro-cybersecurity');
    expect(isShortlisted(added, 'metro-cybersecurity')).toBe(true);
    expect(toggleShortlistId(added, 'metro-cybersecurity')).toEqual([]);
  });

  it('maps saved ids back to known programmes only', () => {
    const results = getShortlistedProgrammes(
      ['missing', 'north-valley-health'],
      programmes,
    );

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Applied Health Sciences');
  });

  it('summarizes practical decision signals for a programme', () => {
    const summary = getProgrammeDecisionSummary(programmes[0]);

    expect(summary.signals.map((signal) => signal.label)).toEqual([
      'Cost',
      'Access',
      'Support',
      'Readiness',
    ]);
    expect(summary.strengths).toContain('Access');
    expect(summary.nextStep).toBe('Check required health classes');
  });

  it('sorts decision summaries by practical signal strength', () => {
    const summaries = getShortlistDecisionSummaries([
      programmes.find((programme) => programme.id === 'evergreen-environmental')!,
      programmes.find((programme) => programme.id === 'lakeside-business-transfer')!,
    ]);

    expect(summaries[0].programme.id).toBe('lakeside-business-transfer');
  });

  it('builds a shortlist decision headline with verification count', () => {
    const headline = getShortlistDecisionHeadline([
      {
        ...programmes[0],
        annualTuition: 13000,
        nextSteps: [],
      },
    ]);

    expect(headline).toContain('items to verify');
  });

  it('parses shortlist planning state and normalizes unsafe values', () => {
    const plans = parseShortlistPlans(
      JSON.stringify({
        'north-valley-health': {
          status: 'ready-to-apply',
          note: 'Ask about clinical observation dates.',
        },
        'metro-cybersecurity': {
          status: 'unknown',
          note: 42,
        },
      }),
    );

    expect(plans['north-valley-health']).toEqual({
      status: 'ready-to-apply',
      note: 'Ask about clinical observation dates.',
    });
    expect(plans['metro-cybersecurity']).toEqual({
      status: 'considering',
      note: '',
    });
  });

  it('updates and prunes shortlist planning state', () => {
    const plans = updateShortlistPlan({}, 'north-valley-health', {
      status: 'contacted',
      note: 'Left voicemail.',
    });

    expect(getShortlistPlan(plans, 'north-valley-health').status).toBe(
      'contacted',
    );
    expect(pruneShortlistPlans(plans, [])).toEqual({});
  });

  it('exposes stable status labels for planning controls', () => {
    expect(SHORTLIST_PLAN_STATUS_LABELS['visit-planned']).toBe(
      'Visit planned',
    );
  });
});
