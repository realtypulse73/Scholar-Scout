'use client'

import { useEffect, useState } from 'react'
import { matchStudentToOpportunities } from '../../lib/recommendationEngine'
import { opportunities } from '../../lib/mockOpportunities'
import { MatchResult } from '../../lib/types'

const STORAGE_KEY = 'scholarscout-profile'

export default function Results() {
  const [matches, setMatches] = useState<MatchResult[]>([])

  useEffect(() => {
    try {
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

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">Your Matches</h1>

      {matches.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Complete onboarding to see your personalized ScholarScout matches.
        </div>
      )}

      {matches.map((m) => (
        <div key={m.id} className="mb-3 rounded border bg-white p-3">
          <div className="font-semibold">{m.name}</div>
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
      ))}
    </main>
  )
}
