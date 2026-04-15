'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { opportunities } from '../../../lib/mockOpportunities'
import { matchStudentToOpportunities } from '../../../lib/recommendationEngine'
import { getDecisionAssistantSummary } from '../../../lib/decisionAssistant'
import { trackEvent } from '../../../lib/analytics'

const PROFILE_KEY = 'scholarscout-profile'

export default function ProgramDetailPage() {
  const { id } = useParams() as { id: string }
  const [profile, setProfile] = useState<any>(null)

  const program = opportunities.find((o) => o.id === id)

  useEffect(() => {
    const stored = sessionStorage.getItem(PROFILE_KEY)
    if (stored) setProfile(JSON.parse(stored))

    trackEvent('program_view', id)
  }, [id])

  if (!program) return <div className="p-4">Program not found</div>

  const scored = profile ? matchStudentToOpportunities(profile, opportunities) : []
  const thisScore = scored.find((s) => s.id === program.id)
  const ai = thisScore ? getDecisionAssistantSummary(thisScore.score, thisScore.reasons) : null

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/results" className="text-sm underline">← Back</Link>

      <h1 className="mt-4 text-xl font-bold">{program.name}</h1>

      {thisScore && (
        <div className="mt-3 bg-black text-white p-3 rounded">
          Fit Score: {thisScore.score}
        </div>
      )}

      {ai && (
        <div className="mt-3 border p-3 rounded">
          <div className="font-semibold">{ai.headline}</div>
          <div className="text-sm">{ai.guidance}</div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Link href={`/apply/${id}`} className="bg-black text-white p-3 rounded text-center" onClick={() => trackEvent('apply_start', id)}>
          Apply Now
        </Link>

        <button onClick={() => trackEvent('explore_click', id)} className="border p-3 rounded">
          Explore Program
        </button>
      </div>
    </main>
  )
}
