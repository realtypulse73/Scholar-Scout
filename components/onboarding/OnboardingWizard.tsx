'use client'

import { useState } from 'react'

type Profile = {
  gpaBand?: string
  interests: string[]
  locationPreference?: string
  pathwayPreference?: string
  affordabilitySensitivity?: string
  supportNeeds: string[]
}

const gpaOptions = [
  { id: 'below_2', label: 'Below 2.0' },
  { id: '2_2_5', label: '2.0 – 2.5' },
  { id: '2_5_3', label: '2.5 – 3.0' },
  { id: '3_plus', label: '3.0+' }
]

const interestOptions = [
  'Technology','Healthcare','Business','Trades','Law','Arts','Engineering','Education'
]

const pathwayOptions = [
  'college','trade','apprenticeship','certificate','military'
]

const locationOptions = [
  'near_home','in_state','out_of_state','online'
]

const supportOptions = [
  'tutoring','mentorship','job placement','financial aid','flex schedule'
]

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState<Profile>({
    interests: [],
    supportNeeds: []
  })

  function next() {
    if (!validate()) return
    setStep(s => s + 1)
  }

  function back() {
    setError('')
    setStep(s => Math.max(0, s - 1))
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
      ? arr.filter(v => v !== value)
      : [...arr, value]
  }

  return (
    <div className="max-w-md mx-auto p-4">

      <div className="mb-4 text-sm text-gray-500">
        Step {step + 1} of 6
      </div>

      {error && (
        <div role="alert" className="mb-3 p-2 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {step === 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your GPA range</h2>
          <div className="grid gap-2">
            {gpaOptions.map(o => (
              <button
                key={o.id}
                onClick={() => setProfile({...profile, gpaBand: o.id})}
                className={`p-3 rounded border ${profile.gpaBand === o.id ? 'bg-black text-white' : ''}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your interests</h2>
          <div className="grid grid-cols-2 gap-2">
            {interestOptions.map(i => (
              <button
                key={i}
                onClick={() => setProfile({
                  ...profile,
                  interests: toggle(profile.interests, i)
                })}
                className={`p-2 border rounded ${profile.interests.includes(i) ? 'bg-black text-white' : ''}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Location preference</h2>
          <div className="grid gap-2">
            {locationOptions.map(o => (
              <button
                key={o}
                onClick={() => setProfile({...profile, locationPreference: o})}
                className={`p-3 border rounded ${profile.locationPreference === o ? 'bg-black text-white' : ''}`}
              >
                {o.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Preferred pathway</h2>
          <div className="grid gap-2">
            {pathwayOptions.map(p => (
              <button
                key={p}
                onClick={() => setProfile({...profile, pathwayPreference: p})}
                className={`p-3 border rounded ${profile.pathwayPreference === p ? 'bg-black text-white' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Affordability sensitivity</h2>
          <input
            type="range"
            min="1"
            max="5"
            defaultValue="3"
            onChange={(e) => setProfile({...profile, affordabilitySensitivity: e.target.value})}
            className="w-full"
          />
          <div className="text-sm text-gray-500 mt-2">
            1 = flexible · 5 = must be affordable
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Support needs</h2>
          <div className="grid gap-2">
            {supportOptions.map(s => (
              <button
                key={s}
                onClick={() => setProfile({
                  ...profile,
                  supportNeeds: toggle(profile.supportNeeds, s)
                })}
                className={`p-2 border rounded ${profile.supportNeeds.includes(s) ? 'bg-black text-white' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {step > 0 && (
          <button onClick={back} className="flex-1 border p-3 rounded">
            Back
          </button>
        )}

        {step < 6 && (
          <button onClick={next} className="flex-1 bg-black text-white p-3 rounded">
            Next
          </button>
        )}
      </div>
    </div>
  )
}
