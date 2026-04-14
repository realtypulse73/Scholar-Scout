'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { opportunities } from '../../lib/mockOpportunities'

const COMPARE_KEY = 'scholarscout-compare'

export default function ComparePage() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem(COMPARE_KEY)
    if (stored) setIds(JSON.parse(stored))
  }, [])

  const items = opportunities.filter((o) => ids.includes(o.id))

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Compare Programs</h1>
        <Link href="/favorites" className="text-sm underline">Back</Link>
      </div>

      {items.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Select programs to compare from your saved list.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded border bg-white p-3">
              <div className="font-semibold">{item.name}</div>

              <div className="mt-2 text-xs text-gray-500">
                {item.pathway} · {item.locationType}
              </div>

              <div className="mt-2 text-sm">{item.description}</div>

              <div className="mt-3 text-xs">
                <div>Cost: {item.lowCost ? 'Lower cost' : 'Standard'}</div>
                <div>Min GPA: {item.minGpaBand}</div>
                <div>Support: {item.support.join(', ')}</div>
                <div>Interests: {item.interests.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
