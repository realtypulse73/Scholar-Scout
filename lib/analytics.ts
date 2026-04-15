export type AnalyticsEventName =
  | 'program_view'
  | 'save_program'
  | 'unsave_program'
  | 'compare_select'
  | 'compare_unselect'
  | 'explore_click'
  | 'apply_start'
  | 'apply_continue'
  | 'apply_complete'

export interface AnalyticsEvent {
  id: string
  name: AnalyticsEventName
  programId?: string
  metadata?: Record<string, string | number | boolean>
  createdAt: string
}

const ANALYTICS_KEY = 'scholarscout-analytics'

export function trackEvent(
  name: AnalyticsEventName,
  programId?: string,
  metadata?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return

  const nextEvent: AnalyticsEvent = {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    programId,
    metadata,
    createdAt: new Date().toISOString()
  }

  try {
    const current = readEvents()
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify([nextEvent, ...current]))
  } catch {
    // Ignore storage failures.
  }
}

export function readEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(ANALYTICS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function summarizeEvents(events: AnalyticsEvent[]) {
  return {
    totalEvents: events.length,
    programViews: events.filter((event) => event.name === 'program_view').length,
    saves: events.filter((event) => event.name === 'save_program').length,
    explores: events.filter((event) => event.name === 'explore_click').length,
    applyStarts: events.filter((event) => event.name === 'apply_start').length,
    applyCompletes: events.filter((event) => event.name === 'apply_complete').length
  }
}
