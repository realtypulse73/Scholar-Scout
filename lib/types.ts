export interface StudentProfile {
  gpaBand?: string
  interests: string[]
  locationPreference?: string
  pathwayPreference?: string
  affordabilitySensitivity: string
  supportNeeds: string[]
}

export interface Opportunity {
  id: string
  name: string
  pathway: string
  locationType: string
  interests: string[]
  support: string[]
  lowCost: boolean
  minGpaBand: string
  description: string
}

export interface MatchResult extends Opportunity {
  score: number
  reasons: string[]
}
