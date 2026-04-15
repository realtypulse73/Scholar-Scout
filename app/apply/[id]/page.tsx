'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { opportunities } from '../../../lib/mockOpportunities'
import { trackEvent } from '../../../lib/analytics'

export default function ApplyPage() {
  const { id } = useParams() as { id: string }
  const [step, setStep] = useState(1)

  const program = opportunities.find((o) => o.id === id)

  useEffect(() => {
    trackEvent('apply_start', id)
  }, [id])

  if (!program) return <div className="p-4">Program not found</div>

  function next() {
    trackEvent('apply_continue', id, { step })
    setStep(step + 1)
  }

  function complete() {
    trackEvent('apply_complete', id)

    if (program.applyUrl) {
      window.open(program.applyUrl, '_blank')
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href={`/program/${id}`} className="text-sm underline">← Back</Link>

      <h1 className="mt-4 text-xl font-bold">Apply: {program.name}</h1>

      <div className="mt-4 border p-3 rounded">
        <div className="text-sm">Step {step} of 3</div>

        {step === 1 && <div className="text-sm mt-2">Confirm your interest in this program.</div>}
        {step === 2 && <div className="text-sm mt-2">Prepare your documents and information.</div>}
        {step === 3 && <div className="text-sm mt-2">Submit your application.</div>}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {step < 3 ? (
          <button onClick={next} className="bg-black text-white p-3 rounded">
            Continue
          </button>
        ) : (
          <button onClick={complete} className="bg-black text-white p-3 rounded">
            Submit Application
          </button>
        )}
      </div>
    </main>
  )
}
