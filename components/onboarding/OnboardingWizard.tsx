'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type Profile = {
  gpaBand?: string
  interests: string[]
  locationPreference?: string
  pathwayPreference?: string
  affordabilitySensitivity: string
  supportNeeds: string[]
}

const STORAGE_KEY = 'scholarscout-profile'

const gpaOptions = [
  { id: 'below_2', label: 'Below 2.0' },
  { id: '2_2_5', label: '2.0 – 2.5' },
  { id: '2_5_3', label: '2.5 – 3.0' },
  { id: '3_plus', label: '3.0+' }
]

const interestOptions = [
  'Technology', 'Healthcare', 'Business', 'Trades', 'Law', 'Arts', 'Engineering', 'Education'
]

const pathwayOptions = [
  'college', 'trade', 'apprenticeship', 'certificate', 'military'
]

const locationOptions = [
  'near_home', 'in_state', 'out_of_state', 'online'
]

const supportOptions = [
  'tutoring', 'mentorship', 'job placement', 'financial aid', 'flex schedule'
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState<Profile>({
    interests: [],
    supportNeeds: [],
    affordabilitySensitivity: '3'
  })

  function next() {
    if (!validate()) return
    setStep((s) => s + 1)
  }

  function back() {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  function validate() {
    setError('')

    if (step === 0 && !profile.gpaBand) {
      setError('Select a GPA range')
      return false
    }

    if (step === 1 && profile.interests.length === 0) {
      setError('Select at least one interest')
      return false
    }

    if (step === 2 && !profile.locationPreference) {
      setError('Choose a location preference')
      return false
    }

    if (step === 3 && !profile.pathwayPreference) {
      setError('Choose a pathway')
      return false
    }

    return true
  }

  function toggle(arr: string[], value: string) {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value]
  }

  function finish() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      // Non-blocking fallback for restricted browsers.
    }

    router.push('/results')
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 text-sm text-gray-500">Step {step + 1} of 7</div>

      {error && (
        <div role="alert" className="mb-3 rounded bg-red-50 p-2 text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Your GPA range</h2>
          <div className="grid gap-2">
            {gpaOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setProfile({ ...profile, gpaBand: o.id })}
                className={`rounded border p-3 ${profile.gpaBand === o.id ? 'bg-black text-white' : ''}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Your interests</h2>
          <div className="grid grid-cols-2 gap-2">
            {interestOptions.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setProfile({ ...profile, interests: toggle(profile.interests, i) })}
                className={`rounded border p-2 ${profile.interests.includes(i) ? 'bg-black text-white' : ''}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Location preference</h2>
          <div className="grid gap-2">
            {locationOptions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setProfile({ ...profile, locationPreference: o })}
                className={`rounded border p-3 ${profile.locationPreference === o ? 'bg-black text-white' : ''}`}
              >
                {o.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Preferred pathway</h2>
          <div className="grid gap-2">
            {pathwayOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile({ ...profile, pathwayPreference: p })}
                className={`rounded border p-3 ${profile.pathwayPreference === p ? 'bg-black text-white' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Affordability sensitivity</h2>
          <input
            type="range"
            min="1"
            max="5"
            value={profile.affordabilitySensitivity}
            onChange={(e) => setProfile({ ...profile, affordabilitySensitivity: e.target.value })}
            className="w-full"
          />
          <div className="mt-2 text-sm text-gray-500">1 = flexible · 5 = must be affordable</div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Support needs</h2>
          <div className="grid gap-2">
            {supportOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setProfile({ ...profile, supportNeeds: toggle(profile.supportNeeds, s) })}
                className={`rounded border p-2 ${profile.supportNeeds.includes(s) ? 'bg-black text-white' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Summary</h2>
          <pre className="rounded bg-gray-100 p-3 text-sm">{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={back} className="flex-1 rounded border p-3">
            Back
          </button>
        )}

        {step < 6 && (
          <button type="button" onClick={next} className="flex-1 rounded bg-black p-3 text-white">
            Next
          </button>
        )}

        {step === 6 && (
          <button type="button" onClick={finish} className="flex-1 rounded bg-black p-3 text-white">
            See matches
          </button>
        )}
      </div>
    </div>
  )
}
