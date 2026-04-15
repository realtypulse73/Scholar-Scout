import { NextResponse } from 'next/server'
import { appendAnalyticsEvent, summarizeAnalyticsEvents } from '../../../lib/server/analyticsDb'
import type { AnalyticsEvent } from '../../../lib/analytics'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyticsEvent
    await appendAnalyticsEvent(body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

export async function GET() {
  const summary = await summarizeAnalyticsEvents()
  return NextResponse.json(summary)
}
