'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { matchStudentToOpportunities } from '../../lib/recommendationEngine'
import { opportunities } from '../../lib/mockOpportunities'
import { MatchResult } from '../../lib/types'

const STORAGE_KEY = 'scholarscout-profile'
const FAVORITES_KEY = 'scholarscout-favorites'

type CostFilter = 'all' | 'lower_cost' | 'standard_cost'
type SortOption = 'best_match' | 'pathway' | 'location'

export default function Results() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [pathwayFilter, setPathwayFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [costFilter, setCostFilter] = useState<CostFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('best_match')

  useEffect(() => {
    try {
      const storedFavorites = sessionStorage.getItem(FAVORITES_KEY)
      if (storedFavorites) {
        setFavoriteIds(JSON.parse(storedFavorites))
      }

      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setMatches([])
        return
      }

      const profile = JSON.parse(stored)
      const results = matchStudentToOpportunities(profile, opportunities)
      setMatches(results)
    } catch {
      setMatches([])
    }
  }, [])

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]

      try {
        sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      } catch {
        // Ignore browser storage failures.
      }

      return next
    })
  }

  const filteredMatches = useMemo(() => {
    const filtered = matches.filter((match) => {
      const pathwayOk = pathwayFilter === 'all' || match.pathway === pathwayFilter
      const locationOk = locationFilter === 'all' || match.locationType === locationFilter
      const costOk =
        costFilter === 'all' ||
        (costFilter === 'lower_cost' && match.lowCost) ||
        (costFilter === 'standard_cost' && !match.lowCost)

      return pathwayOk && locationOk && costOk
    })

    if (sortBy === 'pathway') {
      return [...filtered].sort((a, b) => a.pathway.localeCompare(b.pathway))
    }

    if (sortBy === 'location') {
      return [...filtered].sort((a, b) => a.locationType.localeCompare(b.locationType))
    }

    return [...filtered].sort((a, b) => b.score - a.score)
  }, [matches, pathwayFilter, locationFilter, costFilter, sortBy])

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Your Matches</h1>
        <Link href="/favorites" className="rounded border bg-white px-3 py-2 text-sm font-medium">
          Favorites ({favoriteIds.length})
        </Link>
      </div>

      {matches.length > 0 && (
        <section className="mb-4 rounded border bg-white p-3">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Filter results</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-700">
              <div className="mb-1">Pathway</div>
              <select value={pathwayFilter} onChange={(e) => setPathwayFilter(e.target.value)} className="w-full rounded border p-2">
                <option value="all">All pathways</option>
                <option value="college">College</option>
                <option value="trade">Trade</option>
                <option value="apprenticeship">Apprenticeship</option>
                <option value="certificate">Certificate</option>
                <option value="military">Military</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              <div className="mb-1">Location</div>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full rounded border p-2">
                <option value="all">All locations</option>
                <option value="near_home">Near home</option>
                <option value="in_state">In state</option>
                <option value="out_of_state">Out of state</option>
                <option value="online">Online</option>
                <option value="anywhere">Anywhere</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              <div className="mb-1">Cost</div>
              <select value={costFilter} onChange={(e) => setCostFilter(e.target.value as CostFilter)} className="w-full rounded border p-2">
                <option value="all">All cost levels</option>
                <option value="lower_cost">Lower cost</option>
                <option value="standard_cost">Standard cost</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              <div className="mb-1">Sort by</div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full rounded border p-2">
                <option value="best_match">Best match</option>
                <option value="pathway">Pathway</option>
                <option value="location">Location</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Complete onboarding to see your personalized ScholarScout matches.
        </div>
      )}

      {matches.length > 0 && filteredMatches.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          No matches fit your current filters. Try widening your filters.
        </div>
      )}

      {filteredMatches.map((m) => {
        const saved = favoriteIds.includes(m.id)

        return (
          <div key={m.id} className="mb-3 rounded border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold">{m.name}</div>
              <button
                type="button"
                onClick={() => toggleFavorite(m.id)}
                className={`rounded px-3 py-1 text-xs font-medium ${saved ? 'bg-black text-white' : 'border'}`}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
            <div className="text-sm text-gray-500">Score: {m.score}</div>
            <div className="text-sm">{m.description}</div>
            <div className="mt-2 text-xs text-gray-500">
              {m.pathway} · {m.locationType} · {m.lowCost ? 'lower cost' : 'standard cost'}
            </div>
            <ul className="mt-2 text-xs">
              {m.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        )
      })}
    </main>
  )
}
