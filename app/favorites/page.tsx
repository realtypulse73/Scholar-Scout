'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { opportunities } from '../../lib/mockOpportunities'

const FAVORITES_KEY = 'scholarscout-favorites'

export default function Favorites() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem(FAVORITES_KEY)
    if (stored) setIds(JSON.parse(stored))
  }, [])

  const favorites = opportunities.filter((o) => ids.includes(o.id))

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Saved Programs</h1>
        <Link href="/results" className="text-sm underline">Back</Link>
      </div>

      {favorites.length === 0 && (
        <div className="border rounded p-4 text-sm text-gray-600 bg-white">
          You haven't saved any programs yet.
        </div>
      )}

      {favorites.map((f) => (
        <div key={f.id} className="mb-3 border rounded p-3 bg-white">
          <div className="font-semibold">{f.name}</div>
          <div className="text-sm">{f.description}</div>
          <div className="text-xs text-gray-500 mt-1">
            {f.pathway} · {f.locationType}
          </div>
        </div>
      ))}
    </main>
  )
}
