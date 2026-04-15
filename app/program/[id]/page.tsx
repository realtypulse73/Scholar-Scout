'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { opportunities } from '../../../lib/mockOpportunities'
import { matchStudentToOpportunities } from '../../../lib/recommendationEngine'
import { getDecisionAssistantSummary } from '../../../lib/decisionAssistant'

const PROFILE_KEY = 'scholarscout-profile'

export default function ProgramDetailPage() {
  const { id } = useParams() as { id: string }
  const [profile, setProfile] = useState<any>(null)

  const program = opportunities.find((o) => o.id === id)

  useEffect(() => {
    const stored = sessionStorage.getItem(PROFILE_KEY)
    if (stored) setProfile(JSON.parse(stored))
  }, [])

  if (!program) return <div className="p-4">Program not found</div>

  const scored = profile
    ? matchStudentToOpportunities(profile, opportunities)
    : []

  const rankingIndex = scored.findIndex((s) => s.id === program.id)
  const topThree = scored.slice(0, 3)

  const thisScore = scored.find((s) => s.id === program.id)

  const ai = thisScore
    ? getDecisionAssistantSummary(thisScore.score, thisScore.reasons)
    : null

  const roi = program.tuitionEstimate && program.medianStartingSalary
    ? Math.round(program.medianStartingSalary / program.tuitionEstimate * 10) / 10
    : null

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/results" className="text-sm underline">← Back</Link>

      {/* Ranking Context */}
      {rankingIndex >= 0 && (
        <div className="mt-3 text-xs text-gray-600">
          Ranked #{rankingIndex + 1} for you
        </div>
      )}

      {topThree.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Top matches: {topThree.map(t => t.name).join(', ')}
        </div>
      )}

      <h1 className="mt-4 text-xl font-bold">{program.name}</h1>

      <div className="text-sm text-gray-500">
        {program.pathway} · {program.locationType}
      </div>

      {/* Fit Score */}
      {thisScore && (
        <div className="mt-3 rounded bg-black text-white p-3">
          <div className="text-xs">Fit Score</div>
          <div className="text-2xl font-bold">{thisScore.score}</div>
        </div>
      )}

      <p className="mt-3 text-sm">{program.description}</p>

      {/* AI Assistant */}
      {ai && (
        <div className="mt-4 border p-3 rounded bg-slate-50">
          <div className="text-xs font-semibold">AI Recommendation</div>
          <div className="text-sm font-medium mt-1">{ai.headline}</div>
          <div className="text-xs mt-1">{ai.guidance}</div>
        </div>
      )}

      {/* Tuition + ROI */}
      <div className="mt-4 border p-3 rounded">
        <div className="text-xs font-semibold">Cost & ROI</div>
        <div className="text-sm mt-1">Tuition: ${program.tuitionEstimate}</div>
        <div className="text-sm">Starting Salary: ${program.medianStartingSalary}</div>
        {roi && <div className="text-sm">ROI Score: {roi}</div>}
      </div>

      {/* Commute */}
      <div className="mt-4 border p-3 rounded">
        <div className="text-xs font-semibold">Location</div>
        {program.campusAddress && (
          <div className="text-sm">{program.campusAddress}</div>
        )}
        {program.commuteTimeMinutes !== undefined && (
          <div className="text-sm">Commute: {program.commuteTimeMinutes} mins</div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        {program.applyUrl ? (
          <a href={program.applyUrl} target="_blank" className="bg-black text-white p-3 rounded text-center">
            Apply Now
          </a>
        ) : (
          <button className="border p-3 rounded">Apply (Coming Soon)</button>
        )}

        {program.exploreUrl ? (
          <a href={program.exploreUrl} target="_blank" className="border p-3 rounded text-center">
            Explore Program
          </a>
        ) : (
          <button className="border p-3 rounded">Explore (Coming Soon)</button>
        )}
      </div>
    </main>
  )
}
