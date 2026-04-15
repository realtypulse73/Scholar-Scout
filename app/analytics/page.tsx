'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <div className="p-4">Loading...</div>

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Analytics Dashboard</h1>

      <div className="mt-4 text-sm space-y-1">
        <div>Total Events: {data.totalEvents}</div>
        <div>Views: {data.programViews}</div>
        <div>Saves: {data.saves}</div>
        <div>Compares: {data.compares}</div>
        <div>Explores: {data.explores}</div>
        <div>Apply Starts: {data.applyStarts}</div>
        <div>Applications: {data.applyCompletes}</div>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Top Programs</h2>
        {data.topPrograms.map((p: any) => (
          <div key={p.programId} className="text-sm">
            {p.programId} ({p.count})
          </div>
        ))}
      </div>
    </main>
  )
}
