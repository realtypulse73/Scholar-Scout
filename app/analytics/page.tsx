'use client'

import { useEffect, useState } from 'react'
import { readEvents, summarizeEvents } from '../../lib/analytics'

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const events = readEvents()
    setSummary(summarizeEvents(events))
  }, [])

  if (!summary) return null

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">Analytics</h1>

      <div className="mt-4 space-y-2 text-sm">
        <div>Total Events: {summary.totalEvents}</div>
        <div>Program Views: {summary.programViews}</div>
        <div>Saves: {summary.saves}</div>
        <div>Explores: {summary.explores}</div>
        <div>Apply Starts: {summary.applyStarts}</div>
        <div>Applications Submitted: {summary.applyCompletes}</div>
      </div>
    </main>
  )
}
