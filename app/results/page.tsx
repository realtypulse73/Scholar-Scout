'use client'

import { useEffect, useState } from 'react'
import { matchStudentToOpportunities } from '../../lib/recommendationEngine'
import { Opportunity, MatchResult } from '../../lib/types'

const STORAGE_KEY = 'scholarscout-profile'

const opportunities: Opportunity[] = [
  {
    id: '1',
    name: 'Community College IT Program',
    pathway: 'college',
    locationType: 'near_home',
    interests: ['Technology'],
    support: ['tutoring'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Affordable local IT program'
  },
  {
    id: '2',
    name: 'Electrical Apprenticeship',
    pathway: 'apprenticeship',
    locationType: 'in_state',
    interests: ['Trades'],
    support: ['mentorship'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Hands-on apprenticeship'
  }
]

export default function Results() {
  const [matches, setMatches] = useState<MatchResult[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return

    const profile = JSON.parse(stored)
    const results = matchStudentToOpportunities(profile, opportunities)
    setMatches(results)
  }, [])

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Your Matches</h1>

      {matches.map((m) => (
        <div key={m.id} className="border rounded p-3 mb-3">
          <div className="font-semibold">{m.name}</div>
          <div className="text-sm text-gray-500">Score: {m.score}</div>
          <div className="text-sm">{m.description}</div>
          <ul className="text-xs mt-2">
            {m.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  )
}
