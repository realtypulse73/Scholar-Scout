'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { opportunities } from '../../lib/mockOpportunities'

const FAVORITES_KEY = 'scholarscout-favorites'
const COMPARE_KEY = 'scholarscout-compare'

export default function Favorites() {
  const [ids, setIds] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem(FAVORITES_KEY)
    if (stored) setIds(JSON.parse(stored))

    const storedCompare = sessionStorage.getItem(COMPARE_KEY)
    if (storedCompare) setCompareIds(JSON.parse(storedCompare))
  }, [])

  const favorites = useMemo(() => opportunities.filter((o) => ids.includes(o.id)), [ids])

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      let next: string[]

      if (current.includes(id)) {
        next = current.filter((item) => item !== id)
      } else if (current.length < 3) {
        next = [...current, id]
      } else {
        next = current
      }

      try {
        sessionStorage.setItem(COMPARE_KEY, JSON.stringify(next))
      } catch {
        // Ignore storage issues.
      }

      return next
    })
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Saved Programs</h1>
        <div className="flex gap-2">
          <Link href="/results" className="rounded border bg-white px-3 py-2 text-sm">Back</Link>
          <Link href="/compare" className="rounded border bg-white px-3 py-2 text-sm font-medium">
            Compare ({compareIds.length})
          </Link>
        </div>
      </div>

      {favorites.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          You haven't saved any programs yet.
        </div>
      )}

      {favorites.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          Select up to 3 saved programs to compare side by side.
        </div>
      )}

      {favorites.map((f) => {
        const checked = compareIds.includes(f.id)
        const disabled = !checked && compareIds.length >= 3

        return (
          <div key={f.id} className="mb-3 rounded border bg-white p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {f.pathway} · {f.locationType}
                </div>
              </div>

              <label className={`flex items-center gap-2 text-xs ${disabled ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleCompare(f.id)}
                />
                Compare
              </label>
            </div>

            <div className="text-sm">{f.description}</div>
          </div>
        )
      })}
    </main>
  )
}
