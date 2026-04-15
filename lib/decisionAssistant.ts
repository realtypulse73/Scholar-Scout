export function getDecisionAssistantSummary(score: number, reasons: string[]) {
  if (score >= 60) {
    return {
      headline: 'This is one of your strongest paths.',
      guidance: 'You should seriously consider applying now. This program aligns well with your goals and situation.'
    }
  }

  if (score >= 40) {
    return {
      headline: 'This is a solid option.',
      guidance: 'This could work well for you, especially if you value flexibility. Compare it with 1–2 other options before deciding.'
    }
  }

  return {
    headline: 'This is worth exploring.',
    guidance: 'This option may work depending on your priorities. Keep it as a backup while reviewing stronger matches.'
  }
}
