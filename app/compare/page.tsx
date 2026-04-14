'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { opportunities } from '../../lib/mockOpportunities'
import { matchStudentToOpportunities } from '../../lib/recommendationEngine'
import { MatchResult } from '../../lib/types'

const COMPARE_KEY = 'scholarscout-compare'
const PROFILE_KEY = 'scholarscout-profile'

function fitLabel(score: number) {
  if (score >= 55) return 'Strong fit'
  if (score >= 35) return 'Good fit'
  return 'Possible fit'
}

export default function ComparePage() {
  const [ids, setIds] = useState<string[]>([])
  const [profile, setProfile] = useState<any | null>(null)

  useEffect(() => {
    const storedCompare = sessionStorage.getItem(COMPARE_KEY)
    if (storedCompare) setIds(JSON.parse(storedCompare))

    const storedProfile = sessionStorage.getItem(PROFILE_KEY)
    if (storedProfile) setProfile(JSON.parse(storedProfile))
  }, [])

  const items = useMemo(() => opportunities.filter((o) => ids.includes(o.id)), [ids])

  const scoredItems: MatchResult[] = useMemo(() => {
    if (!profile || items.length === 0) return []
    return matchStudentToOpportunities(profile, items)
  }, [profile, items])

  const bestId = scoredItems.length > 0 ? scoredItems[0].id : null

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Compare Programs</h1>
        <Link href="/favorites" className="text-sm underline">Back</Link>
      </div>

      {!profile && (
        <div className="mb-4 rounded border bg-white p-4 text-sm text-gray-600">
          Complete onboarding to calculate personalized fit scores.
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">
          Select programs to compare from your saved list.
        </div>
      )}

      {scoredItems.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {scoredItems.map((item) => (
            <div key={item.id} className="rounded border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{item.name}</div>
                {item.id === bestId && (
                  <div className="rounded bg-black px-2 py-1 text-[10px] font-medium text-white">
                    Best fit
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {item.pathway} · {item.locationType}
              </div>

              <div className="mt-3 rounded bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fit score
                </div>
                <div className="mt-1 text-2xl font-bold">{item.score}</div>
                <div className="text-xs text-gray-600">{fitLabel(item.score)}</div>
              </div>

              <div className="mt-2 text-sm">{item.description}</div>

              <div className="mt-3 text-xs">
                <div>Cost: {item.lowCost ? 'Lower cost' : 'Standard'}</div>
                <div>Min GPA: {item.minGpaBand}</div>
                <div>Support: {item.support.join(', ')}</div>
                <div>Interests: {item.interests.join(', ')}</div>
              </div>

              <div className="mt-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Why it fits
                </div>
                {item.reasons.length === 0 ? (
                  <div className="text-xs text-gray-500">No specific fit reasons yet.</div>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {item.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
