import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import type { AnalyticsEvent } from '../analytics'

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'analytics-events.json')

async function ensureDb() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(dbPath, 'utf-8')
  } catch {
    await writeFile(dbPath, '[]', 'utf-8')
  }
}

export async function readAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  await ensureDb()
  try {
    const raw = await readFile(dbPath, 'utf-8')
    return JSON.parse(raw) as AnalyticsEvent[]
  } catch {
    return []
  }
}

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const events = await readAnalyticsEvents()
  events.unshift(event)
  await writeFile(dbPath, JSON.stringify(events, null, 2), 'utf-8')
}

export async function summarizeAnalyticsEvents() {
  const events = await readAnalyticsEvents()
  const programs = new Map<string, number>()

  for (const event of events) {
    if (event.programId) {
      programs.set(event.programId, (programs.get(event.programId) ?? 0) + 1)
    }
  }

  const topPrograms = [...programs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([programId, count]) => ({ programId, count }))

  return {
    totalEvents: events.length,
    programViews: events.filter((event) => event.name === 'program_view').length,
    saves: events.filter((event) => event.name === 'save_program').length,
    unsaves: events.filter((event) => event.name === 'unsave_program').length,
    compares: events.filter((event) => event.name === 'compare_select').length,
    explores: events.filter((event) => event.name === 'explore_click').length,
    applyStarts: events.filter((event) => event.name === 'apply_start').length,
    applyCompletes: events.filter((event) => event.name === 'apply_complete').length,
    topPrograms,
    recentEvents: events.slice(0, 20)
  }
}
