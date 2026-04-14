export function matchStudentToOpportunities(profile, opportunities) {
  return opportunities.map(o => ({...o, score: 50}))
}
