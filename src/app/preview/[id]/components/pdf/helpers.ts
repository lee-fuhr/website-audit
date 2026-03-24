/**
 * Shared helpers for PDF generators.
 */

export const catNames: Record<string, string> = {
  firstImpression: 'First Impression',
  differentiation: 'Differentiation',
  customerClarity: 'Customer Clarity',
  storyStructure: 'Story Structure',
  trustSignals: 'Trust Signals',
  buttonClarity: 'CTA Clarity',
}

export function getSeverityColor(sev: string): string {
  if (sev === 'critical') return '#c00'
  if (sev === 'major' || sev === 'warning') return '#b45309'
  return '#666'
}

export function getScoreColor(score: number): string {
  if (score >= 7) return '#166534'
  if (score >= 4) return '#b45309'
  return '#c00'
}
