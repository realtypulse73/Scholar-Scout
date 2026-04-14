import { StudentProfile, Opportunity, MatchResult } from './types'

export function matchStudentToOpportunities(
  profile: StudentProfile,
  opportunities: Opportunity[]
): MatchResult[] {
  return opportunities
    .map((opp) => {
      let score = 0
      const reasons: string[] = []

      if (!opp.minGpaBand || profile.gpaBand) {
        score += 20
        reasons.push('GPA compatible')
      }

      const interestMatches = profile.interests.filter((i) =>
        opp.interests.includes(i)
      )

      if (interestMatches.length) {
        score += interestMatches.length * 8
        reasons.push('Matches your interests')
      }

      if (
        profile.locationPreference &&
        (profile.locationPreference === opp.locationType)
      ) {
        score += 10
        reasons.push('Location fit')
      }

      if (
        profile.pathwayPreference &&
        profile.pathwayPreference === opp.pathway
      ) {
        score += 15
        reasons.push('Preferred pathway')
      }

      if (profile.affordabilitySensitivity === '5' && opp.lowCost) {
        score += 15
        reasons.push('Affordable option')
      }

      const supportMatch = profile.supportNeeds.filter((s) =>
        opp.support.includes(s)
      )

      if (supportMatch.length) {
        score += supportMatch.length * 5
        reasons.push('Support available')
      }

      return { ...opp, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}
